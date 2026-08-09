from django.apps import AppConfig


class SystemSettingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.system_settings'
    verbose_name = 'Tizim sozlamalari'

    def ready(self):
        # Signal'larni ro'yxatga olish (cache invalidation uchun)
        from . import signals  # noqa: F401
