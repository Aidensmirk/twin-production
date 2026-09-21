from rest_framework import serializers

from apps.questions.serializers import QuestionSerializer
from .models import MatchResult


class MatchResultSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    prediction_text = serializers.CharField(source="prediction.predicted_text", read_only=True)
    confidence = serializers.IntegerField(source="prediction.confidence", read_only=True)
    patterns = serializers.JSONField(source="prediction.patterns", read_only=True)
    answer_text = serializers.CharField(source="answer.text", read_only=True)

    class Meta:
        model = MatchResult
        fields = (
            "id",
            "question",
            "prediction_text",
            "confidence",
            "patterns",
            "answer_text",
            "score",
            "match_level",
            "explanation",
            "change_detected",
            "change_note",
            "created_at",
        )
