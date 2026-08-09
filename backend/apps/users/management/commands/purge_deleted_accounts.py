"""
30 kundan oshgan soft-deleted hisoblarni to'liq o'chirish.

Ishlatish:
    python manage.py purge_deleted_accounts

Cron/Celery bilan kunlik ishga tushirish tavsiya etiladi.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.users.models import User


class Command(BaseCommand):
    help = "30 kundan oshgan o'chirilgan hisoblarni to'liq o'chirish"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="O'chirmasdan faqat ro'yxatni ko'rsatish",
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help="O'chirish chegarasi (kunlar, default: 30)",
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days = options['days']
        cutoff = timezone.now() - timedelta(days=days)

        qs = User.objects.filter(deleted_at__isnull=False, deleted_at__lt=cutoff)
        count = qs.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS(f"O'chiriladigan hisob topilmadi ({days} kundan oshgan)."))
            return

        self.stdout.write(f"{count} ta hisob {days} kundan oshgan va o'chiriladi:")
        for u in qs[:20]:  # Faqat birinchi 20 tasini ko'rsatish
            self.stdout.write(f"  - {u.phone} ({u.full_name or '—'}) — o'chirilgan: {u.deleted_at.date()}")
        if count > 20:
            self.stdout.write(f"  ... va yana {count - 20} ta")

        if dry_run:
            self.stdout.write(self.style.WARNING("--dry-run rejimi: hech narsa o'chirilmadi."))
            return

        # To'liq o'chirish (CASCADE bog'liqliklar ham o'chadi)
        deleted, _ = qs.delete()
        self.stdout.write(self.style.SUCCESS(f"{deleted} ta hisob to'liq o'chirildi."))
