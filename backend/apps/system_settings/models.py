from django.db import models
from django.utils import timezone


class LoginAttempt(models.Model):
    """Login urinishlari — brute-force himoyasi uchun"""
    phone = models.CharField(max_length=20, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Login urinishi'
        verbose_name_plural = 'Login urinishlari'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone', 'created_at']),
        ]

    @classmethod
    def get_recent_failed_count(cls, phone: str, minutes: int = 30) -> int:
        """Oxirgi N daqiqadagi muvaffaqiyatsiz urinishlar soni."""
        cutoff = timezone.now() - timezone.timedelta(minutes=minutes)
        return cls.objects.filter(
            phone=phone,
            success=False,
            created_at__gte=cutoff,
        ).count()

    @classmethod
    def record_attempt(cls, phone: str, ip: str = None, success: bool = False):
        """Yangi urinishni qayd etish."""
        cls.objects.create(phone=phone, ip_address=ip, success=success)
        # Muvaffaqiyatli login bo'lsa, eski muvaffaqiyatsiz urinishlarni tozalash
        if success:
            cutoff = timezone.now() - timezone.timedelta(hours=24)
            cls.objects.filter(phone=phone, success=False, created_at__lt=cutoff).delete()

    @classmethod
    def is_blocked(cls, phone: str) -> tuple[bool, int]:
        """
        Telefon raqam bloklangan yoki yo'qligini tekshirish.
        Returns: (is_blocked, remaining_minutes)
        """
        from .models import SystemSettings
        settings = SystemSettings.load()
        max_attempts = settings.max_login_attempts or 5

        failed_count = cls.get_recent_failed_count(phone, minutes=30)
        if failed_count >= max_attempts:
            # Oxirgi muvaffaqiyatsiz urinish vaqtini topish
            last_attempt = cls.objects.filter(
                phone=phone, success=False
            ).order_by('-created_at').first()
            if last_attempt:
                unlock_time = last_attempt.created_at + timezone.timedelta(minutes=30)
                remaining = (unlock_time - timezone.now()).total_seconds() / 60
                if remaining > 0:
                    return True, int(remaining) + 1
        return False, 0


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
    admin_email = models.EmailField(default='admin@ufa.uz')
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
    max_backups = models.PositiveIntegerField(
        default=10,
        help_text="Saqlanadigan maksimal backup soni (eskilari avtomatik o'chiriladi)"
    )
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
