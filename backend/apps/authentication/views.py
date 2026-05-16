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
from django.contrib.auth import authenticate

from apps.users.models import User, OTPCode, Region
from apps.notifications.models import Notification
from .serializers import (
    PhoneSerializer, OTPSerializer, UserProfileSerializer,
    UserCreateSerializer, TokenResponseSerializer
)
from utils.sms_services import send_otp as send_sms_otp
from django.conf import settings


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

        # Send SMS via configured service
        sms_service = getattr(settings, 'SMS_SERVICE', 'mock')
        sms_result = send_sms_otp(phone, code, sms_service)
        
        response_data = {
            'message': "SMS kod yuborildi",
            'expires_in': 300,  # 5 minutes in seconds
        }
        
        # In development or mock mode, return the code
        if sms_service == 'mock' or not sms_result.get('success'):
            response_data['code'] = code  # Only for development/testing!
            if not sms_result.get('success'):
                response_data['sms_error'] = sms_result.get('error')

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
            # Check if user has completed onboarding
            is_new_user = not user.is_onboarded
        except User.DoesNotExist:
            # Create new user with minimal data
            user = User.objects.create(
                phone=phone,
                username=phone,  # Django requires username
                full_name='',
                role='coach'
            )
            is_new_user = True

        # ── 2FA gate ─────────────────────────────────────────────
        # Agar foydalanuvchi 2FA yoqgan bo'lsa, JWT tokenlar BERILMAYDI.
        # Buning o'rniga vaqtinchalik `two_factor_token` qaytariladi va
        # frontend foydalanuvchidan TOTP yoki recovery kod so'raydi.
        if user.two_factor_enabled and user.totp_secret:
            from apps.users.two_factor import issue_two_factor_token, TWO_FACTOR_TOKEN_TTL
            return Response({
                'requires_2fa': True,
                'two_factor_token': issue_two_factor_token(user),
                'expires_in': TWO_FACTOR_TOKEN_TTL,
            }, status=status.HTTP_200_OK)

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


class TwoFactorLoginView(APIView):
    """OTP'dan keyingi 2FA bosqichi — TOTP yoki recovery kod bilan kirish."""
    permission_classes = [AllowAny]

    def post(self, request):
        from apps.users.two_factor import (
            consume_two_factor_token,
            verify_totp_code,
            verify_and_consume_recovery_code,
        )

        token = str(request.data.get('two_factor_token', '')).strip()
        code = str(request.data.get('code', '')).strip()

        if not token or not code:
            return Response(
                {'detail': 'Token va kod kiritilishi shart'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = consume_two_factor_token(token)
        if not user:
            return Response(
                {'detail': "2FA tokeni yaroqsiz yoki muddati tugagan. Qayta kiring."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.two_factor_enabled:
            # Holatni mos kelmasligi — JWT berib qo'yaylik
            pass
        else:
            used_recovery = False
            if not verify_totp_code(user, code):
                if not verify_and_consume_recovery_code(user, code):
                    return Response(
                        {'detail': "Noto'g'ri kod"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                used_recovery = True

        refresh = RefreshToken.for_user(user)
        user_serializer = UserProfileSerializer(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data,
            'is_new_user': not user.is_onboarded,
            'used_recovery_code': bool(locals().get('used_recovery')),
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
    """Logout user"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Simple logout - frontend will clear tokens
        return Response({'message': 'Successfully logged out'})


class RegionsListView(APIView):
    """Get list of Uzbekistan regions"""
    permission_classes = [AllowAny]

    def get(self, request):
        regions = Region.objects.all().values(
            'id', 'name_uz', 'name_ru', 'code', 'is_tashkent'
        )
        return Response(list(regions))


class AdminLoginView(APIView):
    """Admin login with email and password"""
    permission_classes = []  # No token required

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            200: openapi.Response('Login successful'),
            400: 'Bad Request',
            401: 'Invalid credentials',
            403: 'Admin access required'
        }
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email va parol kiritish shart'},
                status=400
            )

        # Email orqali userni topamiz
        try:
            from apps.users.models import User
            user_obj = User.objects.filter(email=email).first()
            if not user_obj:
                raise User.DoesNotExist
        except User.DoesNotExist:
            return Response(
                {'detail': 'Email yoki parol noto\'g\'ri'},
                status=401
            )

        # Parolni tekshiramiz
        if not user_obj.check_password(password):
            return Response(
                {'detail': 'Email yoki parol noto\'g\'ri'},
                status=401
            )

        # Role tekshiruvi
        if user_obj.role not in ['super_admin', 'region_admin', 'viewer']:
            return Response(
                {'detail': 'Sizda admin huquqi yo\'q'},
                status=403
            )

        if not user_obj.is_active:
            return Response(
                {'detail': 'Hisob bloklangan'},
                status=403
            )

        # JWT token yaratish
        refresh = RefreshToken.for_user(user_obj)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user_obj.id),
                'full_name': user_obj.full_name,
                'email': user_obj.email,
                'role': user_obj.role,
                'region': user_obj.region.name_uz if user_obj.region else None,
            }
        })
