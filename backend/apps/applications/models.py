import uuid
from django.db import models
from django.db.models import Q


class Application(models.Model):
    """Arizalar"""
    # Navbatda hisobga olinadigan statuslar (rad etilgan/bekor qilingan/arxiv emas)
    QUEUE_ACTIVE_STATUSES = [
        'pending', 'under_review', 'additional_docs',
        'approved', 'called', 'studying',
    ]

    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('under_review', 'Ko\'rib chiqilmoqda'),
        ('additional_docs', 'Qo\'shimcha hujjatlar kerak'),
        ('approved', 'Tasdiqlangan'),
        ('called', 'Telefon qilib chaqirilgan'),      # O'qishga chaqirilgan
        ('studying', 'O\'qiyotgan'),                  # Hozir o'qiyotgan
        ('completed', 'O\'qib bitirgan'),              # O'qib bo'lgan (arxiv)
        ('rejected', 'Rad etilgan'),
        ('cancelled', 'Bekor qilingan'),
        ('no_show', 'Kelmay qoldi'),                   # Chaqirildi lekin kelmadi
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, verbose_name="Foydalanuvchi")
    full_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="To'liq ism")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefon raqami")
    license_type = models.ForeignKey('licenses.LicenseType', on_delete=models.CASCADE, verbose_name="Litsenziya turi", null=True, blank=True)
    region = models.ForeignKey(
        'users.Region', on_delete=models.CASCADE,
        verbose_name="O'qimoqchi bo'lgan hudud",
        related_name='study_applications',
        null=True, blank=True,
    )
    residence_region = models.ForeignKey(
        'users.Region', on_delete=models.SET_NULL,
        verbose_name="Yashaydigan hudud",
        related_name='residence_applications',
        null=True, blank=True,
    )
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

    # Navbat (queue) — hudud + litsenziya turi doirasida
    is_offline = models.BooleanField(default=False, verbose_name="Daftardan kiritilgan")
    queue_priority = models.DateTimeField(
        blank=True, null=True, db_index=True,
        verbose_name="Navbat tartibi (sana)",
        help_text="Navbatdagi o'rinni belgilaydi. Daftardagilar uchun ro'yxatga olingan sana, platforma uchun ariza vaqti.",
    )

    class Meta:
        verbose_name = "Ariza"
        verbose_name_plural = "Arizalar"
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Ariza #{self.id} - {self.user.full_name}"

    def save(self, *args, **kwargs):
        """queue_priority bo'sh bo'lsa, submitted_at (yoki hozirgi vaqt) bilan to'ldiramiz."""
        super().save(*args, **kwargs)
        if self.queue_priority is None and self.submitted_at is not None:
            self.queue_priority = self.submitted_at
            super().save(update_fields=['queue_priority'])

    def _queue_scope_qs(self):
        """Shu ariza bilan bir xil navbat doirasidagi (region + license_type) faol arizalar."""
        return Application.objects.filter(
            region_id=self.region_id,
            license_type_id=self.license_type_id,
            status__in=self.QUEUE_ACTIVE_STATUSES,
        )

    @property
    def queue_number(self):
        """Navbat raqami: (region + litsenziya turi) doirasidagi tartib raqami.
        queue_priority bo'yicha tartiblanadi (teng bo'lsa submitted_at)."""
        if not (self.region_id and self.license_type_id):
            return None
        if self.status not in self.QUEUE_ACTIVE_STATUSES:
            return None
        key = self.queue_priority or self.submitted_at
        if key is None:
            return None
        qs = self._queue_scope_qs()
        return qs.filter(
            Q(queue_priority__lt=key) |
            Q(queue_priority=key, submitted_at__lte=self.submitted_at)
        ).count()

    @property
    def queue_total(self):
        """Shu navbat doirasidagi umumiy faol arizalar soni."""
        if not (self.region_id and self.license_type_id):
            return None
        return self._queue_scope_qs().count()


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
