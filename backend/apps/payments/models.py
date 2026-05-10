"""
Payment Models for UFF License System
"""
import uuid
from django.db import models
from django.conf import settings

class Payment(models.Model):
    """Payment model for license fees"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('processing', 'Ishlanmoqda'),
        ('completed', 'To\'lov qilingan'),
        ('failed', 'To\'lov xatosi'),
        ('cancelled', 'Bekor qilingan'),
        ('refunded', 'Qaytarilgan'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('click', 'Click'),
        ('payme', 'Payme'),
        ('uzum', 'Uzum'),
        ('bank_card', 'Bank kartasi'),
        ('cash', 'Naqd pul'),
        ('transfer', 'Bank o\'tkazmasi'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name="Ariza"
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        verbose_name="Foydalanuvchi"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="To'lov summasi"
    )
    currency = models.CharField(
        max_length=3,
        default='UZS',
        verbose_name="Valyuta"
    )
    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        verbose_name="To'lov statusi"
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name="To'lov usuli"
    )
    
    # Payment gateway fields
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Tranzaksiya ID"
    )
    gateway_response = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Gateway javobi"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan sana"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Yangilangan sana"
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="To'lov tugatilgan sana"
    )
    
    class Meta:
        db_table = 'payments'
        verbose_name = "To'lov"
        verbose_name_plural = "To'lovlar"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"To'lov {self.id} - {self.user.full_name}"
    
    @property
    def is_paid(self):
        return self.status == 'completed'
    
    @property
    def status_display(self):
        return dict(self.PAYMENT_STATUS_CHOICES).get(self.status, self.status)


class PaymentConfiguration(models.Model):
    """Payment configuration for different license types"""
    
    license_type = models.OneToOneField(
        'licenses.LicenseType',
        on_delete=models.CASCADE,
        related_name='payment_config',
        verbose_name="Litsenziya turi"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="To'lov summasi"
    )
    currency = models.CharField(
        max_length=3,
        default='UZS',
        verbose_name="Valyuta"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Faol"
    )
    
    # Payment methods available
    available_methods = models.JSONField(
        default=list,
        verbose_name="Mavjud to'lov usullari"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_configurations'
        verbose_name = "To'lov konfiguratsiyasi"
        verbose_name_plural = "To'lov konfiguratsiyalari"
    
    def __str__(self):
        return f"{self.license_type.name} - {self.amount} {self.currency}"


class PaymentLog(models.Model):
    """Payment transaction logs"""
    
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name="To'lov"
    )
    action = models.CharField(
        max_length=50,
        verbose_name="Harakat"
    )
    message = models.TextField(
        verbose_name="Xabar"
    )
    gateway_response = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Gateway javobi"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan sana"
    )
    
    class Meta:
        db_table = 'payment_logs'
        verbose_name = "To'lov logi"
        verbose_name_plural = "To'lov loglari"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payment.id} - {self.action}"
