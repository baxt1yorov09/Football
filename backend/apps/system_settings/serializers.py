from rest_framework import serializers
from .models import SystemSettings, NotificationPreference


class SystemSettingsSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True)

    class Meta:
        model = SystemSettings
        fields = [
            'system_name', 'admin_email', 'admin_phone', 'timezone', 'description',
            'require_2fa', 'strong_password_required', 'max_login_attempts',
            'session_timeout_minutes', 'backup_schedule', 'max_backups',
            'log_retention', 'maintenance_mode', 'updated_at', 'updated_by_name',
        ]
        read_only_fields = ['updated_at', 'updated_by_name']

    def validate_max_login_attempts(self, value):
        if value < 1 or value > 20:
            raise serializers.ValidationError("1 dan 20 gacha bo'lishi kerak")
        return value

    def validate_session_timeout_minutes(self, value):
        if value < 5 or value > 1440:
            raise serializers.ValidationError("5 daqiqadan 1440 (24 soat) gacha bo'lishi kerak")
        return value

    def validate_max_backups(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError("1 dan 100 gacha bo'lishi kerak")
        return value


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(
        source='get_notification_type_display', read_only=True
    )

    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'notification_type', 'notification_type_display',
            'email_enabled', 'telegram_enabled', 'in_app_enabled',
        ]
        read_only_fields = ['id', 'notification_type_display']
