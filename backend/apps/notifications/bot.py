"""
UFF Telegram Bot — Murabbiy Litsenziya Tizimi
Tilllar: O'zbek va Rus
Auth: OTP orqali (telefon → 6 xonali kod → User'ga bog'lash)

Architecture:
- Lazy bot init (token bo'lmasa crash qilmaydi)
- TelegramUser modelida til va auth_state saqlanadi (FSM o'rniga)
- ORM async (sync_to_async)
- Webhook orqali Django ga ulanadi (apps/notifications/views.py: TelegramWebhookView)
- Backend tomonidan notification yuborish: send_telegram_notification()
"""
from __future__ import annotations

import asyncio
import logging
import re
import threading
from datetime import timedelta
from io import BytesIO
from typing import Optional

from asgiref.sync import sync_to_async
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════════════
# Optional dependencies
# ════════════════════════════════════════════════════════════════════
try:
    from telegram import (
        Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup,
        ReplyKeyboardMarkup, ReplyKeyboardRemove, KeyboardButton, InputFile,
    )
    from telegram.constants import ParseMode
    from telegram.ext import (
        Application, CommandHandler, CallbackQueryHandler,
        ContextTypes, MessageHandler, filters,
    )
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    Update = Bot = None  # type: ignore

try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False

try:
    import requests
except ImportError:
    requests = None  # type: ignore


