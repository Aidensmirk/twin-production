import uuid

from django.core.management import call_command
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.rounds.services import ai

from .models import Question
from .selection import next_round_question, weakest_category, available_questions
from .serializers import QuestionSerializer


class OnboardingQuestionsView(APIView):
    def get(self, request):
        qs = Question.objects.filter(is_onboarding=True)
        if not qs.exists():
            call_command("seed_questions")
            qs = Question.objects.filter(is_onboarding=True)
        return Response(QuestionSerializer(qs, many=True).data)


class NextRoundQuestionView(APIView):
    """
    Returns the next unanswered question. If the bank is exhausted, `question` is
    null but `can_generate` is true -- the client should then POST to
    /api/questions/generate/ to have the twin write a fresh scenario.
    """

    def get(self, request):
        q = next_round_question(request.user)
        if q is None:
            return Response({"question": None, "can_generate": True})
        return Response({"question": QuestionSerializer(q).data, "can_generate": False})


class GenerateQuestionView(APIView):
    """
    Writes a brand-new scenario for this user, targeting the category where the
    twin currently understands them least well. The question is saved scoped to
    this user, so the normal round flow (and its prediction lock) works on it
    exactly as it does on a seeded question.
    """

    def post(self, request):
        category = request.data.get("category") or weakest_category(request.user)

        previous = list(
            available_questions(request.user)
            .filter(category=category)
            .values_list("text", flat=True)[:40]
        )

        try:
            result = ai.generate_question(request.user, category, previous)
        except ai.AIServiceError as exc:
            return Response({"detail": str(exc)}, status=502)

        valid = {c for c, _ in Question.CATEGORY_CHOICES}
        final_category = result["category"] if result["category"] in valid else category

        question = Question.objects.create(
            slug=f"gen-{uuid.uuid4().hex[:12]}",
            category=final_category,
            text=result["text"],
            is_onboarding=False,
            is_generated=True,
            created_for=request.user,
            order=10000,
        )
        return Response(QuestionSerializer(question).data, status=201)
