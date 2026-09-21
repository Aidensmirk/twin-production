from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        UserProfile.objects.get_or_create(user=user)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "username",
            "email",
            "onboarded",
            "onboarding_index",
            "streak",
            "best_streak",
        )
