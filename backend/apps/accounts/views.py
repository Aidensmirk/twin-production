from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .serializers import RegisterSerializer, UserProfileSerializer


class RegisterView(generics.CreateAPIView):
    """
    Creates a user + their (empty, not-yet-onboarded) TwinProfile, and returns
    JWT tokens directly so the frontend can log the person straight into onboarding.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "profile": UserProfileSerializer(user.twin_profile).data,
            },
            status=201,
        )


class MeView(APIView):
    """Returns the current user's TwinProfile state -- used on app load to decide routing."""

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)
