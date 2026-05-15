"""
Celery app — Asinxron tasklar va rejalashtirilgan beat ishlari.

Worker:    celery -A config worker --loglevel=info
Beat:      celery -A config beat --loglevel=info
"""
import os

from celery import Celery
from celery.schedules import crontab

# Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('uff')

# Settings dan CELERY_ prefiksli sozlamalarni o'qish
app.config_from_object('django.conf:settings', namespace='CELERY')

# Hamma INSTALLED_APPS ichidan tasks.py'larni topish
app.autodiscover_tasks()


# ─── Rejalashtirilgan tasklar (Celery Beat) ──────────────────────────
app.conf.beat_schedule = {
    # Har kuni 08:00 — bugun muddati tugaganlar
    'check-expired-licenses-daily': {
        'task': 'apps.notifications.tasks.task_check_expired_today',
        'schedule': crontab(hour=8, minute=0),
    },
    # Har kuni 09:00 — 30/14/7 kun qoldi
    'check-expiring-licenses-daily': {
        'task': 'apps.notifications.tasks.task_check_expiring_licenses',
        'schedule': crontab(hour=9, minute=0),
    },
    # Har kuni 02:00 — backup_schedule asosida avtomatik backup
    'auto-backup-daily-check': {
        'task': 'apps.system_settings.tasks.task_auto_backup',
        'schedule': crontab(hour=2, minute=0),
    },
    # Har kuni 03:00 — log_retention asosida eski loglarni tozalash
    'auto-clean-logs-daily': {
        'task': 'apps.system_settings.tasks.task_auto_clean_logs',
        'schedule': crontab(hour=3, minute=0),
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
