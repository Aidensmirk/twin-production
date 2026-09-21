from django.core.management.base import BaseCommand
from apps.questions.models import Question

QUESTIONS = [
    ("v1", "values", "A friend asks you to lie for them in a small, harmless way. What do you do?", True),
    ("v2", "values", "You find out a company you like quietly does something you disagree with. Do you stop buying from them?", False),
    ("v3", "values", "Someone takes credit for your idea in a meeting. What's your first move?", False),
    ("v4", "values", "You're given a chance to win, but only by bending a rule nobody would notice. What do you choose?", False),

    ("m1", "money", "You suddenly receive KSh 100,000. What's the first thing you do with it?", True),
    ("m2", "money", "You can take a lower-paying job you'd love, or a higher-paying one you'd tolerate. Which do you pick?", False),
    ("m3", "money", "A friend asks to borrow a significant amount of money with no clear repayment plan. What do you say?", False),
    ("m4", "money", "You've saved for something specific, then a better opportunity to spend it appears. Do you switch plans?", False),

    ("r1", "relationships", "A close friend cancels on you for the third time this month. How do you handle it?", True),
    ("r2", "relationships", "You disagree strongly with someone you love about something that matters to you. What do you do?", False),
    ("r3", "relationships", "Someone you trust misses an important moment in your life. Do you tell them how it made you feel?", False),
    ("r4", "relationships", "You have to choose between showing up for a friend or protecting your own time. Which wins?", False),

    ("k1", "risk", "You're offered a big opportunity with a real chance of public failure. Do you take it?", True),
    ("k2", "risk", "You could stay somewhere safe and familiar, or move somewhere unfamiliar with more upside. What do you do?", False),
    ("k3", "risk", "You notice a problem no one has fixed yet. Do you try to fix it, or wait for someone more qualified?", False),
    ("k4", "risk", "You have a plan that's working. Someone suggests a riskier one that could work better. Do you switch?", False),

    ("c1", "creativity", "You have a free afternoon with no obligations. What do you actually do with it?", True),
    ("c2", "creativity", "You make something you're proud of, but almost no one notices it. How do you feel about that?", False),
    ("c3", "creativity", "You're stuck on a problem. Do you look for an existing solution, or try to invent your own?", False),
    ("c4", "creativity", "Someone criticizes something you made. What's your instinct?", False),

    ("g1", "goals", "You're a year from now, looking back. What would make this year feel worth it?", True),
    ("g2", "goals", "You realize a goal you've chased for years doesn't excite you anymore. What do you do?", False),
    ("g3", "goals", "You can reach a goal slowly and safely, or fast with real risk of stalling out. Which pace do you choose?", False),
    ("g4", "goals", "Something outside your control derails your plan. What's your first reaction?", False),

    ("h1", "habits", "It's the end of a long, hard day. What do you actually do to unwind?", True),
    ("h2", "habits", "You set a new routine for yourself. What usually happens by week three?", False),
    ("h3", "habits", "You're overwhelmed with too much to do. What's the first thing you drop?", False),
    ("h4", "habits", "Someone points out a habit of yours they think isn't serving you. What's your reaction?", False),
]


class Command(BaseCommand):
    help = "Seeds the TWIN question bank (idempotent -- safe to re-run)."

    def handle(self, *args, **options):
        created = 0
        for i, (slug, category, text, is_onboarding) in enumerate(QUESTIONS):
            _, was_created = Question.objects.update_or_create(
                slug=slug,
                defaults={
                    "category": category,
                    "text": text,
                    "is_onboarding": is_onboarding,
                    "order": i,
                },
            )
            created += int(was_created)
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(QUESTIONS)} questions ({created} newly created)."
            )
        )
