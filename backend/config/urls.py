from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def health(request):
    return JsonResponse({"status": "ok", "service": "twin-api"})

urlpatterns = [
    path("", health, name="health"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/questions/", include("apps.questions.urls")),
    path("api/", include("apps.rounds.urls")),
]