# ════════════════════════════════════════════════════════════════════
# i18n DICTIONARY (uz/ru)
# ════════════════════════════════════════════════════════════════════
T = {
    'uz': {
        'welcome_new': (
            "⚽️ *O'zbekiston Futbol Federatsiyasi*\n"
            "_Murabbiy Litsenziya Tizimiga xush kelibsiz!_\n\n"
            "Davom etish uchun tilni tanlang:"
        ),
        'welcome_back': "⚽️ Xush kelibsiz, *{name}*!\n\nQuyidagi bo'limlardan birini tanlang:",
        'lang_set': "✅ Til tanlandi: *O'zbek*",
        'send_phone': (
            "📱 *Telefon raqamingizni ulashing*\n\n"
            "Quyidagi tugmani bosing yoki raqamni kiriting.\n"
            "Format: `+998 XX XXX XX XX`"
        ),
        'phone_btn': "📱 Telefon raqamimni ulashish",
        'phone_invalid': "❌ Noto'g'ri format. Misol: `+998 90 123 45 67`",
        'otp_sent': (
            "📨 *SMS kod yuborildi!*\n\n"
            "📱 Raqam: `{phone}`\n"
            "⏱ Muddat: 5 daqiqa\n\n"
            "6 xonali kodni kiriting:"
        ),
        'otp_demo': "\n\n🔧 _Demo kod:_ `{code}`",
        'otp_format': "❌ 6 ta raqam kiriting.",
        'otp_wrong': "❌ Noto'g'ri yoki muddati o'tgan kod.\n\n/start bosib qaytadan urining.",
        'login_ok': "✅ *Muvaffaqiyatli kirdingiz!*\n\nXush kelibsiz, *{name}*! 🎉",
        'not_logged_in': "🔐 Tizimga kirishingiz kerak.\n\n/start bosing va telefon raqamingizni ulashing.",
        'logged_out': "👋 Tizimdan chiqdingiz. Qayta kirish uchun /start bosing.",
        'main_menu': "📋 *Asosiy menyu*\n\nQuyidagi bo'limlardan birini tanlang:",
        'menu_apps': "📋 Arizalarim",
        'menu_licenses': "🏆 Litsenziyalarim",
        'menu_apply': "➕ Yangi ariza",
        'menu_profile': "👤 Profilim",
        'menu_notify': "🔔 Bildirishnomalar",
        'menu_help': "❓ Yordam",
        'menu_logout': "🚪 Chiqish",
        # Applications
        'apps_title': "📋 *Mening arizalarim*\nJami: *{total}* ta",
        'no_apps': "📋 Sizda hali ariza yo'q.\n\nVeb saytda ariza bering:",
        'app_detail': (
            "📋 *Ariza tafsilotlari*\n\n"
            "🆔 ID: `{app_id}`\n"
            "📄 Litsenziya: *{license_type}*\n"
            "📊 Holat: {status_emoji} *{status}*\n"
            "📅 Yuborilgan: {submitted}{extra}"
        ),
        'apps_more': "\n📋 Yana {n} ta ariza bor. Hammasini ko'rish uchun veb saytga o'ting.",
        # Licenses
        'lic_title': "🏆 *Litsenziyalarim*\nFaol: *{count}* ta",
        'no_lic': "🏆 Sizda hali litsenziya yo'q.\n\nAriza berish uchun veb saytga o'ting:",
        'lic_detail': (
            "🏆 *Litsenziya*\n\n"
            "📄 Raqam: `{number}`\n"
            "🎯 Tur: *{type}*\n"
            "📅 Berilgan: {issued}\n"
            "⏳ Tugaydi: {expires}\n"
            "📊 Holat: {status_emoji} *{status}*{warning}"
        ),
        'lic_expiring': "\n\n⚠️ *Diqqat!* Muddati *{days} kun*da tugaydi.",
        'lic_expired': "\n\n❌ *Muddati tugagan!*",
        # Profile
        'profile': (
            "👤 *Mening profilim*\n\n"
            "👤 Ism: *{name}*\n"
            "📱 Telefon: `{phone}`\n"
            "📧 Email: {email}\n"
            "🗺 Viloyat: {region}\n"
            "🏢 Ish joyi: {workplace}\n"
            "💼 Lavozim: {job}\n"
            "📅 Ro'yxatdan o'tgan: {joined}"
        ),
        # Notifications settings
        'notify_settings': (
            "🔔 *Bildirishnoma sozlamalari*\n\n"
            "Holat: {status}\n\n"
            "Bildirishnomalar quyidagi hollarda keladi:\n"
            "• ✅ Ariza tasdiqlanganda\n"
            "• ❌ Ariza rad etilganda\n"
            "• 📎 Qo'shimcha hujjat so'ralganda\n"
            "• ⚠️ Litsenziya muddati tugayotganda (30/14/7 kun)"
        ),
        'notify_on': "✅ Yoqilgan",
        'notify_off': "❌ O'chirilgan",
        'notify_toggle_on': "🔔 Yoqish",
        'notify_toggle_off': "🔕 O'chirish",
        'notify_updated': "🔔 Bildirishnomalar: *{status}*",
        # Help
        'help': (
            "❓ *Yordam*\n\n"
            "*Buyruqlar:*\n"
            "/start — Botni boshlash\n"
            "/menu — Asosiy menyu\n"
            "/status — Mening arizalarim\n"
            "/licenses — Mening litsenziyalarim\n"
            "/profile — Mening profilim\n"
            "/notify — Bildirishnoma sozlamalari\n"
            "/help — Yordam\n"
            "/logout — Tizimdan chiqish\n\n"
            "📞 *Aloqa:* {support}\n"
            "🌐 *Veb sayt:* {web}"
        ),
        'apply_btn': "🌐 Ariza berish (Veb sayt)",
        'view_more': "🌐 Batafsil ko'rish",
        'reapply_btn': "🔄 Qayta ariza berish",
        'pdf_btn': "📥 PDF yuklab olish",
        'qr_btn': "🔲 QR kod",
        'view_web': "🌐 Veb saytda",
        'back': "🔙 Orqaga",
        'qr_caption': (
            "🔲 *Litsenziya QR kodi*\n\n"
            "Litsenziyani tekshirish uchun QR kodni skaner qiling.\n\n"
            "🔗 {url}"
        ),
        'unknown': "🤖 Tushunmadim. /menu bosib menyuga qayting yoki /help orqali yordam oling.",
        'error': "❌ Xatolik yuz berdi. Qayta urinib ko'ring.",
        # Notification messages
        'notif_app_received': (
            "✅ *Arizangiz qabul qilindi!*\n\n"
            "🆔 `{app_id}`\n"
            "📄 *{license_type}*\n"
            "📅 {date}\n\n"
            "Admin ko'rib chiqadi. Natijasi haqida xabar beramiz."
        ),
        'notif_app_approved': (
            "🎉 *Tabriklaymiz! Arizangiz tasdiqlandi!*\n\n"
            "📄 *{license_type}*\n"
            "🆔 Raqam: `{license_number}`\n"
            "📅 Berilgan: {issued}\n"
            "⏳ Amal qiladi: {expires}"
        ),
        'notif_app_rejected': (
            "❌ *Arizangiz rad etildi*\n\n"
            "📄 *{license_type}*\n"
            "📝 Sabab: _{reason}_\n\n"
            "Hujjatlarni to'g'rilab qayta ariza bering."
        ),
        'notif_docs_required': (
            "📎 *Qo'shimcha hujjat talab qilinmoqda*\n\n"
            "📝 _{note}_\n\n"
            "Hujjatlarni yuborish uchun veb saytga o'ting."
        ),
        'notif_expiry': (
            "{emoji} *{urgency}*\n\n"
            "📄 *{license_type}*\n"
            "🆔 `{number}`\n"
            "⏳ Qolgan: *{days} kun*\n\n"
            "Yangilash uchun ariza bering."
        ),
        'expiry_30': "Diqqat! Muddati tugayapti",
        'expiry_14': "Muddati tugayapti!",
        'expiry_7': "SHOSHILINCH! Muddati tez tugaydi!",
    },
    'ru': {
        'welcome_new': (
            "⚽️ *Федерация футбола Узбекистана*\n"
            "_Добро пожаловать в систему лицензий тренеров!_\n\n"
            "Выберите язык:"
        ),
        'welcome_back': "⚽️ С возвращением, *{name}*!\n\nВыберите раздел:",
        'lang_set': "✅ Язык установлен: *Русский*",
        'send_phone': (
            "📱 *Поделитесь номером телефона*\n\n"
            "Нажмите кнопку ниже или введите вручную.\n"
            "Формат: `+998 XX XXX XX XX`"
        ),
        'phone_btn': "📱 Поделиться номером",
        'phone_invalid': "❌ Неверный формат. Пример: `+998 90 123 45 67`",
        'otp_sent': (
            "📨 *SMS-код отправлен!*\n\n"
            "📱 Номер: `{phone}`\n"
            "⏱ Срок: 5 минут\n\n"
            "Введите 6-значный код:"
        ),
        'otp_demo': "\n\n🔧 _Демо-код:_ `{code}`",
        'otp_format': "❌ Введите 6 цифр.",
        'otp_wrong': "❌ Неверный или просроченный код.\n\nНажмите /start чтобы повторить.",
        'login_ok': "✅ *Вход выполнен!*\n\nДобро пожаловать, *{name}*! 🎉",
        'not_logged_in': "🔐 Войдите в систему.\n\nНажмите /start и поделитесь номером.",
        'logged_out': "👋 Вы вышли. /start — войти снова.",
        'main_menu': "📋 *Главное меню*\n\nВыберите раздел:",
        'menu_apps': "📋 Мои заявки",
        'menu_licenses': "🏆 Мои лицензии",
        'menu_apply': "➕ Новая заявка",
        'menu_profile': "👤 Мой профиль",
        'menu_notify': "🔔 Уведомления",
        'menu_help': "❓ Помощь",
        'menu_logout': "🚪 Выйти",
        'apps_title': "📋 *Мои заявки*\nВсего: *{total}*",
        'no_apps': "📋 У вас пока нет заявок.\n\nПодайте заявку на сайте:",
        'app_detail': (
            "📋 *Детали заявки*\n\n"
            "🆔 ID: `{app_id}`\n"
            "📄 Лицензия: *{license_type}*\n"
            "📊 Статус: {status_emoji} *{status}*\n"
            "📅 Подано: {submitted}{extra}"
        ),
        'apps_more': "\n📋 Ещё {n} заявок. Все — на сайте.",
        'lic_title': "🏆 *Мои лицензии*\nАктивных: *{count}*",
        'no_lic': "🏆 У вас пока нет лицензий.\n\nПодайте заявку на сайте:",
        'lic_detail': (
            "🏆 *Лицензия*\n\n"
            "📄 Номер: `{number}`\n"
            "🎯 Тип: *{type}*\n"
            "📅 Выдана: {issued}\n"
            "⏳ Действует до: {expires}\n"
            "📊 Статус: {status_emoji} *{status}*{warning}"
        ),
        'lic_expiring': "\n\n⚠️ *Внимание!* Истекает через *{days} дней*.",
        'lic_expired': "\n\n❌ *Срок истёк!*",
        'profile': (
            "👤 *Мой профиль*\n\n"
            "👤 Имя: *{name}*\n"
            "📱 Телефон: `{phone}`\n"
            "📧 Email: {email}\n"
            "🗺 Регион: {region}\n"
            "🏢 Место работы: {workplace}\n"
            "💼 Должность: {job}\n"
            "📅 Дата регистрации: {joined}"
        ),
        'notify_settings': (
            "🔔 *Настройки уведомлений*\n\n"
            "Статус: {status}\n\n"
            "Уведомления приходят в случаях:\n"
            "• ✅ Одобрение заявки\n"
            "• ❌ Отклонение заявки\n"
            "• 📎 Запрос дополнительных документов\n"
            "• ⚠️ Истечение лицензии (30/14/7 дней)"
        ),
        'notify_on': "✅ Включены",
        'notify_off': "❌ Выключены",
        'notify_toggle_on': "🔔 Включить",
        'notify_toggle_off': "🔕 Выключить",
        'notify_updated': "🔔 Уведомления: *{status}*",
        'help': (
            "❓ *Помощь*\n\n"
            "*Команды:*\n"
            "/start — Запуск бота\n"
            "/menu — Главное меню\n"
            "/status — Мои заявки\n"
            "/licenses — Мои лицензии\n"
            "/profile — Мой профиль\n"
            "/notify — Настройки уведомлений\n"
            "/help — Помощь\n"
            "/logout — Выйти\n\n"
            "📞 *Контакт:* {support}\n"
            "🌐 *Сайт:* {web}"
        ),
        'apply_btn': "🌐 Подать заявку (Сайт)",
        'view_more': "🌐 Подробнее",
        'reapply_btn': "🔄 Подать повторно",
        'pdf_btn': "📥 Скачать PDF",
        'qr_btn': "🔲 QR код",
        'view_web': "🌐 На сайте",
        'back': "🔙 Назад",
        'qr_caption': (
            "🔲 *QR код лицензии*\n\n"
            "Отсканируйте для проверки лицензии.\n\n"
            "🔗 {url}"
        ),
        'unknown': "🤖 Не понял. /menu — главное меню или /help — помощь.",
        'error': "❌ Произошла ошибка. Попробуйте снова.",
        'notif_app_received': (
            "✅ *Заявка принята!*\n\n"
            "🆔 `{app_id}`\n"
            "📄 *{license_type}*\n"
            "📅 {date}\n\n"
            "Администратор рассматривает. Сообщим о результате."
        ),
        'notif_app_approved': (
            "🎉 *Поздравляем! Заявка одобрена!*\n\n"
            "📄 *{license_type}*\n"
            "🆔 Номер: `{license_number}`\n"
            "📅 Выдана: {issued}\n"
            "⏳ До: {expires}"
        ),
        'notif_app_rejected': (
            "❌ *Заявка отклонена*\n\n"
            "📄 *{license_type}*\n"
            "📝 Причина: _{reason}_\n\n"
            "Исправьте документы и подайте повторно."
        ),
        'notif_docs_required': (
            "📎 *Требуются дополнительные документы*\n\n"
            "📝 _{note}_\n\n"
            "Загрузите документы на сайте."
        ),
        'notif_expiry': (
            "{emoji} *{urgency}*\n\n"
            "📄 *{license_type}*\n"
            "🆔 `{number}`\n"
            "⏳ Осталось: *{days} дней*\n\n"
            "Подайте заявку на продление."
        ),
        'expiry_30': "Внимание! Срок истекает",
        'expiry_14': "Срок истекает скоро!",
        'expiry_7': "СРОЧНО! Срок истекает совсем скоро!",
    },
}

