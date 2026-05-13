import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings as django_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import SystemSettings, NotificationPreference
from .serializers import SystemSettingsSerializer, NotificationPreferenceSerializer


def _is_admin(user):
    return getattr(user, 'role', None) in ('super_admin', 'region_admin') or user.is_staff


class SystemSettingsView(APIView):
    """Tizim sozlamalarini olish va yangilash (faqat admin)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj = SystemSettings.load()
        return Response(SystemSettingsSerializer(settings_obj).data)

    def patch(self, request):
        if not _is_admin(request.user):
            return Response(
                {'detail': 'Faqat administratorlar tizim sozlamalarini o\'zgartira oladi'},
                status=status.HTTP_403_FORBIDDEN,
            )
        settings_obj = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationPreferencesView(APIView):
    """Foydalanuvchining bildirishnoma sozlamalari"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Hamma turlar uchun preference qaytaradi (mavjud bo'lmasa default yaratiladi)
        existing = {
            p.notification_type: p
            for p in NotificationPreference.objects.filter(user=request.user)
        }
        result = []
        for type_value, type_label in NotificationPreference.NOTIFICATION_TYPES:
            if type_value in existing:
                pref = existing[type_value]
            else:
                pref = NotificationPreference.objects.create(
                    user=request.user,
                    notification_type=type_value,
                )
            result.append(NotificationPreferenceSerializer(pref).data)
        return Response(result)

    def patch(self, request):
        # Body: list of {notification_type, email_enabled, telegram_enabled, in_app_enabled}
        items = request.data if isinstance(request.data, list) else request.data.get('items', [])
        if not isinstance(items, list):
            return Response(
                {'detail': 'Body massiv bo\'lishi kerak'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        updated = []
        for item in items:
            ntype = item.get('notification_type')
            if not ntype:
                continue
            pref, _ = NotificationPreference.objects.get_or_create(
                user=request.user,
                notification_type=ntype,
            )
            if 'email_enabled' in item:
                pref.email_enabled = bool(item['email_enabled'])
            if 'telegram_enabled' in item:
                pref.telegram_enabled = bool(item['telegram_enabled'])
            if 'in_app_enabled' in item:
                pref.in_app_enabled = bool(item['in_app_enabled'])
            pref.save()
            updated.append(NotificationPreferenceSerializer(pref).data)
        return Response(updated)


class RunBackupNowView(APIView):
    """Ma'lumotlar bazasi backup'ini darhol yaratish (faqat admin)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_admin(request.user):
            return Response(
                {'detail': 'Faqat administratorlar uchun'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            backup_dir = Path(django_settings.BASE_DIR) / 'backups'
            backup_dir.mkdir(exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

            db_config = django_settings.DATABASES['default']
            db_engine = db_config.get('ENGINE', '')

            if 'sqlite' in db_engine:
                src = Path(db_config['NAME'])
                if not src.exists():
                    return Response({'detail': 'Ma\'lumotlar bazasi fayli topilmadi'}, status=500)
                dest = backup_dir / f'backup_{timestamp}.sqlite3'
                shutil.copy2(src, dest)
                size_mb = round(dest.stat().st_size / (1024 * 1024), 2)
                return Response({
                    'detail': 'Backup muvaffaqiyatli yaratildi',
                    'file': str(dest.name),
                    'size_mb': size_mb,
                    'created_at': timezone.now().isoformat(),
                })
            else:
                return Response({
                    'detail': 'Bu ma\'lumotlar bazasi turi uchun avtomatik backup qo\'llab-quvvatlanmaydi. Manual backup qiling.',
                }, status=400)
        except Exception as e:
            return Response({'detail': f'Backup xatolik: {str(e)}'}, status=500)


class CleanLogsView(APIView):
    """Eski log fayllarni tozalash (faqat admin)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_admin(request.user):
            return Response(
                {'detail': 'Faqat administratorlar uchun'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            settings_obj = SystemSettings.load()
            retention = settings_obj.log_retention

            if retention == 'forever':
                return Response({'detail': 'Log saqlash muddati cheksiz, hech narsa o\'chirilmadi', 'deleted_count': 0})

            days = int(retention) if retention.isdigit() else 90
            cutoff = datetime.now() - timedelta(days=days)

            logs_dir = Path(django_settings.BASE_DIR) / 'logs'
            if not logs_dir.exists():
                return Response({'detail': 'Log papkasi topilmadi', 'deleted_count': 0})

            deleted_count = 0
            total_size = 0
            for log_file in logs_dir.glob('*.log*'):
                try:
                    mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
                    if mtime < cutoff:
                        total_size += log_file.stat().st_size
                        log_file.unlink()
                        deleted_count += 1
                except Exception:
                    continue

            return Response({
                'detail': f'{deleted_count} ta log fayli tozalandi',
                'deleted_count': deleted_count,
                'freed_mb': round(total_size / (1024 * 1024), 2),
                'retention_days': days,
            })
        except Exception as e:
            return Response({'detail': f'Tozalashda xatolik: {str(e)}'}, status=500)


class SystemStatusView(APIView):
    """Tizim holati va statistikalari"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'detail': 'Faqat administratorlar uchun'}, status=403)

        try:
            backup_dir = Path(django_settings.BASE_DIR) / 'backups'
            backup_count = len(list(backup_dir.glob('backup_*.*'))) if backup_dir.exists() else 0
            last_backup = None
            if backup_dir.exists():
                backups = sorted(backup_dir.glob('backup_*.*'), key=lambda p: p.stat().st_mtime, reverse=True)
                if backups:
                    last_backup = datetime.fromtimestamp(backups[0].stat().st_mtime).isoformat()

            logs_dir = Path(django_settings.BASE_DIR) / 'logs'
            log_count = len(list(logs_dir.glob('*.log*'))) if logs_dir.exists() else 0
            log_size_mb = 0
            if logs_dir.exists():
                log_size_mb = round(
                    sum(f.stat().st_size for f in logs_dir.glob('*.log*') if f.is_file()) / (1024 * 1024), 2
                )

            return Response({
                'backup_count': backup_count,
                'last_backup': last_backup,
                'log_count': log_count,
                'log_size_mb': log_size_mb,
                'server_time': timezone.now().isoformat(),
            })
        except Exception as e:
            return Response({'detail': f'Xatolik: {str(e)}'}, status=500)
