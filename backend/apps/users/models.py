import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


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
    full_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="To'liq ism")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Tug'ilgan sana")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True, verbose_name="Jins")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Viloyat")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='coach', verbose_name="Rol")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    avatar_url = models.URLField(blank=True, null=True, verbose_name="Avatar URL")
    workplace = models.CharField(max_length=300, blank=True, null=True, verbose_name="Ish joyi")
    # Settings
    language = models.CharField(max_length=5, default='uz', verbose_name="Til")
    theme = models.CharField(max_length=10, default='light', verbose_name="Mavzu")
    notifications_enabled = models.BooleanField(default=True, verbose_name="Bildirishnomalar yoqilgan")
    two_factor_enabled = models.BooleanField(default=False, verbose_name="2FA yoqilgan")
    totp_secret = models.CharField(max_length=64, blank=True, null=True, verbose_name="TOTP secret")
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
