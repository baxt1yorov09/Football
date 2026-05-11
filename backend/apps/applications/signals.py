"""
Application Signals - Email Notifications
"""
import os
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Application, ApplicationTimeline


@receiver(post_save, sender=Application)
def application_status_changed(sender, instance, created, **kwargs):
    """Send email when application status changes"""
    if not created:  # Only for updates
        # Check if status was actually changed
        try:
            old_instance = Application.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                send_status_update_email(instance)
        except Application.DoesNotExist:
            pass


@receiver(post_save, sender=ApplicationTimeline)
def timeline_action_created(sender, instance, created, **kwargs):
    """Send email when new timeline action is created"""
    if created:
        send_timeline_notification(instance)


def send_status_update_email(application):
    """Send email notification for status update"""
    user = application.user
    
    # Map status to human-readable and email subject
    status_map = {
        'pending': ('Kutilmoqda', 'Arizangiz qabul qilindi'),
        'under_review': ("Ko'rib chiqilmoqda", "Arizangiz ko'rib chiqilmoqda"),
        'additional_docs': ('Qo\'shimcha hujjatlar kerak', 'Arizangiz uchun qo\'shimcha hujjatlar talab qilinmoqda'),
        'approved': ('Tasdiqlandi', 'Arizangiz tasdiqlandi!'),
        'rejected': ('Rad etildi', 'Arizangiz rad etildi'),
    }
    
    status_display, subject = status_map.get(
        application.status, 
        (application.get_status_display(), 'Ariza holati yangilandi')
    )
    
    # Build email message
    message = f"""Assalomu alaykum, {user.full_name}!

Arizangizning holati o'zgardi.

Ariza ma'lumotlari:
- Ariza ID: {application.id}
- Litsenziya turi: {application.license_type.name_uz}
- Yangi holat: {status_display}
- Yangilangan sana: {application.updated_at.strftime('%d.%m.%Y %H:%M')}
"""

    # Add specific messages based on status
    if application.status == 'approved':
        message += f"""
Tabriklaymiz! Arizangiz tasdiqlandi.
Litsenziyangizni ko'rish uchun tizimga kiring:
http://localhost:3000/licenses

Litsenziya davomiyligi: {application.license_validity_start} - {application.license_validity_end}
"""
    elif application.status == 'rejected':
        message += f"""
Afsuski, arizangiz rad etildi.

Rad etish sababi:
{application.rejection_reason or "Sabab ko'rsatilmagan"}

Agar savollaringiz bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qiling:
Email: support@uff.uz
Telefon: +998 71 123 45 67
"""
    elif application.status == 'additional_docs':
        message += """
Arizangizni davom ettirish uchun qo'shimcha hujjatlar talab qilinmoqda.

Iltimos, tizimga kiring va kerakli hujdatlarni yuklang:
http://localhost:3000/applications
"""
    
    message += """

Hurmat bilan,
O'zbekiston Futbol Federatsiyasi
"""
    
    # Send email
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Email sending failed: {e}")


def send_timeline_notification(timeline):
    """Send email for timeline action"""
    application = timeline.application
    user = application.user
    
    action_map = {
        'submitted': ('Ariza yuborildi', f"Arizangiz muvaffaqiyatli yuborildi.\nAriza ID: {application.id}"),
        'under_review': ("Ko'rib chiqilmoqda", "Arizangiz ko'rib chiqish uchun qabul qilindi."),
        'additional_docs': ('Hujjatlar talab qilindi', 'Arizangiz uchun qo\'shimcha hujjatlar talab qilinmoqda.'),
        'approved': ('Tasdiqlandi', 'Tabriklaymiz! Arizangiz tasdiqlandi.'),
        'rejected': ('Rad etildi', 'Arizangiz rad etildi.'),
        'resubmitted': ('Qayta yuborildi', 'Arizangiz qayta yuborildi.'),
    }
    
    subject, message = action_map.get(
        timeline.action,
        ('Ariza yangilandi', 'Arizangizda o\'zgarishlar bor.')
    )
    
    if timeline.note:
        message += f"\n\nIzoh: {timeline.note}"
    
    license_name = application.license_type.name_uz if application.license_type else 'Noma\'lum'
    
    message += f"""

Ariza ma'lumotlari:
- Ariza ID: {application.id}
- Litsenziya turi: {license_name}
- Sana: {timeline.created_at.strftime('%d.%m.%Y %H:%M')}

Hurmat bilan,
O'zbekiston Futbol Federatsiyasi
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Timeline email sending failed: {e}")