STATUS_EMOJI = {
    'pending': '🟡', 'under_review': '🔵', 'additional_docs': '🟠',
    'approved': '🟢', 'rejected': '🔴', 'cancelled': '⚫', 'license_issued': '🏆',
}
LIC_STATUS_EMOJI = {
    'active': '✅', 'expired': '❌', 'suspended': '⚠️', 'revoked': '🚫',
}
APP_STATUS_DISPLAY = {
    'uz': {
        'pending': "Kutilmoqda", 'under_review': "Ko'rib chiqilmoqda",
        'additional_docs': "Hujjat kerak", 'approved': "Tasdiqlangan",
        'rejected': "Rad etilgan", 'cancelled': "Bekor qilingan",
        'license_issued': "Litsenziya berilgan",
    },
    'ru': {
        'pending': "Ожидает", 'under_review': "На рассмотрении",
        'additional_docs': "Требуются документы", 'approved': "Одобрено",
        'rejected': "Отклонено", 'cancelled': "Отменено",
        'license_issued': "Лицензия выдана",
    },
}
LIC_STATUS_DISPLAY = {
    'uz': {'active': "Faol", 'expired': "Muddati o'tgan",
           'suspended': "To'xtatilgan", 'revoked': "Bekor qilingan"},
    'ru': {'active': "Активна", 'expired': "Просрочена",
           'suspended': "Приостановлена", 'revoked': "Отозвана"},
}


