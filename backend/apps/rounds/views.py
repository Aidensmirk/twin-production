import hashlib

from django.db import transaction
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.questions.models import Question
from apps.questions.selection import available_questions
from apps.questions.serializers import QuestionSerializer

from .models import Answer, ConsentLog, MatchResult, Prediction, ProfileVersion
from .serializers import MatchResultSerializer
from .services import ai



class AnswerOnboardingView(APIView):
    """
    Records a single onboarding answer -- no AI call happens here. Onboarding
    exists purely to seed enough history that the first real prediction round
    isn't a guess made from nothing.
    """

    def post(self, request):
        question_id = request.data.get("question_id")
        text = (request.data.get("text") or "").strip()
        if not question_id or not text:
            return Response({"detail": "question_id and text are required."}, status=400)

        question = get_object_or_404(Question, id=question_id, is_onboarding=True)

        if Answer.objects.filter(user=request.user, question=question).exists():
            return Response({"detail": "Already answered."}, status=409)

        Answer.objects.create(user=request.user, question=question, text=text)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.onboarding_index += 1
        total_onboarding = Question.objects.filter(is_onboarding=True).count()
        if profile.onboarding_index >= total_onboarding:
            profile.onboarded = True
            ConsentLog.objects.create(user=request.user, scope="core_answers", granted=True)
        profile.save()

        return Response(
            {
                "onboarded": profile.onboarded,
                "onboarding_index": profile.onboarding_index,
                "total_onboarding": total_onboarding,
            }
        )




class StartRoundView(APIView):
    """
    Step 1 of a round: the server generates the AI's prediction and locks it
    to the database BEFORE returning. The response deliberately excludes the
    prediction itself -- the client never receives it until after the real
    answer has been submitted. The frontend cannot skip or reorder this.
    """

    def post(self, request):
        question_id = request.data.get("question_id")
        if not question_id:
            return Response({"detail": "question_id is required."}, status=400)

   
        question = get_object_or_404(available_questions(request.user), id=question_id)

        if Answer.objects.filter(user=request.user, question=question).exists():
            return Response({"detail": "You've already answered this question."}, status=409)
        if Prediction.objects.filter(user=request.user, question=question).exists():
            existing = Prediction.objects.get(user=request.user, question=question)
            return Response({"prediction_id": existing.id, "question": QuestionSerializer(question).data})

        try:
            result = ai.generate_prediction(request.user, question)
        except ai.AIServiceError as exc:
            return Response({"detail": str(exc)}, status=502)

        digest_source = f"{result['prediction']}|{result['confidence']}|{question.id}|{request.user.id}"
        prediction = Prediction.objects.create(
            user=request.user,
            question=question,
            predicted_text=result["prediction"],
            confidence=result["confidence"],
            patterns=result["patterns"],
            prediction_hash=hashlib.sha256(digest_source.encode()).hexdigest(),
            is_locked=True,
        )

        return Response(
            {
                "prediction_id": prediction.id,
                "question": QuestionSerializer(question).data,
            },
            status=201,
        )


class SubmitRoundAnswerView(APIView):
    """
    Step 2 of a round: accepts the user's real answer, scores it against the
    already-locked Prediction, and reveals everything at once. Rejects the
    request if no locked prediction exists for this question+user, so the
    client cannot submit an answer that was never predicted against.
    """

    def post(self, request, prediction_id):
        text = (request.data.get("text") or "").strip()
        if not text:
            return Response({"detail": "text is required."}, status=400)

        prediction = get_object_or_404(Prediction, id=prediction_id, user=request.user)

        if hasattr(prediction, "match_result"):
            return Response({"detail": "This round has already been revealed."}, status=409)
        if Answer.objects.filter(user=request.user, question=prediction.question).exists():
            return Response({"detail": "This question has already been answered."}, status=409)

        try:
            scored = ai.score_round(prediction.question, prediction, text)
        except ai.AIServiceError as exc:
            return Response({"detail": str(exc)}, status=502)

        with transaction.atomic():
            answer = Answer.objects.create(user=request.user, question=prediction.question, text=text)
            match = MatchResult.objects.create(
                user=request.user,
                question=prediction.question,
                prediction=prediction,
                answer=answer,
                score=scored["score"],
                match_level=scored["match_level"],
                explanation=scored["explanation"],
                change_detected=scored["change_detected"],
                change_note=scored["change_note"],
            )

            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            if scored["score"] >= 70:
                profile.streak += 1
                profile.best_streak = max(profile.best_streak, profile.streak)
            else:
                profile.streak = 0
            profile.save()

            round_count = MatchResult.objects.filter(user=request.user).count()
            avg = MatchResult.objects.filter(user=request.user).aggregate(a=Avg("score"))["a"] or 0
            ProfileVersion.objects.create(
                user=request.user,
                round_count=round_count,
                average_score=round(avg, 1),
                streak=profile.streak,
            )

        return Response(MatchResultSerializer(match).data, status=201)


