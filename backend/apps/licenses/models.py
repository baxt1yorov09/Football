import uuid
from django.db import models


class LicenseType(models.Model):
    """Litsenziya turlari"""
    CATEGORY_CHOICES = [
        ('main', 'Asosiy'),
        ('gk', 'Goalkeeper'),
        ('fitness', 'Fitness'),
        ('specialist', 'Mutaxassislik'),
        ('renewal', 'Yangilash'),
        ('special', 'Maxsus'),
    ]

    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=30, unique=True, verbose_name="Kod")
    name_uz = models.CharField(max_length=200, verbose_name="Nomi (uz)")
    name_ru = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nomi (ru)")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, verbose_name="Kategoriya")
    level = models.IntegerField(blank=True, null=True, verbose_name="Daraja")
    color_hex = models.CharField(max_length=7, blank=True, null=True, verbose_name="Rang (HEX)")
    prerequisite_type = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Oldingi litsenziya")
    waiting_days = models.IntegerField(default=0, verbose_name="Kutish muddati (kun)")
    min_age = models.IntegerField(default=0, verbose_name="Minimal yosh")
    tashkent_only = models.BooleanField(default=False, verbose_name="Faqat Toshkent")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    sort_order = models.IntegerField(default=0, verbose_name="Tartib raqami")

    class Meta:
        verbose_name = "Litsenziya turi"
        verbose_name_plural = "Litsenziya turlari"
        ordering = ['sort_order', 'code']

    def __str__(self):
        return f"{self.name_uz} ({self.code})"


class License(models.Model):
    """Chiqarilgan litsenziyalar"""
    STATUS_CHOICES = [
        ('active',    'Faol'),
        ('expired',   "Muddati o'tgan"),
        ('suspended', "To'xtatilgan"),
        ('revoked',   'Bekor qilingan'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(
        'applications.Application', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='license', verbose_name="Ariza"
    )
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='licenses', verbose_name="Foydalanuvchi")
    license_type = models.ForeignKey(LicenseType, on_delete=models.PROTECT, verbose_name="Litsenziya turi")
    region = models.ForeignKey('users.Region', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Hudud")

    license_number = models.CharField(max_length=50, unique=True, verbose_name="Litsenziya raqami")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Holati")

    issued_at = models.DateTimeField(auto_now_add=True, verbose_name="Berilgan sana")
    expires_at = models.DateTimeField(verbose_name="Amal qilish muddati")

    revoked_at = models.DateTimeField(blank=True, null=True, verbose_name="Bekor qilingan sana")
    revoke_reason = models.TextField(blank=True, null=True, verbose_name="Bekor qilish sababi")
    suspended_at = models.DateTimeField(blank=True, null=True, verbose_name="To'xtatilgan sana")
    suspend_reason = models.TextField(blank=True, null=True, verbose_name="To'xtatish sababi")

    pdf_url = models.URLField(blank=True, null=True, verbose_name="PDF URL")
    qr_code_url = models.URLField(blank=True, null=True, verbose_name="QR kod URL")
    is_active = models.BooleanField(default=True, verbose_name="Faol")

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, verbose_name="Yaratilgan sana")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, verbose_name="Yangilangan sana")

    class Meta:
        verbose_name = "Litsenziya"
        verbose_name_plural = "Litsenziyalar"
        ordering = ['-issued_at']

    def __str__(self):
        return f"{self.license_number} - {self.user.full_name}"

    @property
    def computed_status(self):
        """Real holat (DB status + expiry sanasi)"""
        from django.utils import timezone
        if not self.is_active:
            return 'revoked'
        if self.status == 'suspended':
            return 'suspended'
        if self.expires_at and self.expires_at < timezone.now():
            return 'expired'
        return 'active'

    @property
    def days_until_expiry(self):
        from django.utils import timezone
        if not self.expires_at:
            return 0
        delta = self.expires_at - timezone.now()
        return delta.days
