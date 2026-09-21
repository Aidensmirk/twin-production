from django.conf import settings
from django.db import models

from apps.questions.models import Question


class Answer(models.Model):
    """A user's real answer to a question -- from onboarding or from a completed round."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "question")
        ordering = ["created_at"]


class Prediction(models.Model):
    """
    The AI Twin's locked prediction for a question, generated and stored
    BEFORE the user is allowed to submit their real answer. See
    apps/rounds/views.StartRoundView -- the server, not the client, controls
    this sequence.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="predictions")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="predictions")
    predicted_text = models.TextField()
    confidence = models.PositiveIntegerField()
    patterns = models.JSONField(default=list, blank=True)
    locked_at = models.DateTimeField(auto_now_add=True)
    prediction_hash = models.CharField(max_length=64, blank=True)
    is_locked = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "question")

    def save(self, *args, **kwargs):
        if self.pk is not None:
            existing = Prediction.objects.get(pk=self.pk)
            if existing.is_locked:
                raise ValueError("Prediction is locked and cannot be modified.")
        super().save(*args, **kwargs)


class MatchResult(models.Model):
    """The reveal: comparison between a locked Prediction and the real Answer."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="match_results")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="match_results")
    prediction = models.OneToOneField(Prediction, on_delete=models.CASCADE, related_name="match_result")
    answer = models.OneToOneField(Answer, on_delete=models.CASCADE, related_name="match_result")
    score = models.PositiveIntegerField()
    match_level = models.CharField(max_length=32)
    explanation = models.TextField()
    change_detected = models.BooleanField(default=False)
    change_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ProfileVersion(models.Model):
    """A snapshot taken after each round, so long-term change is easy to chart."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile_versions")
    round_count = models.PositiveIntegerField()
    average_score = models.FloatField()
    streak = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class ConsentLog(models.Model):
    """Records what the user has agreed TWIN can use, and when."""

    SCOPE_CHOICES = [
        ("core_answers", "Core answers (onboarding + rounds)"),
        ("data_export", "Data export requested"),
        ("data_deletion", "Data deletion requested"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consent_logs")
    scope = models.CharField(max_length=64, choices=SCOPE_CHOICES)
    granted = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
