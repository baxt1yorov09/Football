"""
Markaziy NotificationService — barcha bildirishnomalar shu yerdan o'tadi.

Kanallar:
  - SMS (utils/sms_services.py — Eskiz / Playmobile / Mock)
  - Telegram (apps/notifications/bot.py — _send_message_sync)
  - Web (Notification DB model)

Har metod bitta hodisani qoplaydi: application_received, application_approved,
application_rejected, application_docs_required, license_expiring, license_expired,
license_suspended, license_revoked.
"""
from __future__ import annotations

import logging
from typing import Optional

from django.conf import settings
from django.utils import timezone

from .models import Notification, TelegramUser

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────
# LOW-LEVEL CHANNEL HELPERS
# ─────────────────────────────────────────────────────────────────────
def _send_sms(phone: str, message: str) -> dict:
    """Sync SMS yuborish (mavjud sms_services factory orqali)."""
    if not phone:
        return {'success': False, 'error': 'no_phone'}
    try:
        from utils.sms_services import send_sms as _send
        return _send(phone, message)
    except Exception as e:
        logger.exception(f"SMS yuborish xatosi: {e}")
        return {'success': False, 'error': str(e)}


def _send_telegram(user, text: str, keyboard: Optional[dict] = None) -> dict:
    """Mavjud bot.py orqali Telegram yuborish."""
    try:
        from .bot import _send_message_sync
        tu = TelegramUser.objects.filter(
            user=user, is_active=True, notifications_enabled=True
        ).first()
        if not tu:
            return {'success': False, 'error': 'no_telegram_link'}
        ok = _send_message_sync(tu.telegram_id, text, keyboard)
        return {'success': bool(ok)}
    except Exception as e:
        logger.exception(f"Telegram yuborish xatosi: {e}")
        return {'success': False, 'error': str(e)}


def _create_web_notification(user, notif_type: str, title: str, message: str) -> Notification:
    """Web bell uchun DB record yaratish."""
    return Notification.objects.create(
        user=user,
        type=notif_type,
        title=title,
        message=message,
    )


