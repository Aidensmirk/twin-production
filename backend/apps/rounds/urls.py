from django.urls import path

from .views import (
    AnswerOnboardingView,
    StartRoundView,
    SubmitRoundAnswerView,
    DashboardView,
    InsightsView,
    HistoryView,
    ExportDataView,
    DeleteDataView,
)

urlpatterns = [
    path("answers/onboarding/", AnswerOnboardingView.as_view(), name="answer-onboarding"),
    path("rounds/start/", StartRoundView.as_view(), name="round-start"),
    path("rounds/<int:prediction_id>/answer/", SubmitRoundAnswerView.as_view(), name="round-answer"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("insights/", InsightsView.as_view(), name="insights"),
    path("history/", HistoryView.as_view(), name="history"),
    path("privacy/export/", ExportDataView.as_view(), name="privacy-export"),
    path("privacy/delete/", DeleteDataView.as_view(), name="privacy-delete"),
]
