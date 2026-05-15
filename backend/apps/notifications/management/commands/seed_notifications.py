"""
Mavjud foydalanuvchilar/arizalar uchun web bildirishnomalar yaratadi.
Bu bir martalik 'backfill' — har user dashboard'da darhol bildirishnoma ko'radi.

Foydalanish:
  python manage.py seed_notifications              # hammasi
  python manage.py seed_notifications --user-id <uuid>
  python manage.py seed_notifications --clear      # avval barchasini o'chiradi
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.applications.models import Application
from apps.licenses.models import License
from apps.notifications.models import Notification


User = get_user_model()


class Command(BaseCommand):
    help = "Mavjud arizalar va litsenziyalar bo'yicha web bildirishnomalar yaratadi"

    def add_arguments(self, parser):
        parser.add_argument('--user-id', default=None, help="Faqat bitta user uchun")
        parser.add_argument('--clear', action='store_true', help="Avval o'chirib tashlash")

    def handle(self, *args, **opts):
        if opts['clear']:
            n = Notification.objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f"O'chirildi: {n}"))

        from apps.notifications.service import notification_service

        users_qs = User.objects.filter(is_active=True)
        if opts['user_id']:
            users_qs = users_qs.filter(id=opts['user_id'])

        total_user_notifs = 0
        total_admin_notifs = 0

        # 1. Har bir foydalanuvchi uchun — uning oxirgi arizalari/litsenziyalari
        for user in users_qs:
            # Arizalar
            apps_qs = Application.objects.filter(user=user).select_related('license_type').order_by('-submitted_at')[:5]
            for app in apps_qs:
                status_method = {
                    'pending':         notification_service.application_received,
                    'under_review':    notification_service.application_under_review,
                    'additional_docs': notification_service.application_docs_required,
                    'approved':        notification_service.application_approved,
                    'rejected':        notification_service.application_rejected,
                }.get(app.status)
                if status_method:
                    try:
                        status_method(app)
                        total_user_notifs += 1
                    except Exception as e:
                        self.stderr.write(f"app {app.id}: {e}")

            # Litsenziyalar (yaqinda tugaydiganlar)
            lic_qs = License.objects.filter(user=user, is_active=True).select_related('license_type')
            for lic in lic_qs:
                days = getattr(lic, 'days_until_expiry', None)
                if days is None:
                    continue
                if 0 < days <= 30:
                    try:
                        bucket = 30 if days > 14 else (14 if days > 7 else 7)
                        notification_service.license_expiring(lic, bucket)
                        total_user_notifs += 1
                    except Exception as e:
                        self.stderr.write(f"lic {lic.id}: {e}")
                elif days <= 0:
                    try:
                        notification_service.license_expired(lic)
                        total_user_notifs += 1
                    except Exception as e:
                        self.stderr.write(f"lic {lic.id}: {e}")

        # 2. Admin'lar uchun — eng yangi 10 ta ariza
        if not opts['user_id']:
            recent_apps = (
                Application.objects.select_related('user', 'license_type')
                .order_by('-submitted_at')[:10]
            )
            for app in recent_apps:
                try:
                    notification_service.notify_admins_new_application(app)
                    total_admin_notifs += 1
                except Exception as e:
                    self.stderr.write(f"admin {app.id}: {e}")

        self.stdout.write(self.style.SUCCESS(
            f"User uchun: {total_user_notifs}, Admin uchun: {total_admin_notifs} bildirishnoma yaratildi"
        ))
        total = Notification.objects.count()
        self.stdout.write(self.style.SUCCESS(f"DB'da jami: {total} bildirishnoma"))
