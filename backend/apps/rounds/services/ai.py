"""
The AI Twin itself.

Two responsibilities, kept deliberately separate:
  1. generate_prediction() -- called by StartRoundView, BEFORE the user answers.
  2. score_round()         -- called by SubmitRoundAnswerView, AFTER the user answers.

Both call the same constrained instruction style described in the TWIN blueprint:
use only supplied historical evidence, name the specific patterns used, and state
honest uncertainty rather than manufactured confidence.
"""
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from anthropic import Anthropic
from django.conf import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


PREDICTION_SYSTEM = (
    "You are the AI Twin inside a self-discovery product called TWIN. You are a "
    "predictive model of one specific user's future response, built only from the "
    "historical answers supplied to you. You do not know anything about this person "
    "beyond what is given. Identify the strongest relevant pattern(s) in their "
    "history, predict what they are likely to answer to the new question, and "
    "honestly state your confidence -- do not claim more certainty than the "
    "evidence supports. If the history is thin, say so plainly and keep confidence "
    "low. Never claim access to information you were not given. Respond ONLY with "
    "raw JSON, no markdown fences, no commentary, matching exactly this shape: "
    '{"prediction": "a 1-3 sentence prediction written as if describing what the '
    'person will likely say, in third person", "confidence": <integer 0-100>, '
    '"patterns": ["short phrase", "short phrase"]} -- patterns should be at most 3 '
    "short phrases (3-6 words each) naming the specific historical evidence used."
)

SCORING_SYSTEM = (
    "You are the scoring engine inside TWIN, a self-discovery product that compares "
    "an AI's prediction of a user's answer against their real answer. Judge semantic "
    "and decision-level similarity -- do the two answers point to the same "
    "real-world choice and underlying reasoning, not just similar wording. Be fair "
    "and precise, not flattering: a vague or generic prediction that happens to "
    "overlap in tone should not score as high as one that named the actual specific "
    "choice. Also note briefly whether the real answer suggests the person has "
    "changed from their established pattern. Respond ONLY with raw JSON, no "
    "markdown fences, matching exactly this shape: "
    '{"score": <integer 0-100>, "matchLevel": one of ["Uncanny match", "Strong '
    'match", "Partial match", "Divergent", "Total surprise"], "explanation": "2-3 '
    "sentences, written directly to the user, explaining why the score is what it "
    'is and referencing the specific patterns the twin used", "changeDetected": '
    'true or false, "changeNote": "1 sentence on what changed, or null"}'
)

SUMMARY_SYSTEM = (
    "You are the reflective layer of TWIN, an AI Twin built from one user's own "
    "answers and completed prediction rounds. Write a careful, human-sounding "
    "portrait of the user based only on the supplied evidence. Describe tendencies "
    "as observations, not fixed labels: never diagnose, insult, moralize, or make "
    "claims about protected traits. Include strengths and tensions, and name what "
    "the evidence does not establish. Use the user's own answers as evidence. "
    "Respond ONLY with raw JSON matching exactly this shape: "
    '{"headline":"a concise 3-8 word portrait", "summary":"3-5 sentences '
    'written directly to the user", "characteristics":[{"name":"short trait", '
    '"evidence":"one sentence grounded in their answers"}], "uncertainty":"one '
    'sentence about what the twin is still learning"}. Include 3-5 characteristics.'
)


class AIServiceError(Exception):
    pass


def _extract_json(text):
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise AIServiceError("No JSON object found in AI response.")
    return json.loads(text[start : end + 1])


def _call(system, user_content):
    if settings.AI_PROVIDER == "gemini":
        try:
            return _call_gemini(system, user_content)
        except AIServiceError as gemini_error:
            if not settings.AI_FALLBACK_TO_OLLAMA:
                raise gemini_error
            try:
                return _call_ollama(system, user_content)
            except AIServiceError as ollama_error:
                raise AIServiceError(
                    f"Gemini failed ({gemini_error}); Ollama fallback failed "
                    f"({ollama_error})"
                ) from ollama_error
    if settings.AI_PROVIDER == "ollama":
        return _call_ollama(system, user_content)

    try:
        resp = _get_client().messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1000,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
    except Exception as exc:
        raise AIServiceError(f"Anthropic API call failed: {exc}") from exc

    text = "".join(block.text for block in resp.content if getattr(block, "type", None) == "text")
    if not text:
        raise AIServiceError("Empty response from AI.")
    return text


