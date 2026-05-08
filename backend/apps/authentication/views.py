"""Authentication views for OTP and JWT authentication"""
import random
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from apps.users.models import User, OTPCode, Region
from apps.notifications.models import Notification
from .serializers import (
    PhoneSerializer, OTPSerializer, UserProfileSerializer,
    UserCreateSerializer, TokenResponseSerializer
)


class SendOTPView(APIView):
    """Send OTP code to phone number"""
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=PhoneSerializer,
        responses={
            200: openapi.Response('OTP sent successfully'),
            400: 'Bad Request',
            429: 'Too Many Requests'
        }
    )
    def post(self, request):
        serializer = PhoneSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': "Noto'g'ri telefon raqam formati"},
                status=status.HTTP_400_BAD_REQUEST
            )

        phone = serializer.validated_data['phone']

        # Check rate limiting (max 5 requests per day per phone)
        today = timezone.now().date()
        otp_count = OTPCode.objects.filter(
            phone=phone,
            created_at__date=today,
            is_used=False
        ).count()

        if otp_count >= 5:
            return Response(
                {'error': "Kunlik so'rovlar limiti oshdi. Ertaga qayta urinib ko'ring."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Generate 6-digit OTP
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

        # Create OTP record
        otp = OTPCode.objects.create(
            phone=phone,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        # TODO: Integrate with SMS service (Eskiz.uz or Playmobile)
        # For development, return the code in response
        # In production, send actual SMS
        is_development = True  # Change based on settings
        
        response_data = {
            'message': "SMS kod yuborildi",
            'expires_in': 300,  # 5 minutes in seconds
        }
        
        if is_development:
            response_data['code'] = code  # Only for development!

        return Response(response_data, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """Verify OTP code and authenticate user"""
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=OTPSerializer,
        responses={
            200: TokenResponseSerializer,
            400: 'Invalid or expired code',
        }
    )
    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        # Verify OTP
        try:
            otp = OTPCode.objects.filter(
                phone=phone,
                code=code,
                is_used=False,
                expires_at__gt=timezone.now()
            ).latest('created_at')
        except OTPCode.DoesNotExist:
            return Response(
                {'error': "Noto'g'ri yoki muddati o'tgan kod"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark OTP as used
        otp.is_used = True
        otp.save()

        # Get or create user
        is_new_user = False
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            # Create new user with minimal data
            user = User.objects.create(
                phone=phone,
                username=phone,  # Django requires username
                full_name='',
                role='coach'
            )
            is_new_user = True

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Serialize user data
        user_serializer = UserProfileSerializer(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data,
            'is_new_user': is_new_user
        }, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """Get and update user profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update user profile"""
        serializer = UserCreateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            # Return full profile data
            return Response(UserProfileSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Logout user by blacklisting refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Successfully logged out'})
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegionsListView(APIView):
    """Get list of Uzbekistan regions"""
    permission_classes = [AllowAny]

    def get(self, request):
        regions = Region.objects.filter(is_active=True).values(
            'id', 'name_uz', 'name_ru', 'code', 'is_tashkent'
        )
        return Response(list(regions))
