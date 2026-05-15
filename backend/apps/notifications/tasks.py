"""
Celery tasks — bildirishnomalarni asinxron yuborish va rejalashtirish.

Celery o'rnatilmagan bo'lsa, fallback sifatida sinxron ishlatish uchun
`run_sync(task_name, *args)` helper'i ham mavjud.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except Exception:  # Celery o'rnatilmagan — no-op decorator
    CELERY_AVAILABLE = False

    def shared_task(*args, **kwargs):  # type: ignore
        def _wrap(fn):
            class _Stub:
                def __init__(self, fn):
                    self.fn = fn

                def __call__(self, *a, **kw):
                    return self.fn(*a, **kw)

                def delay(self, *a, **kw):
                    try:
                        return self.fn(*a, **kw)
                    except Exception as e:
                        logger.exception(f"Sync fallback xato: {e}")

                def apply_async(self, args=None, kwargs=None, **_):
                    try:
                        return self.fn(*(args or ()), **(kwargs or {}))
                    except Exception as e:
                        logger.exception(f"Sync fallback xato: {e}")

            return _Stub(fn)

        # `@shared_task(...)` (parametr bilan) va `@shared_task` (parametrsiz)
        if len(args) == 1 and callable(args[0]) and not kwargs:
            return _wrap(args[0])
        return _wrap


# ═══════════════════════════════════════════════════════════════════
# APPLICATION TASKLARI
# ═══════════════════════════════════════════════════════════════════
@shared_task(name='apps.notifications.tasks.task_application_received')
def task_application_received(application_id: str):
    try:
        from apps.applications.models import Application
        from .service import notification_service
        app = Application.objects.select_related('user', 'license_type').get(id=application_id)
        # 1. Ariza beruvchiga
        notification_service.application_received(app)
        # 2. Admin'larga ham
        notification_service.notify_admins_new_application(app)
    except Exception as exc:
        logger.exception(f"task_application_received xato: {exc}")


@shared_task(name='apps.notifications.tasks.task_application_under_review')
def task_application_under_review(application_id: str):
    try:
        from apps.applications.models import Application
        from .service import notification_service
        app = Application.objects.select_related('user', 'license_type').get(id=application_id)
        notification_service.application_under_review(app)
    except Exception as exc:
        logger.exception(f"task_application_under_review xato: {exc}")


@shared_task(name='apps.notifications.tasks.task_application_docs_required')
def task_application_docs_required(application_id: str):
    try:
        from apps.applications.models import Application
        from .service import notification_service
        app = Application.objects.select_related('user', 'license_type').get(id=application_id)
        notification_service.application_docs_required(app)
    except Exception as exc:
        logger.exception(f"task_application_docs_required xato: {exc}")


@shared_task(name='apps.notifications.tasks.task_application_approved')
def task_application_approved(application_id: str):
    try:
        from apps.applications.models import Application
        from .service import notification_service
        app = (
            Application.objects
            .select_related('user', 'license_type')
            .get(id=application_id)
        )
        notification_service.application_approved(app)
    except Exception as exc:
        logger.exception(f"task_application_approved xato: {exc}")


@shared_task(name='apps.notifications.tasks.task_application_rejected')
def task_application_rejected(application_id: str):
    try:
        from apps.applications.models import Application
        from .service import notification_service
        app = Application.objects.select_related('user', 'license_type').get(id=application_id)
        notification_service.application_rejected(app)
    except Exception as exc:
        logger.exception(f"task_application_rejected xato: {exc}")


# ═══════════════════════════════════════════════════════════════════
# LICENSE TASKLARI
# ═══════════════════════════════════════════════════════════════════
@shared_task(name='apps.notifications.tasks.task_license_expiring')
def task_license_expiring(license_id: str, days: int):
    try:
        from apps.licenses.models import License
        from .service import notification_service
        lic = License.objects.select_related('user', 'license_type').get(id=license_id)
        notification_service.license_expiring(lic, days)
        # Admin'larga ham
        notification_service.notify_admins_license_expiring(lic, days)
    except Exception as exc:
        logger.exception(f"task_license_expiring xato: {exc}")


@shared_task(name='apps.notifications.tasks.task_license_expired')
def task_license_expired(license_id: str):
    try:
        from apps.licenses.models import License
        from .service import notification_service
        lic = License.objects.select_related('user', 'license_type').get(id=license_id)
        notification_service.license_expired(lic)
    except Exception as exc:
        logger.exception(f"task_license_expired xato: {exc}")


@shared_task(name='apps.notifications.tasks.task_license_suspended')
def task_license_suspended(license_id: str):
    try:
        from apps.licenses.models import License
        from .service import notification_service
        lic = License.objects.select_related('user', 'license_type').get(id=license_id)
        notification_service.license_suspended(lic)
    except Exception as exc:
        logger.exception(f"task_license_suspended xato: {exc}")


@shared_task(name='apps.notifications.tasks.task_license_revoked')
def task_license_revoked(license_id: str):
    try:
        from apps.licenses.models import License
        from .service import notification_service
        lic = License.objects.select_related('user', 'license_type').get(id=license_id)
        notification_service.license_revoked(lic)
    except Exception as exc:
        logger.exception(f"task_license_revoked xato: {exc}")


# ═══════════════════════════════════════════════════════════════════
# REJALASHTIRILGAN TASKLAR (Celery Beat)
# ═══════════════════════════════════════════════════════════════════
@shared_task(name='apps.notifications.tasks.task_check_expiring_licenses')
def task_check_expiring_licenses():
    """30 / 14 / 7 kunlik ogohlantirishlar (har kuni 09:00)."""
    from datetime import timedelta
    from django.utils import timezone
    from apps.licenses.models import License

    today = timezone.now().date()
    sent = 0
    errors = 0

    for days in (30, 14, 7):
        target = today + timedelta(days=days)
        qs = License.objects.filter(
            is_active=True,
            status='active',
            expires_at__date=target,
        ).select_related('user', 'license_type')

        for lic in qs:
            user = lic.user
            if not user or not getattr(user, 'notifications_enabled', True):
                continue
            try:
                task_license_expiring.delay(str(lic.id), days)
                sent += 1
            except Exception as e:
                logger.exception(f"expiry task xato: {e}")
                errors += 1

    logger.info(f"Expiry-check: {sent} yuborildi, {errors} xato")
    return {'sent': sent, 'errors': errors}


@shared_task(name='apps.notifications.tasks.task_check_expired_today')
def task_check_expired_today():
    """Bugun muddati tugagan litsenziyalar (har kuni 08:00)."""
    from django.utils import timezone
    from apps.licenses.models import License

    today = timezone.now().date()
    qs = License.objects.filter(
        is_active=True,
        status='active',
        expires_at__date=today,
    ).select_related('user', 'license_type')

    count = 0
    for lic in qs:
        lic.status = 'expired'
        try:
            lic.save(update_fields=['status', 'updated_at'])
        except Exception:
            lic.save()
        try:
            task_license_expired.delay(str(lic.id))
            count += 1
        except Exception as e:
            logger.exception(f"expired notify xato: {e}")

    logger.info(f"Expired-today: {count} litsenziya")
    return {'expired': count}
