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
from utils.email_service import send_email_otp
from django.conf import settings


def _mask_email(email: str) -> str:
    """Foydalanuvchiga ko'rsatish uchun email manzilni yashirish (a****@gmail.com)."""
    if not email or '@' not in email:
        return ''
    local, _, domain = email.partition('@')
    if len(local) <= 2:
        masked_local = local[:1] + '*'
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"


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
        provided_email = (request.data.get('email') or '').strip().lower()

        # ── Foydalanuvchining email manzilini aniqlaymiz ──────────
        # 1) Agar telefon DB'da mavjud va emaili bo'lsa — o'sha email ishlatiladi
        # 2) Aks holda — foydalanuvchidan email kiritish so'raladi
        # 3) Agar email so'rovda kelgan bo'lsa — validatsiya qilamiz va ishlatamiz
        try:
            existing_user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            existing_user = None

        target_email = None
        if existing_user and existing_user.email:
            target_email = existing_user.email.strip().lower()
        elif provided_email:
            # Oddiy email validatsiyasi
            from django.core.validators import validate_email
            from django.core.exceptions import ValidationError
            try:
                validate_email(provided_email)
            except ValidationError:
                return Response(
                    {'error': "Noto'g'ri email format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target_email = provided_email
        else:
            # Frontend'ga email kerakligini bildiramiz
            return Response(
                {'requires_email': True, 'message': "Email kiritish kerak"},
                status=status.HTTP_200_OK,
            )

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

        # Create OTP record (email ham saqlanadi — VerifyOTPView'da user yaratishda ishlatiladi)
        otp = OTPCode.objects.create(
            phone=phone,
            email=target_email,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        # Kodni emailga yuborish
        email_ok = send_email_otp(target_email, code)

        response_data = {
            'message': "Tasdiqlash kodi emailga yuborildi",
            'expires_in': 300,
            'email_masked': _mask_email(target_email),
        }

        # Development'da console backend bo'lsa yoki yuborilmasa — kodni qaytaramiz
        email_backend = getattr(settings, 'EMAIL_BACKEND', '')
        if 'console' in email_backend or not email_ok:
            response_data['code'] = code
            if not email_ok:
                response_data['email_error'] = "Email yuborilmadi"

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
            # Create new user with minimal data (email OTP jarayonida saqlangan)
            user = User.objects.create(
                phone=phone,
                username=phone,  # Django requires username
                email=(otp.email or None),
                full_name='',
                role='coach'
            )
            is_new_user = True

        # Agar mavjud user'ning emaili bo'lmasa va OTP'da email bo'lsa — biriktiramiz
        if not user.email and otp.email:
            user.email = otp.email
            user.save(update_fields=['email'])

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

        # last_login ni yangilash (Django auto-update faqat login() chaqirilganda ishlaydi,
        # biz esa to'g'ridan-to'g'ri JWT bermoqdamiz — qo'lda yangilaymiz)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

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
        # last_login ni yangilash — 2FA muvaffaqiyatli o'tdi
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

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

        # Email orqali userni topamiz.
        # Bir xil email bilan bir nechta user bo'lishi mumkin (coach + region_admin),
        # shuning uchun darhol admin rollar bilan cheklaymiz va eng yuqori
        # imtiyozli adminni tanlaymiz.
        from apps.users.models import User
        admin_roles = ['super_admin', 'region_admin', 'staff', 'viewer']
        qs = User.objects.filter(
            email__iexact=email,
            is_active=True,
            role__in=admin_roles,
        )
        try:
            qs = qs.filter(deleted_at__isnull=True)
        except Exception:
            pass
        role_priority = {'super_admin': 0, 'region_admin': 1, 'staff': 2, 'viewer': 3}
        candidates = sorted(qs, key=lambda u: role_priority.get(u.role, 99))

        # Parolga mos keladigan birinchi adminni tanlaymiz.
        # Bu shuningdek bir xil email bilan eski (esiz parol bilan) coach
        # va yangi parol o'rnatilgan region_admin bo'lsa to'g'ri ishlashini
        # ta'minlaydi.
        user_obj = None
        for candidate in candidates:
            if candidate.check_password(password):
                user_obj = candidate
                break

        if not user_obj:
            return Response(
                {'detail': 'Email yoki parol noto\'g\'ri'},
                status=401
            )

        # JWT token yaratish
        refresh = RefreshToken.for_user(user_obj)

        # last_login ni yangilash (admin paneldagi "Oxirgi kirish" ustuni uchun)
        user_obj.last_login = timezone.now()
        user_obj.save(update_fields=['last_login'])

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user_obj.id),
                'full_name': user_obj.full_name,
                'email': user_obj.email,
                'role': user_obj.role,
                'region': user_obj.region.name_uz if user_obj.region else None,
                'region_id': user_obj.region_id,
            }
        })


# ══════════════════════════════════════════════════════════════════
# ADMIN PASSWORD RESET (Forgot Password)
# ══════════════════════════════════════════════════════════════════
ADMIN_ROLES = ('super_admin', 'region_admin', 'staff', 'viewer')


