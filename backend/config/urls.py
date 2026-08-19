from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from apps.authentication.views import AdminLoginView
from apps.notifications.urls import telegram_urlpatterns

def api_info(request):
    return JsonResponse({
        'message': 'UFA License System API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'users': '/api/users/',
            'licenses': '/api/licenses/',
            'applications': '/api/applications/',
            'documents': '/api/documents/',
            'notifications': '/api/notifications/',
            'reports': '/api/reports/',
            'admin': '/django-admin/'
        }
    })

urlpatterns = [
    path('', api_info, name='api-info'),
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/admin/login', AdminLoginView.as_view(), name='admin-login-direct'),
    path('api/users/', include('apps.users.urls')),
    path('api/users', include('apps.users.urls')),
    path('api/licenses/', include('apps.licenses.urls')),
    path('api/licenses', include('apps.licenses.urls')),
    path('api/applications/', include('apps.applications.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/notifications', include('apps.notifications.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/settings/', include('apps.system_settings.urls')),
    path('api/settings', include('apps.system_settings.urls')),
    path('api/telegram/', include(telegram_urlpatterns)),
]

# Always serve media files (remove DEBUG condition)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
