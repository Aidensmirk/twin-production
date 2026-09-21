"""
Question selection for prediction rounds.

Two jobs:
  next_round_question() -- pick the next unanswered question, favoring whichever
      category has the fewest completed rounds so coverage stays even and the
      twin doesn't over-fit to one area of the person's life.
  weakest_category()    -- pick the category to generate a NEW scenario for once
      the seeded bank is exhausted. Targets where the twin actually understands
      the person least well (lowest average match), because that's where a new
      question is most informative.
"""
import random

from django.db.models import Avg, Count, Q

from apps.rounds.models import MatchResult
from .models import Question


def available_questions(user):
    """Seeded questions plus this user's own generated ones -- never another user's."""
    return Question.objects.filter(is_onboarding=False).filter(
        Q(created_for__isnull=True) | Q(created_for=user)
    )


def next_round_question(user):
    answered_ids = Question.objects.filter(answers__user=user).values_list("id", flat=True)
    pool = list(available_questions(user).exclude(id__in=answered_ids))
    if not pool:
        return None

    counts = {choice: 0 for choice, _ in Question.CATEGORY_CHOICES}
    for row in (
        MatchResult.objects.filter(user=user)
        .values("question__category")
        .annotate(n=Count("id"))
    ):
        counts[row["question__category"]] = row["n"]

    min_count = min(counts[q.category] for q in pool)
    candidates = [q for q in pool if counts[q.category] == min_count]
    return random.choice(candidates)


def weakest_category(user):
    """
    The category where the twin's predictions have matched worst so far.
    Falls back to a random category if there's no round history yet.
    """
    rows = list(
        MatchResult.objects.filter(user=user)
        .values("question__category")
        .annotate(avg=Avg("score"), n=Count("id"))
        .order_by("avg")
    )
    if not rows:
        return random.choice([c for c, _ in Question.CATEGORY_CHOICES])

    seen = {r["question__category"] for r in rows}
    unexplored = [c for c, _ in Question.CATEGORY_CHOICES if c not in seen]
    if unexplored:
        return random.choice(unexplored)

    return rows[0]["question__category"]