def tr(lang: str, key: str, **kwargs) -> str:
    """Tarjima olish."""
    s = T.get(lang, T['uz']).get(key) or T['uz'].get(key, key)
    if kwargs:
        try:
            return s.format(**kwargs)
        except (KeyError, IndexError):
            return s
    return s


# ════════════════════════════════════════════════════════════════════
# DB ASYNC HELPERS
# ════════════════════════════════════════════════════════════════════
@sync_to_async
def db_get_or_create_telegram_user(telegram_id, username, first_name, last_name):
    from .models import TelegramUser
    tu, created = TelegramUser.objects.select_related('user', 'user__region').get_or_create(
        telegram_id=telegram_id,
        defaults={'username': username, 'first_name': first_name, 'last_name': last_name},
    )
    # Update username/name if changed
    changed = False
    if username and tu.username != username:
        tu.username = username; changed = True
    if first_name and tu.first_name != first_name:
        tu.first_name = first_name; changed = True
    if last_name and tu.last_name != last_name:
        tu.last_name = last_name; changed = True
    if changed:
        tu.save(update_fields=['username', 'first_name', 'last_name'])
    return tu, created


@sync_to_async
def db_save_telegram_user(tu, fields):
    tu.save(update_fields=fields)


@sync_to_async
def db_create_otp_for_phone(phone: str):
    """Yangi OTP yaratadi va kodni qaytaradi."""
    import random
    from apps.users.models import OTPCode
    # Rate-limit: max 5 per day per phone
    today = timezone.now().date()
    count = OTPCode.objects.filter(
        phone=phone, created_at__date=today, is_used=False
    ).count()
    if count >= 5:
        return None
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    OTPCode.objects.create(
        phone=phone,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=5),
    )
    return code


@sync_to_async
def db_verify_otp_and_link(phone: str, code: str, tu_pk):
    """OTP tekshirish + telegram_user'ni User'ga bog'lash."""
    from apps.users.models import OTPCode, User
    from .models import TelegramUser
    try:
        otp = OTPCode.objects.filter(
            phone=phone, code=code, is_used=False,
            expires_at__gt=timezone.now(),
        ).latest('created_at')
    except OTPCode.DoesNotExist:
        return None
    otp.is_used = True
    otp.save(update_fields=['is_used'])
    user, _ = User.objects.get_or_create(
        phone=phone,
        defaults={'is_active': True, 'role': 'coach', 'is_onboarded': False},
    )
    tu = TelegramUser.objects.get(pk=tu_pk)
    tu.user = user
    tu.auth_state = 'idle'
    tu.auth_phone = None
    tu.save(update_fields=['user', 'auth_state', 'auth_phone'])
    return user


@sync_to_async
def db_get_user_applications(user, limit=5):
    from apps.applications.models import Application
    qs = Application.objects.filter(user=user).select_related(
        'license_type'
    ).order_by('-submitted_at')
    total = qs.count()
    items = list(qs[:limit])
    return items, total


@sync_to_async
def db_get_user_licenses(user):
    from apps.licenses.models import License
    qs = License.objects.filter(user=user).select_related('license_type').order_by('-issued_at')
    items = []
    active_count = 0
    for lic in qs:
        cs = lic.computed_status
        if cs == 'active':
            active_count += 1
        items.append({
            'id': str(lic.id),
            'number': lic.license_number,
            'type': lic.license_type.name_uz,
            'issued': lic.issued_at.strftime('%d.%m.%Y') if lic.issued_at else '—',
            'expires': lic.expires_at.strftime('%d.%m.%Y') if lic.expires_at else '—',
            'status': cs,
            'days_left': lic.days_until_expiry,
            'pdf_url': lic.pdf_url or '',
        })
    return items, active_count


@sync_to_async
def db_get_user_profile_data(user):
    return {
        'name': user.full_name or '—',
        'phone': user.phone,
        'email': user.email or '—',
        'region': (user.region.name_uz if user.region else '—'),
        'workplace': user.workplace or '—',
        'job': user.job_title or '—',
        'joined': user.created_at.strftime('%d.%m.%Y') if hasattr(user, 'created_at') and user.created_at else '—',
    }


