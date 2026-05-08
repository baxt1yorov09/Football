import uuid
from django.db import models


class Document(models.Model):
    """Hujjatlar"""
    DOC_TYPE_CHOICES = [
        ('passport', 'Pasport'),
        ('photo_3x4', 'Rasm 3x4'),
        ('prev_license', 'Oldingi litsenziya'),
        ('certificate', 'Sertifikat'),
        ('diploma', 'Diplom'),
        ('medical', 'Meditsina xulosasi'),
        ('other', 'Boshqa'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey('applications.Application', on_delete=models.CASCADE, verbose_name="Ariza")
    doc_type = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES, verbose_name="Hujjat turi")
    file_url = models.TextField(verbose_name="Fayl URL")
    file_name = models.CharField(max_length=255, verbose_name="Fayl nomi")
    file_size = models.IntegerField(verbose_name="Fayl hajmi (bayt)")
    mime_type = models.CharField(max_length=50, verbose_name="MIME turi")
    is_verified = models.BooleanField(default=False, verbose_name="Tekshirilgan")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Yuklangan sana")

    class Meta:
        verbose_name = "Hujjat"
        verbose_name_plural = "Hujjatlar"
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.application} - {self.get_doc_type_display()}"
