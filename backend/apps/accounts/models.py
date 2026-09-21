from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    """
    Extends the built-in Django User with TWIN-specific state.
    This is the lightweight "TwinProfile" referenced in the product blueprint --
    the deeper pattern data itself lives implicitly in Answer/MatchResult history,
    computed on demand rather than duplicated here.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="twin_profile"
    )
    onboarded = models.BooleanField(default=False)
    onboarding_index = models.PositiveIntegerField(default=0)
    streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TwinProfile<{self.user.username}>"
