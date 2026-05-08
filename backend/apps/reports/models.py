from django.db import models


class Report(models.Model):
    """Hisobotlar"""
    TYPE_CHOICES = [
        ('monthly', 'Oylik'),
        ('quarterly', 'Choraklik'),
        ('yearly', 'Yillik'),
        ('custom', 'Maxsus'),
    ]

    STATUS_CHOICES = [
        ('generating', 'Yaratilmoqda'),
        ('completed', 'Yakunlangan'),
        ('failed', 'Xatolik'),
    ]

    id = models.AutoField(primary_key=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Hisobot turi")
    title = models.CharField(max_length=200, verbose_name="Sarlavha")
    description = models.TextField(blank=True, null=True, verbose_name="Tavsif")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating', verbose_name="Holati")
    file_url = models.URLField(blank=True, null=True, verbose_name="Fayl URL")
    parameters = models.JSONField(blank=True, null=True, verbose_name="Parametrlar")
    generated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Yaratgan foydalanuvchi")
    generated_at = models.DateTimeField(blank=True, null=True, verbose_name="Yaratilgan sana")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")

    class Meta:
        verbose_name = "Hisobot"
        verbose_name_plural = "Hisobotlar"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