@sync_to_async
def db_logout_telegram_user(tu_pk):
    from .models import TelegramUser
    TelegramUser.objects.filter(pk=tu_pk).update(
        user=None, auth_state='idle', auth_phone=None
    )


# ════════════════════════════════════════════════════════════════════
# KEYBOARDS
# ════════════════════════════════════════════════════════════════════
def kb_lang():
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("🇺🇿 O'zbek", callback_data='lang_uz'),
        InlineKeyboardButton("🇷🇺 Русский", callback_data='lang_ru'),
    ]])


def kb_phone(lang):
    return ReplyKeyboardMarkup(
        [[KeyboardButton(tr(lang, 'phone_btn'), request_contact=True)]],
        resize_keyboard=True, one_time_keyboard=True,
    )


def kb_main_menu(lang):
    return ReplyKeyboardMarkup([
        [KeyboardButton(tr(lang, 'menu_apps')), KeyboardButton(tr(lang, 'menu_licenses'))],
        [KeyboardButton(tr(lang, 'menu_apply')), KeyboardButton(tr(lang, 'menu_profile'))],
        [KeyboardButton(tr(lang, 'menu_notify')), KeyboardButton(tr(lang, 'menu_help'))],
        [KeyboardButton(tr(lang, 'menu_logout'))],
    ], resize_keyboard=True)


def kb_apply(lang):
    web = settings.WEB_APP_URL.rstrip('/')
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(tr(lang, 'apply_btn'), url=f"{web}/apply")],
    ])


def kb_app(app_id, status, lang):
    web = settings.WEB_APP_URL.rstrip('/')
    rows = [[InlineKeyboardButton(tr(lang, 'view_more'), url=f"{web}/applications")]]
    if status == 'rejected':
        rows.append([InlineKeyboardButton(tr(lang, 'reapply_btn'), url=f"{web}/apply")])
    return InlineKeyboardMarkup(rows)


def kb_license(lic_id, pdf_url, lang):
    web = settings.WEB_APP_URL.rstrip('/')
    rows = []
    if pdf_url:
        rows.append([InlineKeyboardButton(tr(lang, 'pdf_btn'), url=pdf_url)])
    if QRCODE_AVAILABLE:
        rows.append([InlineKeyboardButton(tr(lang, 'qr_btn'), callback_data=f'qr_{lic_id}')])
    rows.append([InlineKeyboardButton(tr(lang, 'view_web'), url=f"{web}/licenses")])
    return InlineKeyboardMarkup(rows)


def kb_notify(enabled, lang):
    label = tr(lang, 'notify_toggle_off' if enabled else 'notify_toggle_on')
    return InlineKeyboardMarkup([[
        InlineKeyboardButton(label, callback_data=f"notify_{'off' if enabled else 'on'}"),
    ]])


# ════════════════════════════════════════════════════════════════════
# HANDLERS
# ════════════════════════════════════════════════════════════════════
async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    u = update.effective_user
    tu, created = await db_get_or_create_telegram_user(
        u.id, u.username, u.first_name, u.last_name
    )
    if tu.user_id:
        # Avval kirgan
        lang = tu.language
        name = tu.user.full_name or tu.user.phone if tu.user else (u.first_name or 'Foydalanuvchi')
        await update.message.reply_text(
            tr(lang, 'welcome_back', name=name),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=kb_main_menu(lang),
        )
    else:
        # Til tanlash
        tu.auth_state = 'awaiting_lang'
        await db_save_telegram_user(tu, ['auth_state'])
        await update.message.reply_text(
            tr('uz', 'welcome_new'),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=kb_lang(),
        )


async def handle_lang_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    lang = 'uz' if q.data == 'lang_uz' else 'ru'
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    tu.language = lang
    tu.auth_state = 'awaiting_phone'
    await db_save_telegram_user(tu, ['language', 'auth_state'])
    await q.edit_message_text(tr(lang, 'lang_set'), parse_mode=ParseMode.MARKDOWN)
    await q.message.reply_text(
        tr(lang, 'send_phone'),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=kb_phone(lang),
    )


