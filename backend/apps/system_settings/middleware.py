from django.http import JsonResponse


class MaintenanceModeMiddleware:
    """SystemSettings.maintenance_mode yoqilgan bo'lsa, faqat adminlar tizimga kira oladi."""

    EXEMPT_PATHS = (
        '/api/auth/',
        '/api/admin/login',
        '/api/settings/system',
        '/api/settings/maintenance-status',
        '/admin/',
        '/static/',
        '/media/',
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            from .models import SystemSettings
            settings_obj = SystemSettings.load()
        except Exception:
            return self.get_response(request)

        if not settings_obj.maintenance_mode:
            return self.get_response(request)

        path = request.path
        if any(path.startswith(p) for p in self.EXEMPT_PATHS):
            return self.get_response(request)

        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            role = getattr(user, 'role', None)
            if role in ('super_admin', 'region_admin') or user.is_staff:
                return self.get_response(request)

        return JsonResponse(
            {
                'detail': 'Tizim texnik xizmat ko\'rsatish rejimida. Iltimos, keyinroq urinib ko\'ring.',
                'maintenance': True,
            },
            status=503,
        )
