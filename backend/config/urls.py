from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/questions/", include("apps.questions.urls")),
    path("api/", include("apps.rounds.urls")),
]
