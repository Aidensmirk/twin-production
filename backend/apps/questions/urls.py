from django.urls import path
from .views import OnboardingQuestionsView, NextRoundQuestionView, GenerateQuestionView

urlpatterns = [
    path("onboarding/", OnboardingQuestionsView.as_view(), name="questions-onboarding"),
    path("next/", NextRoundQuestionView.as_view(), name="questions-next"),
    path("generate/", GenerateQuestionView.as_view(), name="questions-generate"),
]
