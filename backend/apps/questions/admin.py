from django.contrib import admin
from .models import Question


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("slug", "category", "is_onboarding", "is_generated", "created_for", "order")
    list_filter = ("category", "is_onboarding", "is_generated")
    search_fields = ("text", "slug")
