"""
Bildirishnoma tizimini sinash:

  python manage.py test_notifications --type sms --phone +998901234567
  python manage.py test_notifications --type app --application-id <uuid>
  python manage.py test_notifications --type expiry --license-id <uuid> --days 14
  python manage.py test_notifications --type beat-expiring
  python manage.py test_notifications --type beat-expired
"""
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Bildirishnoma tizimini sinash"

    def add_arguments(self, parser):
        parser.add_argument('--type', required=True,
                            choices=['sms', 'app', 'expiry', 'expired',
                                     'beat-expiring', 'beat-expired'])
        parser.add_argument('--phone', default='+998901234567')
        parser.add_argument('--message', default='UFF test xabar')
        parser.add_argument('--application-id', default=None)
        parser.add_argument('--license-id', default=None)
        parser.add_argument('--event', default='received',
                            help='received|under_review|docs_required|approved|rejected')
        parser.add_argument('--days', type=int, default=7)

    def handle(self, *args, **opts):
        t = opts['type']

        if t == 'sms':
            from utils.sms_services import send_sms
            res = send_sms(opts['phone'], opts['message'])
            self.stdout.write(self.style.SUCCESS(f"SMS natija: {res}"))
            return

        if t == 'app':
            from apps.applications.models import Application
            from apps.notifications.service import notification_service
            app_id = opts['application_id']
            if not app_id:
                raise CommandError("--application-id majburiy")
            app = Application.objects.select_related('user', 'license_type').get(id=app_id)
            event = opts['event']
            method = {
                'received':       notification_service.application_received,
                'under_review':   notification_service.application_under_review,
                'docs_required':  notification_service.application_docs_required,
                'approved':       notification_service.application_approved,
                'rejected':       notification_service.application_rejected,
            }.get(event)
            if not method:
                raise CommandError(f"Noma'lum event: {event}")
            method(app)
            self.stdout.write(self.style.SUCCESS(f"Yuborildi: {event} → {app.user}"))
            return

        if t == 'expiry':
            from apps.licenses.models import License
            from apps.notifications.service import notification_service
            lic_id = opts['license_id']
            if not lic_id:
                raise CommandError("--license-id majburiy")
            lic = License.objects.select_related('user', 'license_type').get(id=lic_id)
            notification_service.license_expiring(lic, opts['days'])
            self.stdout.write(self.style.SUCCESS(
                f"Expiry yuborildi: {opts['days']} kun → {lic.user}"
            ))
            return

        if t == 'expired':
            from apps.licenses.models import License
            from apps.notifications.service import notification_service
            lic_id = opts['license_id']
            if not lic_id:
                raise CommandError("--license-id majburiy")
            lic = License.objects.select_related('user', 'license_type').get(id=lic_id)
            notification_service.license_expired(lic)
            self.stdout.write(self.style.SUCCESS(f"Expired yuborildi → {lic.user}"))
            return

        if t == 'beat-expiring':
            from apps.notifications.tasks import task_check_expiring_licenses
            result = task_check_expiring_licenses()
            self.stdout.write(self.style.SUCCESS(f"Natija: {result}"))
            return

        if t == 'beat-expired':
            from apps.notifications.tasks import task_check_expired_today
            result = task_check_expired_today()
            self.stdout.write(self.style.SUCCESS(f"Natija: {result}"))
            return
