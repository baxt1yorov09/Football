"""
System settings — rejalashtirilgan tasklar.

- task_auto_backup: Har kuni 02:00 da ishlaydi, `backup_schedule` ga qarab
  backup yaratadi (har kuni / haftada / oyda).
- task_auto_clean_logs: Har kuni 03:00 da ishlaydi, `log_retention` ga qarab
  eski loglarni tozalaydi.
"""
from __future__ import annotations

import logging
import shutil
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except Exception:
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
                        logger.exception(f"Sync fallback: {e}")

            return _Stub(fn)

        if len(args) == 1 and callable(args[0]) and not kwargs:
            return _wrap(args[0])
        return _wrap


# ───────────────────────────────────────────────────────────
# AVTOMATIK BACKUP — backup_schedule asosida
# ───────────────────────────────────────────────────────────
@shared_task(name='apps.system_settings.tasks.task_auto_backup')
def task_auto_backup():
    """Backup_schedule sozlamasiga qarab backup yaratadi."""
    from django.conf import settings as dj_settings
    from django.utils import timezone
    from .models import SystemSettings

    try:
        sysconf = SystemSettings.load()
        schedule = sysconf.backup_schedule
    except Exception as e:
        logger.exception(f"SystemSettings yuklanmadi: {e}")
        return {'skipped': True, 'reason': 'settings_load_failed'}

    if schedule == 'disabled':
        return {'skipped': True, 'reason': 'disabled'}

    today = timezone.now()
    backup_dir = Path(dj_settings.BASE_DIR) / 'backups'
    backup_dir.mkdir(exist_ok=True)

    # Oxirgi backup vaqti
    backups = sorted(backup_dir.glob('backup_*.*'), key=lambda p: p.stat().st_mtime, reverse=True)
    last_backup = None
    if backups:
        last_backup = datetime.fromtimestamp(backups[0].stat().st_mtime)

    # Schedule asosida tekshirish
    should_run = True
    if last_backup:
        delta = today - timezone.make_aware(last_backup) if timezone.is_naive(last_backup) else (today - last_backup)
        days_since = delta.days
        if schedule == 'daily' and days_since < 1:
            should_run = False
        elif schedule == 'weekly' and days_since < 7:
            should_run = False
        elif schedule == 'monthly' and days_since < 30:
            should_run = False

    if not should_run:
        return {'skipped': True, 'reason': 'too_soon', 'last_backup': last_backup.isoformat() if last_backup else None}

    # Backup yaratish
    db_config = dj_settings.DATABASES['default']
    db_engine = db_config.get('ENGINE', '')
    timestamp = today.strftime('%Y%m%d_%H%M%S')

    if 'sqlite' in db_engine:
        src = Path(db_config['NAME'])
        if not src.exists():
            return {'error': 'db_file_not_found'}
        dest = backup_dir / f'backup_{timestamp}.sqlite3'
        shutil.copy2(src, dest)
        size_mb = round(dest.stat().st_size / (1024 * 1024), 2)
        logger.info(f"Auto-backup yaratildi: {dest.name} ({size_mb} MB)")
        return {'created': dest.name, 'size_mb': size_mb, 'schedule': schedule}

    # PostgreSQL — pg_dump
    if 'postgresql' in db_engine:
        import subprocess
        dest = backup_dir / f'backup_{timestamp}.sql'
        try:
            env = {
                'PGPASSWORD': db_config.get('PASSWORD', ''),
            }
            cmd = [
                'pg_dump',
                '-h', db_config.get('HOST', 'localhost'),
                '-p', str(db_config.get('PORT', 5432)),
                '-U', db_config.get('USER', ''),
                '-d', db_config.get('NAME', ''),
                '-f', str(dest),
            ]
            subprocess.run(cmd, check=True, env=env, capture_output=True)
            size_mb = round(dest.stat().st_size / (1024 * 1024), 2)
            logger.info(f"Auto-backup (pg) yaratildi: {dest.name} ({size_mb} MB)")
            return {'created': dest.name, 'size_mb': size_mb, 'schedule': schedule}
        except Exception as e:
            logger.exception(f"pg_dump xato: {e}")
            return {'error': str(e)}

    return {'skipped': True, 'reason': 'unsupported_db', 'engine': db_engine}


# ───────────────────────────────────────────────────────────
# AVTOMATIK LOG TOZALASH — log_retention asosida
# ───────────────────────────────────────────────────────────
@shared_task(name='apps.system_settings.tasks.task_auto_clean_logs')
def task_auto_clean_logs():
    """log_retention sozlamasiga qarab eski loglarni o'chiradi."""
    from django.conf import settings as dj_settings
    from .models import SystemSettings

    try:
        sysconf = SystemSettings.load()
        retention = sysconf.log_retention
    except Exception as e:
        logger.exception(f"SystemSettings yuklanmadi: {e}")
        return {'skipped': True, 'reason': 'settings_load_failed'}

    if retention == 'forever':
        return {'skipped': True, 'reason': 'forever'}

    days = int(retention) if retention.isdigit() else 90
    cutoff = datetime.now() - timedelta(days=days)

    logs_dir = Path(dj_settings.BASE_DIR) / 'logs'
    if not logs_dir.exists():
        return {'skipped': True, 'reason': 'no_logs_dir'}

    deleted = 0
    freed = 0
    for log_file in logs_dir.glob('*.log*'):
        try:
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
            if mtime < cutoff:
                freed += log_file.stat().st_size
                log_file.unlink()
                deleted += 1
        except Exception:
            continue

    logger.info(f"Auto-clean-logs: {deleted} ta fayl o'chirildi, {round(freed/(1024*1024), 2)} MB bo'shatildi")
    return {'deleted': deleted, 'freed_mb': round(freed / (1024 * 1024), 2), 'retention_days': days}