# ─────────────────────────────────────────────────────────────────────
# CORE SERVICE
# ─────────────────────────────────────────────────────────────────────
class NotificationService:
    """Barcha hodisalar uchun yuborish metodlari."""

    WEB_URL = (getattr(settings, 'WEB_APP_URL', 'http://localhost:3000') or '').rstrip('/')

    # ─── INTERNAL DISPATCHER ──────────────────────────────────────────
    def _dispatch(
        self,
        user,
        notif_type: str,
        *,
        sms_text: Optional[str] = None,
        telegram_text: Optional[str] = None,
        telegram_keyboard: Optional[dict] = None,
        web_title: Optional[str] = None,
        web_message: Optional[str] = None,
    ):
        """Barcha kanallarga yuborib, har birini DB ga log qiladi."""
        if not user or not getattr(user, 'notifications_enabled', True):
            return

        # 1. SMS
        if sms_text and getattr(user, 'phone', None):
            res = _send_sms(user.phone, sms_text)
            if not res.get('success'):
                logger.warning(f"SMS muvaffaqiyatsiz [{notif_type}]: {res.get('error')}")

        # 2. Telegram
        if telegram_text:
            res = _send_telegram(user, telegram_text, telegram_keyboard)
            if not res.get('success'):
                logger.info(f"Telegram skip/xato [{notif_type}]: {res.get('error')}")

        # 3. Web Bell
        if web_title and web_message:
            try:
                _create_web_notification(user, notif_type, web_title, web_message)
            except Exception as e:
                logger.exception(f"Web notification xato [{notif_type}]: {e}")

    # ─── APPLICATION EVENTS ───────────────────────────────────────────
    def application_received(self, application):
        user = application.user
        if not user:
            return
        lic_name = application.license_type.name_uz if application.license_type else "—"
        app_id = str(application.id)[:8].upper()

        self._dispatch(
            user,
            'app_received',
            sms_text=(
                f"UFF: Arizangiz qabul qilindi! "
                f"ID: #{app_id}. Litsenziya: {lic_name}. "
                f"Natija haqida xabar beriladi."
            ),
            telegram_text=(
                f"✅ *Arizangiz qabul qilindi!*\n\n"
                f"🆔 Ariza: `#{app_id}`\n"
                f"📄 Litsenziya: *{lic_name}*\n\n"
                f"Admin ko'rib chiqadi. Natija haqida xabar beramiz."
            ),
            telegram_keyboard={
                'inline_keyboard': [[{
                    'text': "🌐 Arizani ko'rish",
                    'url': f"{self.WEB_URL}/applications",
                }]]
            },
            web_title="Ariza qabul qilindi",
            web_message=f"{lic_name} litsenziyasi uchun ariza #{app_id} qabul qilindi.",
        )

    def application_under_review(self, application):
        user = application.user
        if not user:
            return
        lic_name = application.license_type.name_uz if application.license_type else "—"
        app_id = str(application.id)[:8].upper()

        self._dispatch(
            user,
            'app_under_review',
            telegram_text=(
                f"🔵 *Arizangiz ko'rib chiqilmoqda*\n\n"
                f"🆔 Ariza: `#{app_id}`\n"
                f"📄 Litsenziya: *{lic_name}*\n\n"
                f"Tez orada natija ma'lum bo'ladi."
            ),
            telegram_keyboard={
                'inline_keyboard': [[{
                    'text': "📋 Ariza holati",
                    'url': f"{self.WEB_URL}/applications",
                }]]
            },
            web_title="Ariza ko'rib chiqilmoqda",
            web_message=f"#{app_id} ariza admin tomonidan ko'rib chiqilmoqda.",
        )

    def application_docs_required(self, application):
        user = application.user
        if not user:
            return
        lic_name = application.license_type.name_uz if application.license_type else "—"
        app_id = str(application.id)[:8].upper()
        note = (application.admin_note or '').strip()

        self._dispatch(
            user,
            'docs_required',
            sms_text=(
                f"UFF: Ariza #{app_id} uchun qo'shimcha hujjat kerak. "
                f"Batafsil: {self.WEB_URL}/applications"
            ),
            telegram_text=(
                f"📎 *Qo'shimcha hujjat talab qilinmoqda*\n\n"
                f"🆔 Ariza: `#{app_id}`\n"
                f"📄 Litsenziya: *{lic_name}*\n"
                + (f"📝 Admin izohi: _{note}_\n\n" if note else "\n")
                + "Hujjatlarni yuklang va qayta yuboring 👇"
            ),
            telegram_keyboard={
                'inline_keyboard': [[{
                    'text': "📤 Hujjat yuborish",
                    'url': f"{self.WEB_URL}/applications",
                }]]
            },
            web_title="Qo'shimcha hujjat kerak",
            web_message=f"#{app_id}: " + (note or "Admin qo'shimcha hujjat so'radi."),
        )

    def application_approved(self, application):
        user = application.user
        if not user:
            return
        lic_name = application.license_type.name_uz if application.license_type else "—"
        app_id = str(application.id)[:8].upper()

        lic = getattr(application, 'license', None)
        lic_number = lic.license_number if lic else ''
        expires_at = lic.expires_at.strftime('%d.%m.%Y') if lic and lic.expires_at else ''
        pdf_url = lic.pdf_url if lic else ''

        self._dispatch(
            user,
            'app_approved',
            sms_text=(
                f"UFF: Tabriklaymiz! Litsenziyangiz tasdiqlandi. "
                f"Tur: {lic_name}"
                + (f", raqam: {lic_number}" if lic_number else "")
                + f". {self.WEB_URL}/licenses"
            ),
            telegram_text=(
                f"🎉 *Tabriklaymiz! Litsenziyangiz tasdiqlandi!*\n\n"
                f"📄 Litsenziya: *{lic_name}*\n"
                + (f"🆔 Raqam: `{lic_number}`\n" if lic_number else "")
                + (f"⏳ Amal qiladi: {expires_at}\n" if expires_at else "")
                + "\nPDF litsenziyangizni yuklab oling 👇"
            ),
            telegram_keyboard={
                'inline_keyboard': [
                    [{'text': "📥 PDF yuklab olish",
                      'url': pdf_url or f"{self.WEB_URL}/licenses"}],
                    [{'text': "🏆 Litsenziyalarim",
                      'url': f"{self.WEB_URL}/licenses"}],
                ]
            },
            web_title="🎉 Litsenziyangiz tasdiqlandi!",
            web_message=(
                f"{lic_name} litsenziyasi tasdiqlandi."
                + (f" Raqam: {lic_number}" if lic_number else "")
            ),
        )

    def application_rejected(self, application):
        user = application.user
        if not user:
            return
        lic_name = application.license_type.name_uz if application.license_type else "—"
        app_id = str(application.id)[:8].upper()
        reason = (application.rejection_reason or "Sabab ko'rsatilmagan").strip()

        self._dispatch(
            user,
            'app_rejected',
            sms_text=(
                f"UFF: Ariza #{app_id} rad etildi. "
                f"Sabab: {reason[:80]}. Qayta ariza: {self.WEB_URL}/apply"
            ),
            telegram_text=(
                f"❌ *Arizangiz rad etildi*\n\n"
                f"🆔 Ariza: `#{app_id}`\n"
                f"📄 Litsenziya: *{lic_name}*\n"
                f"📝 Sabab: _{reason}_\n\n"
                f"Hujjatlarni to'g'rilab qayta ariza bering 👇"
            ),
            telegram_keyboard={
                'inline_keyboard': [
                    [{'text': "🔄 Qayta ariza berish",
                      'url': f"{self.WEB_URL}/apply"}],
                    [{'text': "📋 Arizalarim",
                      'url': f"{self.WEB_URL}/applications"}],
                ]
            },
            web_title="Ariza rad etildi",
            web_message=f"#{app_id} rad etildi. Sabab: {reason}",
        )

    # ─── LICENSE EVENTS ───────────────────────────────────────────────
    def license_expiring(self, license_obj, days: int):
        user = license_obj.user
        if not user:
            return
        lic_name = license_obj.license_type.name_uz if license_obj.license_type else "—"
        lic_num = license_obj.license_number
        expires = license_obj.expires_at.strftime('%d.%m.%Y') if license_obj.expires_at else "—"

        if days <= 7:
            emoji, urgency = "🚨", "JUDA SHOSHILINCH"
        elif days <= 14:
            emoji, urgency = "🔴", "Shoshilinch"
        else:
            emoji, urgency = "⚠️", "Diqqat"

        self._dispatch(
            user,
            f'expiry_{days}' if days in (30, 14, 7) else 'expiry',
            sms_text=(
                f"UFF: {emoji} Litsenziya muddati tugayapti! "
                f"{lic_name} ({lic_num}), {expires} ({days} kun). "
                f"Yangilash: {self.WEB_URL}/apply"
            ),
            telegram_text=(
                f"{emoji} *{urgency}! Litsenziya muddati tugayapti!*\n\n"
                f"📄 Litsenziya: *{lic_name}*\n"
                f"🆔 Raqam: `{lic_num}`\n"
                f"⏳ Tugash sanasi: {expires}\n"
                f"📅 Qolgan muddat: *{days} kun*\n\n"
                f"Yangilash uchun ariza bering 👇"
            ),
            telegram_keyboard={
                'inline_keyboard': [[{
                    'text': "🔄 Yangilash ariza",
                    'url': f"{self.WEB_URL}/apply",
                }]]
            },
            web_title=f"{emoji} Litsenziya {days} kunda tugaydi!",
            web_message=f"{lic_name} ({lic_num}) — {expires} kuni tugaydi.",
        )

    def license_expired(self, license_obj):
        user = license_obj.user
        if not user:
            return
        lic_name = license_obj.license_type.name_uz if license_obj.license_type else "—"
        lic_num = license_obj.license_number

        self._dispatch(
            user,
            'lic_expired',
            sms_text=(
                f"UFF: Litsenziyangiz muddati tugadi! "
                f"{lic_name} ({lic_num}). Yangilash uchun ariza bering."
            ),
            telegram_text=(
                f"❌ *Litsenziyangiz muddati tugadi!*\n\n"
                f"📄 Litsenziya: *{lic_name}*\n"
                f"🆔 Raqam: `{lic_num}`\n\n"
                f"Litsenziyangiz endi amal qilmaydi.\n"
                f"Yangilash uchun ariza bering 👇"
            ),
            telegram_keyboard={
                'inline_keyboard': [[{
                    'text': "🔄 Yangilash ariza",
                    'url': f"{self.WEB_URL}/apply",
                }]]
            },
            web_title="❌ Litsenziya muddati tugadi",
            web_message=f"{lic_name} ({lic_num}) endi amal qilmaydi.",
        )

    def license_suspended(self, license_obj):
        user = license_obj.user
        if not user:
            return
        reason = (license_obj.suspend_reason or '').strip()
        lic_name = license_obj.license_type.name_uz if license_obj.license_type else "—"

        self._dispatch(
            user,
            'lic_suspended',
            sms_text=(
                f"UFF: Litsenziyangiz to'xtatildi. "
                f"{license_obj.license_number}. Sabab: {reason[:80]}"
            ),
            telegram_text=(
                f"⚠️ *Litsenziyangiz vaqtincha to'xtatildi*\n\n"
                f"📄 Litsenziya: *{lic_name}*\n"
                f"🆔 Raqam: `{license_obj.license_number}`\n"
                + (f"📝 Sabab: _{reason}_\n\n" if reason else "\n")
                + "Batafsil uchun murojaat qiling."
            ),
            web_title="Litsenziya to'xtatildi",
            web_message=f"{license_obj.license_number} — " + (reason or "sabab ko'rsatilmagan"),
        )

    # ─── ADMIN EVENTS ─────────────────────────────────────────────────
    def _get_admins(self, region=None):
        """super_admin + region_admin (mos viloyat bo'lsa) qaytaradi."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        qs = User.objects.filter(is_active=True, role__in=['super_admin', 'region_admin'])
        # region_admin'larni faqat o'z viloyati bo'yicha cheklash (agar mavjud bo'lsa)
        # Hozircha hamma admin'lar ko'radi
        return list(qs)

    def notify_admins_new_application(self, application):
        """Yangi ariza keldi — barcha admin'larga web bildirishnoma."""
        try:
            lic_name = application.license_type.name_uz if application.license_type else "—"
            app_id = str(application.id)[:8].upper()
            applicant = getattr(application.user, 'full_name', None) or getattr(application.user, 'phone', '—')

            title = "Yangi ariza keldi"
            message = f"#{app_id} — {applicant}, {lic_name}"

            for admin in self._get_admins(region=getattr(application, 'region', None)):
                # admin user'iga web bell yozamiz
                try:
                    _create_web_notification(admin, 'system', title, message)
                except Exception as e:
                    logger.warning(f"admin web notif xato: {e}")

                # Super_admin'larga Telegram ham
                tg_text = (
                    f"📥 *Yangi ariza keldi*\n\n"
                    f"🆔 ID: `#{app_id}`\n"
                    f"👤 Murabbiy: *{applicant}*\n"
                    f"📄 Litsenziya: *{lic_name}*\n"
                )
                tg_kb = {
                    'inline_keyboard': [[{
                        'text': "🛠 Admin panel",
                        'url': f"{self.WEB_URL}/admin/applications",
                    }]]
                }
                _send_telegram(admin, tg_text, tg_kb)
        except Exception as e:
            logger.exception(f"notify_admins_new_application xato: {e}")

    def notify_admins_license_expiring(self, license_obj, days: int):
        """Admin'larga muddati tugayotgan litsenziya haqida."""
        try:
            lic_name = license_obj.license_type.name_uz if license_obj.license_type else "—"
            user_name = getattr(license_obj.user, 'full_name', None) or getattr(license_obj.user, 'phone', '—')
            title = f"Litsenziya {days} kunda tugaydi"
            message = f"{user_name}: {lic_name} ({license_obj.license_number})"

            for admin in self._get_admins(region=getattr(license_obj, 'region', None)):
                try:
                    _create_web_notification(admin, 'system', title, message)
                except Exception as e:
                    logger.warning(f"admin expiry web notif xato: {e}")
        except Exception as e:
            logger.exception(f"notify_admins_license_expiring xato: {e}")

    def license_revoked(self, license_obj):
        user = license_obj.user
        if not user:
            return
        reason = (license_obj.revoke_reason or '').strip()
        lic_name = license_obj.license_type.name_uz if license_obj.license_type else "—"

        self._dispatch(
            user,
            'lic_revoked',
            sms_text=(
                f"UFF: Litsenziyangiz bekor qilindi. "
                f"{license_obj.license_number}. Sabab: {reason[:80]}"
            ),
            telegram_text=(
                f"🚫 *Litsenziyangiz bekor qilindi*\n\n"
                f"📄 Litsenziya: *{lic_name}*\n"
                f"🆔 Raqam: `{license_obj.license_number}`\n"
                + (f"📝 Sabab: _{reason}_\n\n" if reason else "\n")
                + "Murojaat uchun federatsiya bilan bog'laning."
            ),
            web_title="🚫 Litsenziya bekor qilindi",
            web_message=f"{license_obj.license_number} bekor qilindi.",
        )


# Global instance
notification_service = NotificationService()
