"""
System settings — rejalashtirilgan tasklar.

- task_auto_backup: Har kuni 02:00 da ishlaydi, `backup_schedule` ga qarab
  backup yaratadi (har kuni / haftada / oyda). Eski backuplarni ham tozalaydi.
- task_auto_clean_logs: Har kuni 03:00 da ishlaydi, `log_retention` ga qarab
  eski loglarni tozalaydi.

Bu tasklarni ishlatish uchun 3 xil yo'l bor:
1. Celery worker + beat (production)
2. `python manage.py run_scheduled_backup` (Task Scheduler/cron)
3. Django admin panelidan qo'lda "Hozir backup"
"""
from __future__ import annotations

import logging
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

from django.utils import timezone

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
# HELPER — bitta backup fayl yaratish (auto & manual uchun umumiy)
# ───────────────────────────────────────────────────────────
def create_backup_file() -> dict:
    """Ma'lumotlar bazasi backup faylini yaratadi. Auto va manual uchun umumiy.

    Returns dict:
      - {'success': True, 'file': 'backup_...', 'size_mb': 12.3}
      - {'success': False, 'error': '...'}
    """
    from django.conf import settings as dj_settings

    db_config = dj_settings.DATABASES['default']
    db_engine = db_config.get('ENGINE', '')
    backup_dir = Path(dj_settings.BASE_DIR) / 'backups'
    backup_dir.mkdir(exist_ok=True)
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')

    if 'sqlite' in db_engine:
        src = Path(db_config['NAME'])
        if not src.exists():
            return {'success': False, 'error': 'db_file_not_found'}
        dest = backup_dir / f'backup_{timestamp}.sqlite3'
        try:
            shutil.copy2(src, dest)
            size_mb = round(dest.stat().st_size / (1024 * 1024), 2)
            return {'success': True, 'file': dest.name, 'size_mb': size_mb}
        except Exception as e:
            logger.exception(f"SQLite backup xato: {e}")
            return {'success': False, 'error': str(e)}

    if 'postgresql' in db_engine:
        dest = backup_dir / f'backup_{timestamp}.sql'
        try:
            import os
            env = {**os.environ, 'PGPASSWORD': db_config.get('PASSWORD', '')}
            cmd = [
                'pg_dump',
                '-h', db_config.get('HOST', 'localhost'),
                '-p', str(db_config.get('PORT', 5432)),
                '-U', db_config.get('USER', ''),
                '-d', db_config.get('NAME', ''),
                '-f', str(dest),
                '--no-owner', '--no-acl',
            ]
            result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                # Faylni tozalash
                if dest.exists():
                    dest.unlink()
                return {'success': False, 'error': f"pg_dump: {result.stderr.strip()[:500]}"}
            size_mb = round(dest.stat().st_size / (1024 * 1024), 2)
            return {'success': True, 'file': dest.name, 'size_mb': size_mb}
        except FileNotFoundError:
            return {'success': False, 'error': "pg_dump topilmadi — PostgreSQL client o'rnatilishi kerak"}
        except Exception as e:
            logger.exception(f"pg_dump xato: {e}")
            return {'success': False, 'error': str(e)}

    return {'success': False, 'error': f'unsupported_db: {db_engine}'}


def cleanup_old_backups(max_backups: int) -> int:
    """Eski backup fayllarini o'chiradi, faqat oxirgi `max_backups` tasini qoldiradi.
    Returns: o'chirilgan fayllar soni.
    """
    from django.conf import settings as dj_settings
    backup_dir = Path(dj_settings.BASE_DIR) / 'backups'
    if not backup_dir.exists() or max_backups < 1:
        return 0

    backups = sorted(backup_dir.glob('backup_*.*'), key=lambda p: p.stat().st_mtime, reverse=True)
    if len(backups) <= max_backups:
        return 0

    deleted = 0
    for old_file in backups[max_backups:]:
        try:
            old_file.unlink()
            deleted += 1
        except Exception as e:
            logger.warning(f"Eski backup o'chirilmadi ({old_file.name}): {e}")
    if deleted:
        logger.info(f"Eski backup fayllar o'chirildi: {deleted} ta")
    return deleted


# ───────────────────────────────────────────────────────────
# AVTOMATIK BACKUP — backup_schedule asosida
# ───────────────────────────────────────────────────────────
@shared_task(name='apps.system_settings.tasks.task_auto_backup')
def task_auto_backup():
    """Backup_schedule sozlamasiga qarab backup yaratadi + eski backuplarni tozalaydi."""
    from django.conf import settings as dj_settings
    from .models import SystemSettings

    try:
        sysconf = SystemSettings.load()
        schedule = sysconf.backup_schedule
        max_backups = sysconf.max_backups or 10
    except Exception as e:
        logger.exception(f"SystemSettings yuklanmadi: {e}")
        return {'skipped': True, 'reason': 'settings_load_failed'}

    if schedule == 'disabled':
        return {'skipped': True, 'reason': 'disabled'}

    now = timezone.now()
    backup_dir = Path(dj_settings.BASE_DIR) / 'backups'
    backup_dir.mkdir(exist_ok=True)

    # Oxirgi backup vaqti (timezone-aware qilib)
    backups = sorted(backup_dir.glob('backup_*.*'), key=lambda p: p.stat().st_mtime, reverse=True)
    last_backup_aware = None
    if backups:
        naive = datetime.fromtimestamp(backups[0].stat().st_mtime)
        last_backup_aware = timezone.make_aware(naive) if timezone.is_naive(naive) else naive

    # Schedule asosida tekshirish
    if last_backup_aware:
        delta_days = (now - last_backup_aware).days
        if schedule == 'daily' and delta_days < 1:
            return {'skipped': True, 'reason': 'too_soon', 'last_backup': last_backup_aware.isoformat()}
        if schedule == 'weekly' and delta_days < 7:
            return {'skipped': True, 'reason': 'too_soon', 'last_backup': last_backup_aware.isoformat()}
        if schedule == 'monthly' and delta_days < 30:
            return {'skipped': True, 'reason': 'too_soon', 'last_backup': last_backup_aware.isoformat()}

    # Backup yaratish
    result = create_backup_file()
    if not result.get('success'):
        logger.error(f"Auto-backup xato: {result.get('error')}")
        return {'error': result.get('error')}

    # Eski backuplarni tozalash
    deleted = cleanup_old_backups(max_backups)

    logger.info(f"Auto-backup yaratildi: {result['file']} ({result['size_mb']} MB), eski o'chirildi: {deleted}")
    return {
        'created': result['file'],
        'size_mb': result['size_mb'],
        'schedule': schedule,
        'old_deleted': deleted,
    }


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