class AdminForgotPasswordView(APIView):
    """Admin parolini tiklash uchun emailga xavfsiz havola yuboradi.

    Xavfsizlik: foydalanuvchi mavjudligini oshkor qilmaslik uchun
    email topilmasa ham 200 qaytaradi.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from django.core.mail import EmailMultiAlternatives
        import logging
        logger = logging.getLogger(__name__)

        email = str(request.data.get('email', '')).strip().lower()
        if not email or '@' not in email:
            return Response(
                {'detail': "Yaroqli email kiriting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generic success javobi — foydalanuvchi bor-yo'qligini oshkor qilmaymiz
        generic_ok = Response(
            {'detail': "Agar ushbu email tizimda ro'yxatdan o'tgan bo'lsa, "
                       "parolni tiklash havolasi yuborildi."},
            status=status.HTTP_200_OK,
        )

        # Bir xil email bilan bir nechta user bo'lishi mumkin (masalan, coach
        # va region_admin). Shuning uchun darhol admin rollar bilan cheklaymiz —
        # aks holda .first() coach'ni tanlab "topilmadi" deydi.
        qs = User.objects.filter(
            email__iexact=email,
            is_active=True,
            role__in=ADMIN_ROLES,
        )
        try:
            qs = qs.filter(deleted_at__isnull=True)
        except Exception:
            pass
        # Eng yuqori darajadagi rolni afzal ko'ramiz (super_admin > region_admin > staff > viewer)
        role_priority = {'super_admin': 0, 'region_admin': 1, 'staff': 2, 'viewer': 3}
        user = sorted(qs, key=lambda u: role_priority.get(u.role, 99))[:1]
        user = user[0] if user else None

        if not user:
            logger.info(f"Forgot-password: admin email topilmadi — {email}")
            return generic_ok

        # Token + uid yaratamiz
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Frontend URL
        frontend_url = (
            getattr(settings, 'FRONTEND_URL', None)
            or request.META.get('HTTP_ORIGIN')
            or 'http://localhost:3000'
        )
        reset_link = f"{frontend_url.rstrip('/')}/admin/reset-password/{uid}/{token}"

        subject = "UFA Admin — Parolni tiklash"
        display_name = user.full_name or user.email
        text_body = (
            f"Assalomu alaykum, {display_name}!\n\n"
            f"Sizning UFA admin hisobingiz uchun parolni tiklash so'rovi qabul qilindi.\n"
            f"Quyidagi havolaga bosib yangi parol o'rnatishingiz mumkin (24 soat amal qiladi):\n\n"
            f"{reset_link}\n\n"
            f"Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.\n\n"
            f"— O'zbekiston Murabbiylar ta'limi tizimi\n"
        )
        html_body = f"""\
<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 12px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#0D3B6E 0%,#1A56A0 100%);padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;">O'zbekiston Murabbiylar ta'limi</h1>
            <p style="margin:6px 0 0;color:#cfe0f5;font-size:14px;">Admin paneli</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 12px;color:#0D3B6E;font-size:20px;">Parolni tiklash</h2>
            <p style="margin:0 0 16px;line-height:1.6;">
              Assalomu alaykum, <strong>{display_name}</strong>!
            </p>
            <p style="margin:0 0 16px;line-height:1.6;">
              Sizning UFA admin hisobingiz uchun parolni tiklash so'rovi qabul qilindi.
              Quyidagi tugmani bosib yangi parol o'rnatishingiz mumkin
              (havola <strong>24 soat</strong> amal qiladi):
            </p>
            <p style="text-align:center;margin:28px 0;">
              <a href="{reset_link}"
                 style="display:inline-block;background:#1A56A0;color:#fff;text-decoration:none;
                        font-weight:600;padding:14px 28px;border-radius:8px;">
                Parolni tiklash
              </a>
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#666;">
              Yoki ushbu havolani brauzerga nusxalang:
            </p>
            <p style="margin:0 0 24px;word-break:break-all;font-size:12px;
                      background:#f4f6f9;padding:10px;border-radius:6px;color:#1A56A0;">
              {reset_link}
            </p>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
              Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldirishingiz mumkin —
              parolingiz o'zgarmaydi.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;
                     border-top:1px solid #eee;font-size:12px;color:#888;">
            © 2026 O'zbekiston Murabbiylar ta'limi · Avtomatik xabar, javob bermang.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@ufa.local'),
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Forgot-password email yuborildi: {user.email}")
        except Exception as e:
            logger.error(f"Forgot-password email yuborilmadi ({user.email}): {e}")
            # Baribir generic_ok qaytaramiz

        return generic_ok


class AdminResetPasswordView(APIView):
    """uid + token + new_password orqali admin parolini almashtiradi."""
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        uid_b64 = request.data.get('uid', '')
        token = request.data.get('token', '')
        new_password = str(request.data.get('new_password', ''))

        # Parolni tekshirish (frontend bilan bir xil qoidalar)
        if len(new_password) < 8:
            return Response(
                {'new_password': ['Kamida 8 ta belgi']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not any(c.isupper() for c in new_password):
            return Response(
                {'new_password': ['Kamida 1 ta katta harf kerak']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not any(c.isdigit() for c in new_password):
            return Response(
                {'new_password': ['Kamida 1 ta raqam kerak']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # uid → user
        try:
            user_id = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=user_id, is_active=True, deleted_at__isnull=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': "Havola yaroqsiz yoki muddati o'tgan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role not in ADMIN_ROLES:
            return Response(
                {'detail': "Bu havola admin foydalanuvchi uchun emas"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': "Havola yaroqsiz yoki muddati o'tgan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Eski JWT tokenlarni blacklist qilish
        try:
            from rest_framework_simplejwt.token_blacklist.models import (
                BlacklistedToken,
                OutstandingToken,
            )
            for t in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=t)
        except Exception:
            pass

        return Response({'detail': "Parol muvaffaqiyatli yangilandi"})
