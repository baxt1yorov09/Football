from django.contrib import admin
from .models import SystemSettings, NotificationPreference


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ('system_name', 'admin_email', 'updated_at', 'updated_by')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'email_enabled', 'telegram_enabled', 'in_app_enabled')
    list_filter = ('notification_type', 'email_enabled', 'telegram_enabled')