class DashboardView(APIView):
    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        results = MatchResult.objects.filter(user=request.user)
        avg = results.aggregate(a=Avg("score"))["a"]

        by_cat = {c: {"count": 0, "avg": None} for c, _ in Question.CATEGORY_CHOICES}
        for row in results.values("question__category").annotate(n=Count("id"), a=Avg("score")):
            by_cat[row["question__category"]] = {"count": row["n"], "avg": round(row["a"], 1)}

        recent = MatchResultSerializer(results.order_by("-created_at")[:4], many=True).data

        return Response(
            {
                "onboarded": profile.onboarded,
                "round_count": results.count(),
                "average_score": round(avg, 1) if avg is not None else None,
                "streak": profile.streak,
                "best_streak": profile.best_streak,
                "by_category": by_cat,
                "recent": recent,
            }
        )


class InsightsView(APIView):
    def get(self, request):
        results = MatchResult.objects.filter(user=request.user).order_by("created_at")
        n = results.count()
        if n == 0:
            return Response({"round_count": 0})

        avg_score = round(sum(r.score for r in results) / n, 1)
        avg_conf = round(sum(r.prediction.confidence for r in results) / n, 1)

        by_cat = {c: {"count": 0, "avg": None} for c, _ in Question.CATEGORY_CHOICES}
        for row in results.values("question__category").annotate(n=Count("id"), a=Avg("score")):
            by_cat[row["question__category"]] = {"count": row["n"], "avg": round(row["a"], 1)}

        timeline = [{"score": r.score, "date": r.created_at.isoformat()} for r in results]

        return Response(
            {
                "round_count": n,
                "average_score": avg_score,
                "average_confidence": avg_conf,
                "calibration_gap": round(avg_conf - avg_score, 1),
                "by_category": by_cat,
                "timeline": timeline,
            }
        )


class SummaryView(APIView):
    def get(self, request):
        results = list(
            MatchResult.objects.filter(user=request.user)
            .select_related("question", "answer", "prediction")
            .order_by("created_at")
        )
        minimum_rounds = 3
        if len(results) < minimum_rounds:
            return Response({"ready": False, "rounds_needed": minimum_rounds - len(results)})

        try:
            summary = ai.generate_summary(request.user, results)
        except ai.AIServiceError as exc:
            return Response({"detail": str(exc)}, status=502)
        return Response({"ready": True, "round_count": len(results), **summary})


class HistoryView(APIView):
    def get(self, request):
        results = MatchResult.objects.filter(user=request.user).order_by("-created_at")
        return Response(MatchResultSerializer(results, many=True).data)


class ExportDataView(APIView):
    def get(self, request):
        ConsentLog.objects.create(user=request.user, scope="data_export", granted=True)

        answers = list(
            Answer.objects.filter(user=request.user).values(
                "question__slug", "question__category", "question__text", "text", "created_at"
            )
        )
        results = MatchResultSerializer(
            MatchResult.objects.filter(user=request.user).order_by("created_at"), many=True
        ).data
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        return Response(
            {
                "user": {"username": request.user.username, "email": request.user.email},
                "profile": {
                    "onboarded": profile.onboarded,
                    "streak": profile.streak,
                    "best_streak": profile.best_streak,
                },
                "answers": answers,
                "rounds": results,
            }
        )


class DeleteDataView(APIView):
    """
    Wipes all TWIN data for the account (answers, predictions, match results,
    profile versions, consent logs) and resets the profile, without deleting
    the login itself -- so the person can start a fresh twin without losing
    their account.
    """

    def delete(self, request):
        ConsentLog.objects.create(user=request.user, scope="data_deletion", granted=True)

        Answer.objects.filter(user=request.user).delete()
        Prediction.objects.filter(user=request.user).delete()
        MatchResult.objects.filter(user=request.user).delete()
        ProfileVersion.objects.filter(user=request.user).delete()

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.onboarded = False
        profile.onboarding_index = 0
        profile.streak = 0
        profile.best_streak = 0
        profile.save()

        return Response({"detail": "All TWIN data deleted."}, status=200)
