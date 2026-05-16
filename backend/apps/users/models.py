import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.files.storage import default_storage


def user_avatar_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'avatars/{instance.id}.{ext}'


class Region(models.Model):
    """O'zbekiston viloyatlari"""
    id = models.AutoField(primary_key=True)
    name_uz = models.CharField(max_length=100, verbose_name="Viloyat nomi (uz)")
    name_ru = models.CharField(max_length=100, blank=True, null=True, verbose_name="Viloyat nomi (ru)")
    code = models.CharField(max_length=10, unique=True, verbose_name="Kod")
    is_tashkent = models.BooleanField(default=False, verbose_name="Toshkent shahri")

    class Meta:
        verbose_name = "Viloyat"
        verbose_name_plural = "Viloyatlar"
        ordering = ['id']

    def __str__(self):
        return self.name_uz


class User(AbstractUser):
    """Custom user model"""
    ROLE_CHOICES = [
        ('coach', 'Murabbiy'),
        ('region_admin', 'Viloyat admin'),
        ('super_admin', 'Super admin'),
        ('viewer', 'Tomoshabin'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Erkak'),
        ('female', 'Ayol'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, verbose_name="Telefon raqam")
    
    # Onboarding fields
    is_onboarded = models.BooleanField(default=False, verbose_name="Onboarding tugallangan")
    first_name = models.CharField(max_length=100, blank=True, verbose_name="Ism")
    last_name = models.CharField(max_length=100, blank=True, verbose_name="Familiya")
    middle_name = models.CharField(max_length=100, blank=True, verbose_name="Otasining ismi")
    full_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="To'liq ism")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Tug'ilgan sana")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male', blank=True, null=True, verbose_name="Jins")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Viloyat")
    workplace = models.CharField(max_length=300, blank=True, null=True, verbose_name="Ish joyi")
    job_title = models.CharField(max_length=200, blank=True, null=True, verbose_name="Lavozim")
    coaching_years = models.PositiveIntegerField(default=0, verbose_name="Murabbiylik tajribasi (yil)")
    
    # Profile
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='coach', verbose_name="Rol")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    avatar = models.ImageField(upload_to=user_avatar_path, null=True, blank=True, verbose_name="Avatar")
    avatar_url = models.URLField(blank=True, null=True, verbose_name="Avatar URL (legacy)")
    
    # Settings
    language = models.CharField(max_length=5, default='uz', verbose_name="Til")
    theme = models.CharField(max_length=10, default='light', verbose_name="Mavzu")
    notifications_enabled = models.BooleanField(default=True, verbose_name="Bildirishnomalar yoqilgan")
    two_factor_enabled = models.BooleanField(default=False, verbose_name="2FA yoqilgan")
    totp_secret = models.CharField(max_length=64, blank=True, null=True, verbose_name="TOTP secret")
    # 2FA zaxira (recovery) kodlari — har biri {"hash": "...", "used_at": null|"isodate"}
    recovery_codes = models.JSONField(default=list, blank=True, verbose_name="Zaxira kodlari")
    deleted_at = models.DateTimeField(blank=True, null=True, verbose_name="O'chirilgan sana")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan sana")

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name or self.phone


class OTPCode(models.Model):
    """OTP kodlari"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, verbose_name="Telefon raqam")
    code = models.CharField(max_length=6, verbose_name="Kod")
    is_used = models.BooleanField(default=False, verbose_name="Islatilgan")
    expires_at = models.DateTimeField(verbose_name="Amal qilish muddati")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")

    class Meta:
        verbose_name = "OTP kod"
        verbose_name_plural = "OTP kodlari"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.phone} - {self.code}"