async def handle_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Phone via contact share or text input."""
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    lang = tu.language
    # Extract phone
    if update.message.contact and update.message.contact.phone_number:
        phone = update.message.contact.phone_number
        if not phone.startswith('+'):
            phone = '+' + phone
    else:
        raw = (update.message.text or '').strip()
        digits = re.sub(r'[^\d+]', '', raw)
        if digits.startswith('00'):
            digits = '+' + digits[2:]
        if not digits.startswith('+'):
            digits = '+998' + digits.lstrip('0')
        phone = digits
    if not re.match(r'^\+998\d{9}$', phone):
        await update.message.reply_text(
            tr(lang, 'phone_invalid'),
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    # Generate OTP
    code = await db_create_otp_for_phone(phone)
    if not code:
        await update.message.reply_text(tr(lang, 'error'))
        return
    tu.auth_phone = phone
    tu.auth_state = 'awaiting_otp'
    await db_save_telegram_user(tu, ['auth_phone', 'auth_state'])
    msg = tr(lang, 'otp_sent', phone=phone)
    # In dev mode (mock SMS) — show the code
    sms_service = getattr(settings, 'SMS_SERVICE', 'mock')
    if sms_service == 'mock' or settings.DEBUG:
        msg += tr(lang, 'otp_demo', code=code)
    await update.message.reply_text(
        msg,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=ReplyKeyboardRemove(),
    )


async def handle_otp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    lang = tu.language
    code = re.sub(r'[^\d]', '', update.message.text or '')
    if not re.match(r'^\d{6}$', code):
        await update.message.reply_text(tr(lang, 'otp_format'), parse_mode=ParseMode.MARKDOWN)
        return
    user = await db_verify_otp_and_link(tu.auth_phone or '', code, tu.pk)
    if not user:
        await update.message.reply_text(tr(lang, 'otp_wrong'), parse_mode=ParseMode.MARKDOWN)
        return
    name = user.full_name or user.phone
    await update.message.reply_text(
        tr(lang, 'login_ok', name=name),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=kb_main_menu(lang),
    )


async def _ensure_logged_in(update: Update):
    """Returns (TelegramUser, lang) if logged in, else None and replies prompt."""
    u = update.effective_user
    tu, _ = await db_get_or_create_telegram_user(
        u.id, u.username, u.first_name, u.last_name
    )
    if not tu.user_id:
        await update.message.reply_text(
            tr(tu.language, 'not_logged_in'),
            parse_mode=ParseMode.MARKDOWN,
        )
        return None
    return tu


async def handle_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu = await _ensure_logged_in(update)
    if not tu:
        return
    await update.message.reply_text(
        tr(tu.language, 'main_menu'),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=kb_main_menu(tu.language),
    )


async def handle_applications(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu = await _ensure_logged_in(update)
    if not tu:
        return
    lang = tu.language
    apps, total = await db_get_user_applications(tu.user, limit=5)
    if total == 0:
        await update.message.reply_text(
            tr(lang, 'no_apps'),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=kb_apply(lang),
        )
        return
    await update.message.reply_text(
        tr(lang, 'apps_title', total=total),
        parse_mode=ParseMode.MARKDOWN,
    )
    for app in apps:
        emoji = STATUS_EMOJI.get(app.status, '⚪')
        status_label = APP_STATUS_DISPLAY[lang].get(app.status, app.status)
        extra = ''
        if app.status == 'rejected' and app.rejection_reason:
            extra = f"\n📝 _{app.rejection_reason}_"
        elif app.status == 'additional_docs' and getattr(app, 'admin_note', None):
            extra = f"\n📎 _{app.admin_note}_"
        text = tr(lang, 'app_detail',
                  app_id=str(app.id)[:8].upper(),
                  license_type=app.license_type.name_uz if app.license_type else '—',
                  status_emoji=emoji,
                  status=status_label,
                  submitted=app.submitted_at.strftime('%d.%m.%Y %H:%M') if app.submitted_at else '—',
                  extra=extra)
        await update.message.reply_text(
            text, parse_mode=ParseMode.MARKDOWN,
            reply_markup=kb_app(str(app.id), app.status, lang),
        )
    if total > 5:
        await update.message.reply_text(
            tr(lang, 'apps_more', n=total - 5),
            parse_mode=ParseMode.MARKDOWN,
        )


async def handle_licenses(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu = await _ensure_logged_in(update)
    if not tu:
        return
    lang = tu.language
    licenses, active = await db_get_user_licenses(tu.user)
    if not licenses:
        await update.message.reply_text(
            tr(lang, 'no_lic'),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=kb_apply(lang),
        )
        return
    await update.message.reply_text(
        tr(lang, 'lic_title', count=active),
        parse_mode=ParseMode.MARKDOWN,
    )
    for lic in licenses:
        emoji = LIC_STATUS_EMOJI.get(lic['status'], '⚪')
        status_label = LIC_STATUS_DISPLAY[lang].get(lic['status'], lic['status'])
        warning = ''
        if lic['status'] == 'active' and 0 < lic['days_left'] <= 30:
            warning = tr(lang, 'lic_expiring', days=lic['days_left'])
        elif lic['status'] == 'expired':
            warning = tr(lang, 'lic_expired')
        text = tr(lang, 'lic_detail',
                  number=lic['number'],
                  type=lic['type'],
                  issued=lic['issued'],
                  expires=lic['expires'],
                  status_emoji=emoji,
                  status=status_label,
                  warning=warning)
        await update.message.reply_text(
            text, parse_mode=ParseMode.MARKDOWN,
            reply_markup=kb_license(lic['id'], lic['pdf_url'], lang),
        )


async def handle_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu = await _ensure_logged_in(update)
    if not tu:
        return
    lang = tu.language
    data = await db_get_user_profile_data(tu.user)
    await update.message.reply_text(
        tr(lang, 'profile', **data),
        parse_mode=ParseMode.MARKDOWN,
    )


async def handle_apply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu = await _ensure_logged_in(update)
    if not tu:
        return
    lang = tu.language
    await update.message.reply_text(
        tr(lang, 'menu_apply'),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=kb_apply(lang),
    )


async def handle_notify(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu = await _ensure_logged_in(update)
    if not tu:
        return
    lang = tu.language
    enabled = tu.notifications_enabled
    status = tr(lang, 'notify_on') if enabled else tr(lang, 'notify_off')
    await update.message.reply_text(
        tr(lang, 'notify_settings', status=status),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=kb_notify(enabled, lang),
    )


async def handle_notify_toggle(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    lang = tu.language
    enable = q.data == 'notify_on'
    tu.notifications_enabled = enable
    await db_save_telegram_user(tu, ['notifications_enabled'])
    status = tr(lang, 'notify_on') if enable else tr(lang, 'notify_off')
    await q.edit_message_text(
        tr(lang, 'notify_updated', status=status),
        parse_mode=ParseMode.MARKDOWN,
    )


async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    lang = tu.language
    await update.message.reply_text(
        tr(lang, 'help',
           support=getattr(settings, 'SUPPORT_USERNAME', '@UFFSupport'),
           web=settings.WEB_APP_URL),
        parse_mode=ParseMode.MARKDOWN,
        disable_web_page_preview=True,
    )


async def handle_logout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    lang = tu.language
    await db_logout_telegram_user(tu.pk)
    await update.message.reply_text(
        tr(lang, 'logged_out'),
        reply_markup=ReplyKeyboardRemove(),
    )


async def handle_qr(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    if not QRCODE_AVAILABLE:
        return
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    lang = tu.language
    lic_id = q.data.replace('qr_', '')
    web = settings.WEB_APP_URL.rstrip('/')
    verify_url = f"{web}/verify/{lic_id}"
    qr = qrcode.QRCode(
        version=1, error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10, border=4,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0D3B6E", back_color="white")
    buf = BytesIO()
    img.save(buf, 'PNG')
    buf.seek(0)
    await q.message.reply_photo(
        photo=InputFile(buf, filename='license_qr.png'),
        caption=tr(lang, 'qr_caption', url=verify_url),
        parse_mode=ParseMode.MARKDOWN,
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Asosiy menyu tugmalari + state-based routing."""
    text = update.message.text or ''
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    lang = tu.language

    # Auth state routing
    if tu.auth_state == 'awaiting_phone':
        await handle_phone(update, context)
        return
    if tu.auth_state == 'awaiting_otp':
        await handle_otp(update, context)
        return

    # Menu button routing
    norm = text.strip()
    btn_map = {
        tr('uz', 'menu_apps'): handle_applications,
        tr('ru', 'menu_apps'): handle_applications,
        tr('uz', 'menu_licenses'): handle_licenses,
        tr('ru', 'menu_licenses'): handle_licenses,
        tr('uz', 'menu_apply'): handle_apply,
        tr('ru', 'menu_apply'): handle_apply,
        tr('uz', 'menu_profile'): handle_profile,
        tr('ru', 'menu_profile'): handle_profile,
        tr('uz', 'menu_notify'): handle_notify,
        tr('ru', 'menu_notify'): handle_notify,
        tr('uz', 'menu_help'): handle_help,
        tr('ru', 'menu_help'): handle_help,
        tr('uz', 'menu_logout'): handle_logout,
        tr('ru', 'menu_logout'): handle_logout,
    }
    handler = btn_map.get(norm)
    if handler:
        await handler(update, context)
        return

    # Unknown
    await update.message.reply_text(tr(lang, 'unknown'))