def _call_gemini(system, user_content):
    if not settings.GEMINI_API_KEY:
        raise AIServiceError("GEMINI_API_KEY is not configured.")

    payload = json.dumps(
        {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system}\n\n{user_content}"}],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
                "maxOutputTokens": 256,
            },
        }
    ).encode("utf-8")
    request = Request(
        f"{settings.GEMINI_BASE_URL.rstrip('/')}/models/"
        f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=settings.AI_REQUEST_TIMEOUT) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise AIServiceError(f"Gemini request failed with HTTP {exc.code}.") from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise AIServiceError(f"Gemini request failed: {exc}") from exc

    try:
        text = result["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("Gemini returned no usable response.") from exc
    if not text:
        raise AIServiceError("Empty response from Gemini.")
    return text


def _call_ollama(system, user_content):
    payload = json.dumps(
        {
            "model": settings.OLLAMA_MODEL,
            "stream": False,
            "format": "json",
            "keep_alive": settings.OLLAMA_KEEP_ALIVE,
            "options": {
                "num_predict": settings.OLLAMA_NUM_PREDICT,
                "temperature": 0.2,
            },
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
        }
    ).encode("utf-8")
    request = Request(
        f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise AIServiceError(
            f"Ollama call failed. Is Ollama running with model "
            f"'{settings.OLLAMA_MODEL}'? {exc}"
        ) from exc

    text = result.get("message", {}).get("content", "")
    if not text:
        raise AIServiceError("Empty response from Ollama.")
    return text


def build_profile_summary(user, exclude_question_id=None):
    from apps.rounds.models import Answer

    qs = Answer.objects.filter(user=user).select_related("question")
    if exclude_question_id:
        qs = qs.exclude(question_id=exclude_question_id)
    lines = [f"[{a.question.category}] Q: {a.question.text} \u2192 A: {a.text}" for a in qs]
    return "\n".join(lines)


def generate_prediction(user, question):
    summary = build_profile_summary(user, exclude_question_id=question.id)
    user_content = (
        f"USER HISTORY:\n{summary or '(no history yet)'}\n\n"
        f"NEW QUESTION (category: {question.category}):\n{question.text}\n\n"
        "Predict this user's answer."
    )
    data = _extract_json(_call(PREDICTION_SYSTEM, user_content))
    try:
        confidence = max(0, min(100, int(data["confidence"])))
    except (KeyError, ValueError, TypeError):
        raise AIServiceError("AI response missing a valid confidence value.")
    if "prediction" not in data:
        raise AIServiceError("AI response missing a prediction.")
    return {
        "prediction": data["prediction"],
        "confidence": confidence,
        "patterns": list(data.get("patterns", []))[:3],
    }


QUESTION_SYSTEM = (
    "You write scenario questions for TWIN, a self-discovery product where an AI "
    "tries to predict a user's own answers. Write ONE new scenario question in the "
    "requested category that this specific user has not been asked before. A good "
    "TWIN question is concrete, poses a real decision with no obviously correct "
    "answer, can be answered in two or three sentences, and would genuinely test "
    "whether the patterns in their history hold. Avoid questions that merely "
    "rephrase ones they've already answered, avoid yes/no framing with an obvious "
    "socially-desirable answer, and never reference private details back at them as "
    "if you know more than you were told. Keep it under 30 words. Respond ONLY with "
    "raw JSON, no markdown fences, matching exactly this shape: "
    '{"text": "the question", "category": "the category you were given"}'
)


def generate_question(user, category, previous_texts):
    """
    Writes a fresh scenario for a user who has exhausted the seeded bank.
    `previous_texts` is passed so the model can avoid repeating existing questions.
    """
    seen = "\n".join(f"- {t}" for t in previous_texts)
    user_content = (
        f"CATEGORY TO WRITE FOR: {category}\n\n"
        f"QUESTIONS THIS USER HAS ALREADY BEEN ASKED (do not repeat or rephrase these):\n{seen}\n\n"
        "Write one new scenario question in the given category."
    )
    data = _extract_json(_call(QUESTION_SYSTEM, user_content))
    text = (data.get("text") or "").strip()
    if not text:
        raise AIServiceError("AI did not return question text.")
    return {"text": text, "category": data.get("category") or category}


def _level_from_score(score):
    if score >= 90:
        return "Uncanny match"
    if score >= 70:
        return "Strong match"
    if score >= 50:
        return "Partial match"
    if score >= 30:
        return "Divergent"
    return "Total surprise"


def score_round(question, prediction, actual_answer_text):
    user_content = (
        f"QUESTION ({question.category}): {question.text}\n\n"
        f"AI TWIN PREDICTED (confidence {prediction.confidence}%): {prediction.predicted_text}\n"
        f"Patterns twin used: {'; '.join(prediction.patterns)}\n\n"
        f"USER'S ACTUAL ANSWER: {actual_answer_text}\n\n"
        "Score the match."
    )
    data = _extract_json(_call(SCORING_SYSTEM, user_content))
    try:
        score = max(0, min(100, int(data["score"])))
    except (KeyError, ValueError, TypeError):
        raise AIServiceError("AI response missing a valid score value.")
    return {
        "score": score,
        "match_level": data.get("matchLevel") or _level_from_score(score),
        "explanation": data.get("explanation", ""),
        "change_detected": bool(data.get("changeDetected", False)),
        "change_note": data.get("changeNote"),
    }


def generate_summary(user, results):
    evidence = []
    for result in results:
        evidence.append(
            f"[{result.question.category}] Question: {result.question.text}\n"
            f"User answer: {result.answer.text}\n"
            f"Twin prediction: {result.prediction.predicted_text}\n"
            f"Match score: {result.score}/100"
        )
    data = _extract_json(
        _call(
            SUMMARY_SYSTEM,
            f"USER: {user.username}\n\nCOMPLETED ROUND EVIDENCE:\n"
            + "\n\n".join(evidence),
        )
    )
    characteristics = data.get("characteristics", [])
    if not isinstance(characteristics, list):
        raise AIServiceError("AI response returned invalid characteristics.")
    return {
        "headline": str(data.get("headline") or "A pattern is taking shape"),
        "summary": str(data.get("summary") or "Your twin is still learning from your choices."),
        "characteristics": characteristics[:5],
        "uncertainty": str(data.get("uncertainty") or "More rounds will make this portrait more precise."),
    }
