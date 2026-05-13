import uuid
from django.db import models


class Application(models.Model):
    """Arizalar"""
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('under_review', 'Ko\'rib chiqilmoqda'),
        ('additional_docs', 'Qo\'shimcha hujjatlar kerak'),
        ('approved', 'Tasdiqlangan'),
        ('rejected', 'Rad etilgan'),
        ('cancelled', 'Bekor qilingan'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, verbose_name="Foydalanuvchi")
    full_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="To'liq ism")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefon raqami")
    license_type = models.ForeignKey('licenses.LicenseType', on_delete=models.CASCADE, verbose_name="Litsenziya turi", null=True, blank=True)
    region = models.ForeignKey('users.Region', on_delete=models.CASCADE, verbose_name="Viloyat", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Holati")
    workplace = models.CharField(max_length=300, blank=True, null=True, verbose_name="Ish joyi")
    job_title = models.CharField(max_length=200, blank=True, null=True, verbose_name="Lavozim")
    coaching_years = models.IntegerField(blank=True, null=True, verbose_name="Murabbiylik tajribasi (yil)")
    prev_license_date = models.DateField(blank=True, null=True, verbose_name="Oldingi litsenziya sanasi")
    license_validity_start = models.DateField(blank=True, null=True, verbose_name="Litsenziya boshlanish sanasi")
    license_validity_end = models.DateField(blank=True, null=True, verbose_name="Litsenziya tugash sanasi")
    admin_note = models.TextField(blank=True, null=True, verbose_name="Admin izohi")
    rejection_reason = models.TextField(blank=True, null=True, verbose_name="Rad etish sababi")
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="Yuborilgan sana")
    reviewed_at = models.DateTimeField(blank=True, null=True, verbose_name="Ko'rib chiqilgan sana")
    reviewed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_applications', verbose_name="Ko'rib chiqqan admin")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan sana")

    class Meta:
        verbose_name = "Ariza"
        verbose_name_plural = "Arizalar"
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Ariza #{self.id} - {self.user.full_name}"


class ApplicationTimeline(models.Model):
    """Ariza holati tarixi"""
    ACTION_CHOICES = [
        ('submitted', 'Yuborildi'),
        ('under_review', 'Ko\'rib chiqilmoqda'),
        ('additional_docs', 'Qo\'shimcha hujjatlar so\'raldi'),
        ('approved', 'Tasdiqlandi'),
        ('rejected', 'Rad etildi'),
        ('resubmitted', 'Qayta yuborildi'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, verbose_name="Ariza")
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, verbose_name="Harakat")
    note = models.TextField(blank=True, null=True, verbose_name="Izoh")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Sana")
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Yaratgan foydalanuvchi")

    class Meta:
        verbose_name = "Ariza tarixi"
        verbose_name_plural = "Ariza tarixlari"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.application} - {self.action}"
