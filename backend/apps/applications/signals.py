"""
Application Signals — Multi-channel bildirishnomalar.

Channels:  Email (existing) + SMS + Telegram + Web Bell (yangi)
Dispatch:  Celery tasks (asinxron). Celery yo'q bo'lsa — sinxron fallback.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Application, ApplicationTimeline

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# STATUS O'ZGARISHINI ANIQLASH — pre_save da
# ═══════════════════════════════════════════════════════════════════
@receiver(pre_save, sender=Application)
def _capture_old_status(sender, instance, **kwargs):
    """DB'dagi avvalgi status'ni saqlab qo'yish."""
    if not instance.pk:
        instance._old_status = None
        return
    try:
        old = Application.objects.only('status').get(pk=instance.pk)
        instance._old_status = old.status
    except Application.DoesNotExist:
        instance._old_status = None


# ═══════════════════════════════════════════════════════════════════
# YANGI ARIZA — qabul qilindi
# ═══════════════════════════════════════════════════════════════════
@receiver(post_save, sender=Application)
def application_created(sender, instance, created, **kwargs):
    """Yangi ariza yaratilganda — barcha kanallarga xabar."""
    if not created:
        return

    # Daftardan (offline) kiritilgan yozuvlar uchun xabar yuborilmaydi
    if getattr(instance, 'is_offline', False):
        return

    def _dispatch():
        try:
            from apps.notifications.tasks import task_application_received
            task_application_received.delay(str(instance.id))
        except Exception as e:
            logger.exception(f"application_received dispatch xato: {e}")

    transaction.on_commit(_dispatch)


# ═══════════════════════════════════════════════════════════════════
# STATUS O'ZGARDI — har bir holat uchun mos task
# ═══════════════════════════════════════════════════════════════════
@receiver(post_save, sender=Application)
def application_status_changed(sender, instance, created, **kwargs):
    """Status o'zgarganda mos task'ni Celery'ga yuborish."""
    if created:
        return  # `application_created` allaqachon ishladi

    old_status = getattr(instance, '_old_status', None)
    if old_status is None or old_status == instance.status:
        return

    # Mavjud email yuborishni saqlab qolamiz
    try:
        send_status_update_email(instance)
    except Exception as e:
        logger.exception(f"email xato: {e}")

    # SMS + Telegram + Web Bell — Celery orqali
    def _dispatch():
        """Dispatch async task after transaction commit"""
        try:
            from apps.notifications.tasks import (
                task_application_under_review,
                task_application_docs_required,
                task_application_approved,
                task_application_rejected,
            )
            task_map = {
                'under_review':    task_application_under_review,
                'additional_docs': task_application_docs_required,
                'approved':        task_application_approved,
                'rejected':        task_application_rejected,
            }
            task = task_map.get(instance.status)
            if task:
                task.delay(str(instance.id))
        except Exception as e:
            logger.exception(f"status_changed dispatch xato: {e}")
            # Fallback: sync notification if Celery/Redis is down
            try:
                from apps.notifications.service import notification_service
                if instance.status == 'approved':
                    notification_service.application_approved(instance)
                elif instance.status == 'rejected':
                    notification_service.application_rejected(instance)
                elif instance.status == 'under_review':
                    notification_service.application_under_review(instance)
                elif instance.status == 'additional_docs':
                    notification_service.application_docs_required(instance, note="Status o'zgardi")
            except Exception as fallback_error:
                logger.error(f"Fallback notification xato: {fallback_error}")

    transaction.on_commit(_dispatch)


@receiver(post_save, sender=ApplicationTimeline)
def timeline_action_created(sender, instance, created, **kwargs):
    """Timeline yangilanganda email yuborish (mavjud)."""
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
Email: support@ufa.uz
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
O'zbekiston Futbol Assotsiatsiyasi
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
        logging.getLogger(__name__).warning(f"Email sending failed: {e}")


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
O'zbekiston Futbol Assotsiatsiyasi
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
        logging.getLogger(__name__).warning(f"Timeline email sending failed: {e}")
