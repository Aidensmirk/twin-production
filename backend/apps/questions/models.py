from django.conf import settings
from django.db import models


class Question(models.Model):
    CATEGORY_CHOICES = [
        ("values", "Values"),
        ("money", "Money"),
        ("relationships", "Relationships"),
        ("risk", "Risk"),
        ("creativity", "Creativity"),
        ("goals", "Goals"),
        ("habits", "Habits"),
    ]

    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    text = models.TextField()
    is_onboarding = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

   
    
    is_generated = models.BooleanField(default=False)
    created_for = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="generated_questions",
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        prefix = "AI" if self.is_generated else "seed"
        return f"[{prefix}/{self.category}] {self.text[:60]}"
