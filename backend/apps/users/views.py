import io
import json
import zipfile
from datetime import datetime

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser

User = get_user_model()


def _user_to_dict(user, request):
    return {
        'id': str(user.id),
        'phone': user.phone,
        'full_name': user.full_name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'birth_date': str(user.birth_date) if user.birth_date else '',
        'gender': user.gender or 'male',
        'region': user.region.name_uz if user.region else None,
        'region_id': user.region.id if user.region else None,
        'role': user.role,
        'is_active': user.is_active,
        'avatar_url': request.build_absolute_uri(user.avatar.url) if user.avatar else user.avatar_url,
        'workplace': user.workplace,
        'job_title': user.job_title,
        'coaching_years': user.coaching_years,
        'language': user.language,
        'theme': user.theme,
        'notifications_enabled': user.notifications_enabled,
        'two_factor_enabled': user.two_factor_enabled,
        'created_at': str(user.created_at),
    }


class UserProfileView(APIView):
    """Get / Update current user profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_to_dict(request.user, request))

    def patch(self, request):
        user = request.user
        allowed = {
            'full_name', 'email', 'language', 'theme',
            'notifications_enabled', 'avatar_url', 'workplace',
            'birth_date', 'gender', 'region_id', 'job_title',
            'coaching_years',
        }
        for key, value in request.data.items():
            if key in allowed:
                if key == 'region_id' and value:
                    try:
                        from apps.users.models import Region
                        user.region = Region.objects.get(id=value)
                    except Region.DoesNotExist:
                        pass
                elif key == 'birth_date' and value:
                    from datetime import datetime
                    user.birth_date = datetime.strptime(value, '%Y-%m-%d').date()
                else:
                    setattr(user, key, value)
        user.save()
        return Response(_user_to_dict(user, request))


class ChangePasswordView(APIView):
    """Admin only — change password"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = request.data.get('current_password', '')
        new_pwd = request.data.get('new_password', '')

        if not request.user.check_password(current):
            return Response(
                {'current_password': ["Joriy parol noto'g'ri"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_pwd) < 8:
            return Response(
                {'new_password': ['Kamida 8 ta belgi']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not any(c.isupper() for c in new_pwd):
            return Response(
                {'new_password': ['Kamida 1 ta katta harf kerak']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not any(c.isdigit() for c in new_pwd):
            return Response(
                {'new_password': ['Kamida 1 ta raqam kerak']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_pwd)
        request.user.save()

        # Blacklist existing tokens (best effort)
        try:
            from rest_framework_simplejwt.token_blacklist.models import (
                BlacklistedToken,
                OutstandingToken,
            )
            for token in OutstandingToken.objects.filter(user=request.user):
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            pass

        return Response({'detail': "Parol muvaffaqiyatli o'zgartirildi"})


class TwoFactorSetupView(APIView):
    """Generate TOTP secret + QR code"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            import base64
            from io import BytesIO
            import pyotp
            import qrcode
        except ImportError:
            return Response(
                {'detail': 'pyotp/qrcode kutubxonalari o\'rnatilmagan'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        user = request.user
        if not user.totp_secret:
            user.totp_secret = pyotp.random_base32()
            user.save(update_fields=['totp_secret'])

        totp = pyotp.TOTP(user.totp_secret)
        uri = totp.provisioning_uri(
            name=user.phone,
            issuer_name='UFF Murabbiy Tizimi',
        )

        qr = qrcode.make(uri)
        buffer = BytesIO()
        qr.save(buffer, format='PNG')
        qr_b64 = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()

        return Response({'qr_code': qr_b64, 'secret': user.totp_secret})


class TwoFactorVerifyView(APIView):
    """Verify TOTP code and enable 2FA"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            import pyotp
        except ImportError:
            return Response({'detail': 'pyotp o\'rnatilmagan'}, status=500)

        code = str(request.data.get('code', '')).strip()
        if not request.user.totp_secret:
            return Response(
                {'detail': 'Setup qilinmagan'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(request.user.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {'detail': "Noto'g'ri kod"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.two_factor_enabled = True
        request.user.save(update_fields=['two_factor_enabled'])
        return Response({'detail': '2FA yoqildi'})


class TwoFactorDisableView(APIView):
    """Disable 2FA (requires valid TOTP code)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            import pyotp
        except ImportError:
            return Response({'detail': 'pyotp o\'rnatilmagan'}, status=500)

        code = str(request.data.get('code', '')).strip()
        if not request.user.totp_secret:
            return Response({'detail': 'Setup qilinmagan'}, status=400)

        totp = pyotp.TOTP(request.user.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response({'detail': "Noto'g'ri kod"}, status=400)

        request.user.two_factor_enabled = False
        request.user.totp_secret = None
        request.user.save(update_fields=['two_factor_enabled', 'totp_secret'])
        return Response({'detail': "2FA o'chirildi"})


class ExportUserDataView(APIView):
    """Export user data as ZIP archive"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        items = request.data.get('items') or ['profile', 'applications', 'licenses']
        user = request.user

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            if 'profile' in items:
                profile = {
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'email': user.email or '',
                    'region': user.region.name_uz if user.region else '',
                    'role': user.role,
                    'joined': str(user.date_joined),
                }
                zf.writestr(
                    'profile.json',
                    json.dumps(profile, ensure_ascii=False, indent=2),
                )

            if 'applications' in items:
                try:
                    from apps.applications.models import Application
                    apps_qs = Application.objects.filter(user=user).select_related(
                        'license_type', 'region'
                    )
                    apps_data = []
                    for a in apps_qs:
                        apps_data.append({
                            'id': str(a.id),
                            'status': a.status,
                            'license_type': getattr(a.license_type, 'code', None),
                            'region': getattr(a.region, 'name_uz', None),
                            'workplace': a.workplace,
                            'job_title': a.job_title,
                            'submitted_at': str(a.submitted_at) if getattr(a, 'submitted_at', None) else None,
                        })
                    zf.writestr(
                        'applications.json',
                        json.dumps(apps_data, ensure_ascii=False, indent=2),
                    )
                except Exception as exc:
                    zf.writestr('applications.error.txt', f'Export xatosi: {exc}')

            if 'licenses' in items:
                try:
                    from apps.licenses.models import License
                    licenses = License.objects.filter(user=user)
                    lic_data = []
                    for lic in licenses:
                        lic_data.append({
                            'id': str(lic.id),
                            'license_type': getattr(lic.license_type, 'code', None),
                            'issued_at': str(getattr(lic, 'issued_at', '') or ''),
                            'expires_at': str(getattr(lic, 'expires_at', '') or ''),
                            'pdf_url': getattr(lic, 'pdf_url', None),
                        })
                    zf.writestr(
                        'licenses.json',
                        json.dumps(lic_data, ensure_ascii=False, indent=2),
                    )
                except Exception as exc:
                    zf.writestr('licenses.error.txt', f'Export xatosi: {exc}')

            readme = (
                "UFF Ma'lumotlar Eksporti\n"
                "========================\n"
                f"Eksport sanasi: {datetime.now().strftime('%d.%m.%Y %H:%M')}\n"
                f"Foydalanuvchi: {user.full_name or user.phone}\n"
                f"Telefon: {user.phone}\n\n"
                "Tarkib:\n"
                " - profile.json: Shaxsiy ma'lumotlar\n"
                " - applications.json: Arizalar tarixi\n"
                " - licenses.json: Litsenziyalar\n\n"
                "O'zbekiston Futbol Federatsiyasi © 2026\n"
            )
            zf.writestr('README.txt', readme)

        buffer.seek(0)
        response = HttpResponse(buffer.read(), content_type='application/zip')
        filename = f'uff_data_{user.phone}_{datetime.now().strftime("%Y%m%d")}.zip'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class UserAvatarView(APIView):
    """Upload user avatar image"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response({'error': 'Fayl tanlanmadi'}, status=400)

        if avatar.size > 5 * 1024 * 1024:
            return Response({'error': 'Fayl 5MB dan oshmasligi kerak'}, status=400)
        if not avatar.content_type.startswith('image/'):
            return Response({'error': 'Faqat rasm fayllar'}, status=400)

        if request.user.avatar:
            request.user.avatar.delete(save=False)

        request.user.avatar = avatar
        request.user.save()

        return Response({'avatar_url': request.build_absolute_uri(request.user.avatar.url)})


class ChangePhoneView(APIView):
    """Change phone number with OTP verification"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_phone = request.data.get('new_phone', '').strip()
        otp_code = request.data.get('otp', '').strip()

        if not new_phone or not otp_code:
            return Response({'detail': 'Telefon va OTP kiritish shart'}, status=400)

        from apps.authentication.models import OTPCode

        try:
            otp = OTPCode.objects.get(
                phone=new_phone,
                code=otp_code,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except OTPCode.DoesNotExist:
            return Response({'detail': 'Noto\'g\'ri yoki eskirgan kod'}, status=400)

        if User.objects.filter(phone=new_phone).exclude(id=request.user.id).exists():
            return Response({'detail': 'Bu raqam allaqachon ro\'yxatdan o\'tgan'}, status=400)

        otp.is_used = True
        otp.save()

        request.user.phone = new_phone
        request.user.save()

        return Response({'detail': 'Telefon muvaffaqiyatli yangilandi', 'new_phone': new_phone})


class DeleteAccountView(APIView):
    """Soft delete current user account"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save(update_fields=['is_active', 'deleted_at'])

        # Blacklist tokens (best effort)
        try:
            from rest_framework_simplejwt.token_blacklist.models import (
                BlacklistedToken,
                OutstandingToken,
            )
            for token in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            pass

        return Response({'detail': "Hisob o'chirildi"})


class CompleteOnboardingView(APIView):
    """Complete onboarding for new users"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        # Check if onboarding already completed
        if user.is_onboarded:
            return Response(
                {'error': 'Onboarding allaqachon tugallangan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Required fields
        required = ['first_name', 'last_name', 'birth_date', 'gender', 'region']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {'error': f'Majburiy maydonlar: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update user fields
        user.first_name = data['first_name'].strip()
        user.last_name = data['last_name'].strip()
        user.middle_name = data.get('middle_name', '').strip()
        user.full_name = f"{data['last_name']} {data['first_name']} {data.get('middle_name', '')}".strip()
        user.birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
        user.gender = data['gender']
        user.email = data.get('email', '').strip() or None
        user.workplace = data.get('workplace', '').strip()
        user.job_title = data.get('job_title', '').strip()
        user.coaching_years = int(data.get('coaching_years', 0))
        user.is_onboarded = True

        # Region
        try:
            from apps.users.models import Region
            user.region = Region.objects.get(id=data['region'])
        except Region.DoesNotExist:
            return Response({'error': 'Viloyat topilmadi'}, status=status.HTTP_400_BAD_REQUEST)

        user.save()

        return Response({
            'success': True,
            'user': {
                'id': str(user.id),
                'full_name': user.full_name,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'email': user.email or '',
                'birth_date': str(user.birth_date),
                'gender': user.gender,
                'region_id': user.region_id,
                'region_name': user.region.name_uz if user.region else None,
                'workplace': user.workplace,
                'job_title': user.job_title,
                'coaching_years': user.coaching_years,
                'is_onboarded': True,
                'role': user.role,
                'avatar_url': request.build_absolute_uri(user.avatar.url) if user.avatar else None,
            }
        })
