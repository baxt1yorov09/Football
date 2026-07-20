from django.db import models


class SystemSettings(models.Model):
    """Tizim bo'yicha umumiy sozlamalar (singleton)"""

    BACKUP_CHOICES = [
        ('daily', 'Har kuni'),
        ('weekly', 'Haftada bir marta'),
        ('monthly', 'Oyda bir marta'),
        ('disabled', 'O\'chirilgan'),
    ]
    LOG_RETENTION_CHOICES = [
        ('30', '30 kun'),
        ('90', '90 kun'),
        ('365', '1 yil'),
        ('forever', 'Cheksiz'),
    ]

    # General
    system_name = models.CharField(max_length=200, default='UFA')
    admin_email = models.EmailField(default='admin@uff.uz')
    admin_phone = models.CharField(max_length=30, default='+998 71 123 45 67')
    timezone = models.CharField(max_length=50, default='Asia/Tashkent')
    description = models.TextField(
        default="O'zbekiston Futbol Assotsiatsiyasi"
    )

    # Security
    require_2fa = models.BooleanField(default=False)
    strong_password_required = models.BooleanField(default=True)
    max_login_attempts = models.PositiveIntegerField(default=5)
    session_timeout_minutes = models.PositiveIntegerField(default=30)

    # System
    backup_schedule = models.CharField(max_length=20, choices=BACKUP_CHOICES, default='daily')
    log_retention = models.CharField(max_length=20, choices=LOG_RETENTION_CHOICES, default='90')
    maintenance_mode = models.BooleanField(default=False)

    # Meta
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, blank=True, null=True,
        related_name='settings_updates'
    )

    class Meta:
        verbose_name = 'Tizim sozlamasi'
        verbose_name_plural = 'Tizim sozlamalari'

    def __str__(self):
        return self.system_name

    def save(self, *args, **kwargs):
        # Singleton: faqat bitta yozuv
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class NotificationPreference(models.Model):
    """Foydalanuvchining bildirishnoma sozlamalari"""

    NOTIFICATION_TYPES = [
        ('new_application', 'Yangi ariza kelganda'),
        ('license_expiring', 'Litsenziya muddati tugashida'),
        ('system_updates', 'Tizim yangilanishlari'),
        ('security_alerts', 'Xavfsizlik ogohlantirishlari'),
        ('monthly_reports', 'Oylik hisobotlar'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notification_prefs')
    notification_type = models.CharField(max_length=40, choices=NOTIFICATION_TYPES)
    email_enabled = models.BooleanField(default=True)
    telegram_enabled = models.BooleanField(default=False)
    in_app_enabled = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'notification_type')
        verbose_name = 'Bildirishnoma sozlamasi'
        verbose_name_plural = 'Bildirishnoma sozlamalari'

    def __str__(self):
        return f'{self.user} - {self.get_notification_type_display()}'
