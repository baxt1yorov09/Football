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


class ContactMessageView(APIView):
    """Ochiq murojaat formasi — /contact sahifasidan kelgan xabarlarni
    sozlangan email manziliga jo'natadi.

    Auth talab qilmaydi. IP-based oddiy rate-limit qo'llaniladi
    (1 soatda 5 ta xabar).
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        from django.core.mail import EmailMessage
        from django.core.cache import cache
        import logging
        import re
        logger = logging.getLogger(__name__)

        # ── 1. Rate limit (IP boshiga 1 soatda 5 ta) ──────────────
        ip = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR')
            or 'unknown'
        )
        rate_key = f'contact_rl:{ip}'
        attempts = cache.get(rate_key, 0)
        if attempts >= 5:
            return Response(
                {'detail': "Juda ko'p so'rov yuborildi. Iltimos, keyinroq urinib ko'ring."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # ── 2. Ma'lumotlarni o'qish va tekshirish ─────────────────
        data = request.data if isinstance(request.data, dict) else {}
        name = str(data.get('name', '')).strip()
        email = str(data.get('email', '')).strip()
        phone = str(data.get('phone', '')).strip()
        subject = str(data.get('subject', '')).strip() or "Yangi murojaat (kontakt formasi)"
        message = str(data.get('message', '')).strip()

        if not name or not email or not message:
            return Response(
                {'detail': "Ism, email va xabar matni majburiy"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(name) > 150 or len(subject) > 200 or len(message) > 5000:
            return Response(
                {'detail': "Maydon uzunligi chegaradan oshib ketdi"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return Response(
                {'detail': "Yaroqli email kiriting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. Email tayyorlash ───────────────────────────────────
        recipient = getattr(django_settings, 'CONTACT_RECIPIENT_EMAIL', 'murabbiylartalimi@gmail.com')
        from_email = getattr(django_settings, 'DEFAULT_FROM_EMAIL', None) or 'no-reply@ufa.local'

        body = (
            f"Yangi murojaat — UFA Litsenziya Tizimi\n"
            f"{'=' * 50}\n\n"
            f"Ism:     {name}\n"
            f"Email:   {email}\n"
            f"Telefon: {phone or '—'}\n"
            f"Mavzu:   {subject}\n"
            f"IP:      {ip}\n"
            f"Vaqt:    {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            f"{'-' * 50}\n"
            f"Xabar:\n\n{message}\n"
        )

        try:
            mail = EmailMessage(
                subject=f"[UFA Contact] {subject}",
                body=body,
                from_email=from_email,
                to=[recipient],
                reply_to=[email],  # Admin javob bersa, to'g'ridan-to'g'ri foydalanuvchiga ketadi
            )
            mail.send(fail_silently=False)
        except Exception as e:
            logger.error(f"Contact email yuborilmadi: {e}")
            return Response(
                {'detail': "Xabar yuborishda xatolik yuz berdi. Keyinroq urinib ko'ring."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Rate limit'ni yangilash
        cache.set(rate_key, attempts + 1, timeout=3600)

        return Response(
            {'detail': "Xabaringiz muvaffaqiyatli yuborildi. Tez orada siz bilan bog'lanamiz."},
            status=status.HTTP_200_OK,
        )


class MaintenanceStatusView(APIView):
    """Texnik xizmat rejimi holati — auth talab qilmaydi (banner uchun)."""
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        try:
            settings_obj = SystemSettings.load()
            return Response({
                'maintenance_mode': bool(settings_obj.maintenance_mode),
                'system_name': settings_obj.system_name,
                'updated_at': settings_obj.updated_at.isoformat() if settings_obj.updated_at else None,
            })
        except Exception:
            return Response({'maintenance_mode': False})


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

        # Maintenance mode — faqat super_admin boshqara oladi
        if 'maintenance_mode' in request.data:
            if getattr(request.user, 'role', None) != 'super_admin':
                return Response(
                    {'detail': "Texnik xizmat rejimini faqat Super Admin yoqishi yoki o'chirishi mumkin"},
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

        from .tasks import create_backup_file, cleanup_old_backups
        result = create_backup_file()
        if not result.get('success'):
            return Response(
                {'detail': f"Backup xatolik: {result.get('error')}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Eski backuplarni tozalash
        try:
            sysconf = SystemSettings.load()
            deleted = cleanup_old_backups(sysconf.max_backups or 10)
        except Exception:
            deleted = 0

        return Response({
            'detail': 'Backup muvaffaqiyatli yaratildi',
            'file': result['file'],
            'size_mb': result['size_mb'],
            'old_deleted': deleted,
            'created_at': timezone.now().isoformat(),
        })


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


class BackupListView(APIView):
    """Mavjud backup'lar ro'yxati (faqat admin)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'detail': 'Faqat administratorlar uchun'}, status=403)

        backup_dir = Path(django_settings.BASE_DIR) / 'backups'
        if not backup_dir.exists():
            return Response({'backups': [], 'total_size_mb': 0})

        items = []
        total_size = 0
        for f in sorted(backup_dir.glob('backup_*.*'), key=lambda p: p.stat().st_mtime, reverse=True):
            try:
                stat = f.stat()
                size = stat.st_size
                total_size += size
                items.append({
                    'name': f.name,
                    'size_mb': round(size / (1024 * 1024), 2),
                    'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
            except Exception:
                continue

        return Response({
            'backups': items,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'count': len(items),
        })


class BackupDownloadView(APIView):
    """Backup faylini yuklab olish."""
    permission_classes = [IsAuthenticated]

    def get(self, request, name):
        from django.http import FileResponse, Http404

        if not _is_admin(request.user):
            return Response({'detail': 'Faqat administratorlar uchun'}, status=403)

        # Path traversal himoyasi
        if '/' in name or '\\' in name or '..' in name or not name.startswith('backup_'):
            return Response({'detail': 'Noto\'g\'ri fayl nomi'}, status=400)

        backup_dir = Path(django_settings.BASE_DIR) / 'backups'
        f = backup_dir / name
        if not f.exists() or not f.is_file():
            raise Http404('Backup topilmadi')

        return FileResponse(open(f, 'rb'), as_attachment=True, filename=f.name)


class BackupDeleteView(APIView):
    """Backup faylini o'chirish."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, name):
        if not _is_admin(request.user):
            return Response({'detail': 'Faqat administratorlar uchun'}, status=403)

        if '/' in name or '\\' in name or '..' in name or not name.startswith('backup_'):
            return Response({'detail': 'Noto\'g\'ri fayl nomi'}, status=400)

        backup_dir = Path(django_settings.BASE_DIR) / 'backups'
        f = backup_dir / name
        if not f.exists():
            return Response({'detail': 'Topilmadi'}, status=404)

        try:
            f.unlink()
            return Response({'detail': 'O\'chirildi', 'name': name})
        except Exception as e:
            return Response({'detail': f'Xatolik: {e}'}, status=500)


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


class BroadcastNotificationView(APIView):
    """Barcha faol foydalanuvchilarga ogohlantirish yuborish (faqat admin).

    Body:
      - title: str (required, max 200)
      - message: str (required)
      - channels: list[str] (optional) — ['in_app', 'email', 'telegram'], default hammasi

    Notification kanallari:
      - in_app: DB'ga saqlanadi, bell ikonkasida chiqadi
      - email: Foydalanuvchi emailiga yuboriladi (agar email bor bo'lsa)
      - telegram: TelegramUser linked bo'lgan foydalanuvchilarga yuboriladi
    """
    permission_classes = [IsAuthenticated]

    ALLOWED_CHANNELS = ('in_app', 'email', 'telegram')

    def post(self, request):
        if not _is_admin(request.user):
            return Response(
                {'detail': 'Faqat administratorlar uchun'},
                status=status.HTTP_403_FORBIDDEN,
            )

        title = (request.data.get('title') or '').strip()
        message = (request.data.get('message') or '').strip()
        channels = request.data.get('channels') or list(self.ALLOWED_CHANNELS)

        if not title or not message:
            return Response(
                {'detail': "Sarlavha va matn to'ldirilishi shart"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(title) > 200:
            return Response(
                {'detail': "Sarlavha 200 belgidan oshmasligi kerak"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(channels, list):
            return Response(
                {'detail': "channels massiv bo'lishi kerak"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        channels = [c for c in channels if c in self.ALLOWED_CHANNELS]
        if not channels:
            return Response(
                {'detail': "Kamida bitta kanal tanlash kerak"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ro'yxatlangan barcha faol foydalanuvchilar (o'zidan tashqari)
        from apps.users.models import User
        from apps.notifications.models import Notification, TelegramUser

        users_qs = User.objects.filter(is_active=True, notifications_enabled=True).exclude(id=request.user.id)
        total_users = users_qs.count()

        stats = {'in_app': 0, 'email': 0, 'telegram': 0, 'errors': 0}

        # 1. In-app bulk yaratish (tez)
        if 'in_app' in channels:
            try:
                Notification.objects.bulk_create([
                    Notification(user=u, type='admin_alert', title=title, message=message)
                    for u in users_qs.only('id')
                ])
                stats['in_app'] = total_users
            except Exception:
                stats['errors'] += 1

        # 2. Email — DEFAULT_FROM_EMAIL sozlangan bo'lsa
        if 'email' in channels:
            from django.core.mail import send_mass_mail
            from apps.notifications.service import _build_email_html
            try:
                emails = list(users_qs.exclude(email='').exclude(email__isnull=True).values_list('email', flat=True))
                if emails:
                    html_body = _build_email_html(title, message)
                    from django.core.mail import EmailMultiAlternatives
                    from django.conf import settings as dj_settings
                    from_email = getattr(dj_settings, 'DEFAULT_FROM_EMAIL', None)
                    sent = 0
                    for email in emails:
                        try:
                            msg = EmailMultiAlternatives(title, message, from_email, [email])
                            msg.attach_alternative(html_body, 'text/html')
                            msg.send(fail_silently=True)
                            sent += 1
                        except Exception:
                            stats['errors'] += 1
                    stats['email'] = sent
            except Exception:
                stats['errors'] += 1

        # 3. Telegram
        if 'telegram' in channels:
            from apps.notifications.service import _send_telegram
            tg_users = users_qs.filter(telegram_user__is_active=True, telegram_user__notifications_enabled=True)
            sent = 0
            for u in tg_users.only('id'):
                try:
                    res = _send_telegram(u, f"⚠️ *{title}*\n\n{message}")
                    if res.get('success'):
                        sent += 1
                except Exception:
                    stats['errors'] += 1
            stats['telegram'] = sent

        return Response({
            'detail': f"{total_users} ta foydalanuvchiga xabar yuborildi",
            'total_users': total_users,
            'stats': stats,
            'channels': channels,
        })
