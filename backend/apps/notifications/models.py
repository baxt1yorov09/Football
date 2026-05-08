import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TelegramUser(models.Model):
    """Telegram user linked to Django user"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    telegram_id = models.BigIntegerField(unique=True, help_text="Telegram user ID")
    username = models.CharField(max_length=100, blank=True, null=True, help_text="Telegram username")
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='telegram_user'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications_telegram_user'
        verbose_name = 'Telegram User'
        verbose_name_plural = 'Telegram Users'

    def __str__(self):
        return f"@{self.username}" if self.username else f"User {self.telegram_id}"


class TelegramWebhook(models.Model):
    """Telegram webhook"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.URLField(unique=True, help_text="Telegram webhook URL")
    secret = models.CharField(max_length=100, help_text="Telegram webhook secret")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications_telegram_webhook'
        verbose_name = 'Telegram Webhook'
        verbose_name_plural = 'Telegram Webhooks'

    def __str__(self):
        return self.url


class Notification(models.Model):
    """Bildirishnomalar"""
    TYPE_CHOICES = [
        ('app_received', 'Ariza qabul qilindi'),
        ('app_approved', 'Ariza tasdiqlandi'),
        ('app_rejected', 'Ariza rad etildi'),
        ('expiry_30', '30 kunda tugaydi'),
        ('expiry_14', '14 kunda tugaydi'),
        ('expiry_7', '7 kunda tugaydi'),
        ('docs_required', 'Qo\'shimcha hujjat kerak'),
        ('system', 'Tizim xabari'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, verbose_name="Foydalanuvchi")
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, verbose_name="Xabar turi")
    title = models.CharField(max_length=200, verbose_name="Sarlavha")
    message = models.TextField(verbose_name="Xabar matni")
    is_read = models.BooleanField(default=False, verbose_name="O\'qilgan")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")
    read_at = models.DateTimeField(blank=True, null=True, verbose_name="O\'qilgan sana")

    class Meta:
        verbose_name = "Bildirishnoma"
        verbose_name_plural = "Bildirishnomalar"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} - {self.title}"


class AuditLog(models.Model):
    """Audit log"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Foydalanuvchi")
    action = models.CharField(max_length=100, verbose_name="Harakat")
    entity_type = models.CharField(max_length=50, verbose_name="Obyekt turi")
    entity_id = models.UUIDField(blank=True, null=True, verbose_name="Obyekt ID")
    old_data = models.JSONField(blank=True, null=True, verbose_name="Eski ma\'lumotlar")
    new_data = models.JSONField(blank=True, null=True, verbose_name="Yangi ma\'lumotlar")
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="IP manzil")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Sana")

    class Meta:
        verbose_name = "Audit log"
        verbose_name_plural = "Audit loglar"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.action}"