async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tu, _ = await db_get_or_create_telegram_user(
        update.effective_user.id, update.effective_user.username,
        update.effective_user.first_name, update.effective_user.last_name,
    )
    if tu.auth_state == 'awaiting_phone':
        await handle_phone(update, context)
    else:
        await update.message.reply_text(tr(tu.language, 'unknown'))


# ════════════════════════════════════════════════════════════════════
# BOT INSTANCE (lazy)
# ════════════════════════════════════════════════════════════════════
_app_lock = threading.Lock()
_app_instance: Optional["Application"] = None
_loop: Optional[asyncio.AbstractEventLoop] = None
_loop_thread: Optional[threading.Thread] = None


def _build_application() -> "Application":
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or ''
    if not token or not TELEGRAM_AVAILABLE:
        return None  # type: ignore
    app = Application.builder().token(token).build()
    # Commands
    app.add_handler(CommandHandler('start', handle_start))
    app.add_handler(CommandHandler('menu', handle_menu))
    app.add_handler(CommandHandler('status', handle_applications))
    app.add_handler(CommandHandler('applications', handle_applications))
    app.add_handler(CommandHandler('licenses', handle_licenses))
    app.add_handler(CommandHandler('profile', handle_profile))
    app.add_handler(CommandHandler('apply', handle_apply))
    app.add_handler(CommandHandler('notify', handle_notify))
    app.add_handler(CommandHandler('help', handle_help))
    app.add_handler(CommandHandler('logout', handle_logout))
    # Callback queries
    app.add_handler(CallbackQueryHandler(handle_lang_callback, pattern='^lang_'))
    app.add_handler(CallbackQueryHandler(handle_qr, pattern='^qr_'))
    app.add_handler(CallbackQueryHandler(handle_notify_toggle, pattern='^notify_'))
    # Messages
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    return app


def _ensure_event_loop():
    """Background thread bilan persistent event loop."""
    global _loop, _loop_thread
    if _loop and _loop.is_running():
        return _loop
    _loop = asyncio.new_event_loop()

    def runner():
        asyncio.set_event_loop(_loop)
        _loop.run_forever()

    _loop_thread = threading.Thread(target=runner, daemon=True, name='UFFBot')
    _loop_thread.start()
    return _loop


def get_application():
    """Lazy-init bot Application + persistent event loop."""
    global _app_instance
    if _app_instance is not None:
        return _app_instance
    with _app_lock:
        if _app_instance is not None:
            return _app_instance
        app = _build_application()
        if app is None:
            return None
        loop = _ensure_event_loop()
        # Initialize the application on the loop
        fut = asyncio.run_coroutine_threadsafe(app.initialize(), loop)
        try:
            fut.result(timeout=15)
        except Exception as e:
            logger.error(f"Bot init failed: {e}")
            return None
        _app_instance = app
        logger.info("UFF Telegram Bot initialized")
        return _app_instance


