"""
MaintenanceModeMiddleware — SystemSettings.maintenance_mode yoqilgan bo'lsa
oddiy foydalanuvchilarni bloklaydi, faqat adminlar kirishi mumkin.

Performance: setting Django cache orqali cache'lanadi (30 soniya TTL).
Sozlama o'zgartirilganda cache invalidate qilinadi (signals.py orqali).
"""
from django.core.cache import cache
from django.http import JsonResponse


MAINTENANCE_CACHE_KEY = 'system:maintenance_mode'
MAINTENANCE_CACHE_TTL = 30  # soniya


def get_maintenance_mode() -> bool:
    """Cache'dan maintenance_mode holatini oladi. Cache'da yo'q bo'lsa DB'dan olib cache'laydi."""
    cached = cache.get(MAINTENANCE_CACHE_KEY)
    if cached is not None:
        # DIQQAT: bool('0') Python'da True bo'ladi (bo'sh bo'lmagan string truthy).
        # Shuning uchun aniq string bilan solishtirish kerak.
        return cached == '1' or cached is True
    try:
        from .models import SystemSettings
        settings_obj = SystemSettings.load()
        value = bool(settings_obj.maintenance_mode)
    except Exception:
        value = False
    # False ni ham cache'lash — har safar DB'ga bormaslik uchun
    cache.set(MAINTENANCE_CACHE_KEY, '1' if value else '0', MAINTENANCE_CACHE_TTL)
    return value


def invalidate_maintenance_cache():
    """Sozlama o'zgartirilganda cache'ni tozalash."""
    cache.delete(MAINTENANCE_CACHE_KEY)


class MaintenanceModeMiddleware:
    """SystemSettings.maintenance_mode yoqilgan bo'lsa, faqat adminlar tizimga kira oladi."""

    # Aniq path'lar (prefix emas, aniq mos kelishi kerak — noaniqlikning oldini oladi)
    EXEMPT_EXACT = frozenset({
        '/api/settings/maintenance-status',
        '/api/settings/maintenance-status/',
        '/api/admin/login',
        '/api/admin/login/',
        '/api/settings/system',
        '/api/settings/system/',
        '/api/users/me',
        '/api/users/me/',
        '/api/auth/logout',
        '/api/auth/logout/',
    })

    # Prefix'lar — bularning ostidagi hamma narsa exempt
    EXEMPT_PREFIXES = (
        '/admin/',   # Django admin
        '/static/',
        '/media/',
        '/api/auth/',  # Barcha auth endpointlar (login, OTP, refresh, 2FA) — maintenance'da ham ishlaydi
        '/api/users/onboarding',  # Ro'yxatdan o'tishning davomi — bloklamaslik
        '/api/reports/public/',  # Landing sahifasi uchun public ma'lumotlar
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Tez cache tekshiruvi
        if not get_maintenance_mode():
            return self.get_response(request)

        # Rejim yoqilgan — exempt yo'llarni tekshirish
        path = request.path
        if path in self.EXEMPT_EXACT:
            return self.get_response(request)
        if any(path.startswith(p) for p in self.EXEMPT_PREFIXES):
            return self.get_response(request)

        # JWT tokenni qo'lda tekshirish (DRF middleware view'dan oldin ishlamaydi)
        if self._is_admin_via_jwt(request):
            return self.get_response(request)

        # Session-based auth (Django admin uchun)
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            role = getattr(user, 'role', None)
            if role in ('super_admin', 'region_admin') or user.is_staff:
                return self.get_response(request)

        return JsonResponse(
            {
                'detail': "Tizim texnik xizmat ko'rsatish rejimida. Iltimos, keyinroq urinib ko'ring.",
                'maintenance': True,
            },
            status=503,
        )

    @staticmethod
    def _is_admin_via_jwt(request) -> bool:
        """Authorization: Bearer <token> orqali admin'ni aniqlash."""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return False
        token_str = auth_header[7:].strip()
        if not token_str:
            return False
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from apps.users.models import User
            token = AccessToken(token_str)
            user_id = token.get('user_id')
            if not user_id:
                return False
            # Cache orqali user rolini olish (har so'rovda DB'ga bormaslik uchun)
            role_cache_key = f'user:role:{user_id}'
            role = cache.get(role_cache_key)
            if role is None:
                user = User.objects.filter(id=user_id, is_active=True).only('role', 'is_staff').first()
                if not user:
                    return False
                role = user.role or ('__staff__' if user.is_staff else '')
                cache.set(role_cache_key, role, 60)  # 1 daqiqa
            return role in ('super_admin', 'region_admin', '__staff__')
        except Exception:
            return False
