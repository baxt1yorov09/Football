"""
Avtomatik backup task'ini sinxron tarzda ishga tushirish.
Celery yo'q yoki Windows Task Scheduler/cron orqali ishga tushirilishi mumkin.

Foydalanish:
  python manage.py run_auto_backup
  python manage.py run_auto_backup --force   # schedule tekshiruvini chetlab o'tish
  python manage.py run_auto_backup --clean-logs
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Avtomatik backup va log tozalash tasklarini ishga tushirish"

    def add_arguments(self, parser):
        parser.add_argument('--clean-logs', action='store_true', help="Faqat log tozalash")
        parser.add_argument('--backup', action='store_true', help="Faqat backup")
        parser.add_argument('--force', action='store_true', help="Schedule tekshiruvini chetlab o'tish")

    def handle(self, *args, **opts):
        from apps.system_settings.tasks import (
            task_auto_backup, task_auto_clean_logs,
            create_backup_file, cleanup_old_backups,
        )
        from apps.system_settings.models import SystemSettings

        run_backup = opts['backup'] or not opts['clean_logs']
        run_clean = opts['clean_logs'] or not opts['backup']

        if run_backup:
            if opts['force']:
                self.stdout.write("Backup majburiy yaratilmoqda (--force)...")
                res = create_backup_file()
                if res.get('success'):
                    try:
                        sysconf = SystemSettings.load()
                        deleted = cleanup_old_backups(sysconf.max_backups or 10)
                    except Exception:
                        deleted = 0
                    self.stdout.write(self.style.SUCCESS(
                        f"Backup yaratildi: {res['file']} ({res['size_mb']} MB), eski o'chirildi: {deleted}"
                    ))
                else:
                    self.stdout.write(self.style.ERROR(f"Xato: {res.get('error')}"))
            else:
                self.stdout.write("Backup ishga tushirilmoqda...")
                result = task_auto_backup()
                if result.get('skipped'):
                    self.stdout.write(self.style.WARNING(f"O'tkazib yuborildi: {result.get('reason')}"))
                elif result.get('error'):
                    self.stdout.write(self.style.ERROR(f"Xato: {result.get('error')}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"Backup natijasi: {result}"))

        if run_clean:
            self.stdout.write("Log tozalash ishga tushirilmoqda...")
            result = task_auto_clean_logs()
            self.stdout.write(self.style.SUCCESS(f"Log tozalash natijasi: {result}"))