def process_webhook_update(update_data: dict) -> bool:
    """Webhook view'dan chaqiriladi."""
    if not TELEGRAM_AVAILABLE:
        return False
    app = get_application()
    if app is None:
        logger.warning("Bot not configured (no TELEGRAM_BOT_TOKEN)")
        return False
    try:
        update = Update.de_json(update_data, app.bot)
        loop = _ensure_event_loop()
        asyncio.run_coroutine_threadsafe(app.process_update(update), loop)
        return True
    except Exception as e:
        logger.exception(f"Webhook processing failed: {e}")
        return False


# ════════════════════════════════════════════════════════════════════
# OUTBOUND NOTIFICATIONS (Django -> Telegram)
# Sync API for backend signal/view code to send messages.
# ════════════════════════════════════════════════════════════════════
def _send_message_sync(chat_id: int, text: str, reply_markup: Optional[dict] = None,
                       parse_mode: str = 'Markdown') -> bool:
    """Bot Telegram API orqali xabar yuborish (sync)."""
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or ''
    if not token or requests is None:
        return False
    try:
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': parse_mode,
            'disable_web_page_preview': True,
        }
        if reply_markup:
            import json as _json
            payload['reply_markup'] = _json.dumps(reply_markup)
        r = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json=payload, timeout=10,
        )
        return r.status_code == 200
    except Exception as e:
        logger.warning(f"Telegram send failed: {e}")
        return False


def _get_telegram_for_user(user) -> Optional["TelegramUser"]:
    from .models import TelegramUser
    try:
        return TelegramUser.objects.get(user=user, is_active=True, notifications_enabled=True)
    except TelegramUser.DoesNotExist:
        return None


def notify_application_received(user, application):
    """Ariza qabul qilindi → Telegram."""
    tu = _get_telegram_for_user(user)
    if not tu:
        return False
    lang = tu.language
    web = settings.WEB_APP_URL.rstrip('/')
    text = tr(lang, 'notif_app_received',
              app_id=str(application.id)[:8].upper(),
              license_type=application.license_type.name_uz if application.license_type else '—',
              date=application.submitted_at.strftime('%d.%m.%Y %H:%M') if application.submitted_at else '—')
    kb = {'inline_keyboard': [[{'text': tr(lang, 'view_more'), 'url': f"{web}/applications"}]]}
    return _send_message_sync(tu.telegram_id, text, kb)


def notify_application_approved(user, application, license_obj=None):
    tu = _get_telegram_for_user(user)
    if not tu:
        return False
    lang = tu.language
    web = settings.WEB_APP_URL.rstrip('/')
    text = tr(lang, 'notif_app_approved',
              license_type=application.license_type.name_uz if application.license_type else '—',
              license_number=license_obj.license_number if license_obj else '—',
              issued=license_obj.issued_at.strftime('%d.%m.%Y') if license_obj and license_obj.issued_at else '—',
              expires=license_obj.expires_at.strftime('%d.%m.%Y') if license_obj and license_obj.expires_at else '—')
    rows = []
    if license_obj and license_obj.pdf_url:
        rows.append([{'text': tr(lang, 'pdf_btn'), 'url': license_obj.pdf_url}])
    rows.append([{'text': tr(lang, 'menu_licenses'), 'url': f"{web}/licenses"}])
    return _send_message_sync(tu.telegram_id, text, {'inline_keyboard': rows})


def notify_application_rejected(user, application):
    tu = _get_telegram_for_user(user)
    if not tu:
        return False
    lang = tu.language
    web = settings.WEB_APP_URL.rstrip('/')
    text = tr(lang, 'notif_app_rejected',
              license_type=application.license_type.name_uz if application.license_type else '—',
              reason=application.rejection_reason or '—')
    kb = {'inline_keyboard': [[{'text': tr(lang, 'reapply_btn'), 'url': f"{web}/apply"}]]}
    return _send_message_sync(tu.telegram_id, text, kb)


def notify_additional_docs(user, application):
    tu = _get_telegram_for_user(user)
    if not tu:
        return False
    lang = tu.language
    web = settings.WEB_APP_URL.rstrip('/')
    text = tr(lang, 'notif_docs_required',
              note=getattr(application, 'admin_note', None) or '—')
    kb = {'inline_keyboard': [[{'text': tr(lang, 'view_more'), 'url': f"{web}/applications"}]]}
    return _send_message_sync(tu.telegram_id, text, kb)


def notify_license_expiring(user, license_obj, days: int):
    tu = _get_telegram_for_user(user)
    if not tu:
        return False
    lang = tu.language
    web = settings.WEB_APP_URL.rstrip('/')
    if days >= 30:
        emoji, urgency_key = '⚠️', 'expiry_30'
    elif days >= 14:
        emoji, urgency_key = '🔴', 'expiry_14'
    else:
        emoji, urgency_key = '🚨', 'expiry_7'
    text = tr(lang, 'notif_expiry',
              emoji=emoji,
              urgency=tr(lang, urgency_key),
              license_type=license_obj.license_type.name_uz if license_obj.license_type else '—',
              number=license_obj.license_number,
              days=days)
    kb = {'inline_keyboard': [[{'text': tr(lang, 'apply_btn'), 'url': f"{web}/apply"}]]}
    return _send_message_sync(tu.telegram_id, text, kb)


# Public API ─────────────────────────────────────────────────────────
__all__ = [
    'process_webhook_update', 'get_application',
    'notify_application_received', 'notify_application_approved',
    'notify_application_rejected', 'notify_additional_docs',
    'notify_license_expiring',
]
