import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
from django.conf import settings
from django.utils import timezone

from .models import Notification, NotificationType
from applications.models import Application
from licenses.models import License
from users.models import User


logger = logging.getLogger(__name__)


class UFFTelegramBot:
    """Uzbekistan Football Federation Telegram Bot"""
    
    def __init__(self):
        self.bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        self.app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
        
        # Register handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register all command and message handlers"""
        
        # Command handlers
        self.app.add_handler(CommandHandler("start", self._handle_start))
        self.app.add_handler(CommandHandler("help", self._handle_help))
        self.app.add_handler(CommandHandler("status", self._handle_status))
        self.app.add_handler(CommandHandler("licenses", self._handle_licenses))
        self.app.add_handler(CommandHandler("applications", self._handle_applications))
        self.app.add_handler(CommandHandler("verify", self._handle_verify))
        
        # Callback handlers for inline keyboards
        self.app.add_handler(CallbackQueryHandler(self._handle_callback))
        
        # Message handler for non-commands
        self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self._handle_message))
    
    async def _handle_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        
        # Create or get user record
        telegram_user, created = await self._get_or_create_telegram_user(user)
        
        welcome_message = f"""
🏆 *O'zbekiston Futbol Federatsiyasi Boti*

Assalomu, {user.first_name}!

Ushbu bot orqali sizning:
📋 Arizalaringiz holati
📜 Litsenziyalaringiz ma'lumotlari
🔔 Yangiliklar va bildirishnomalar

Quyidagi buyruqlardan foydalaning:

/help - Yordam
/status - Arizalar holati
/licenses - Litsenziyalar
/verify - Litsenziyani tekshirish
        """.strip()
        
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("📋 Arizalarim", callback_data="applications"),
                InlineKeyboardButton("📜 Litsenziyalarim", callback_data="licenses")
            ],
            [
                InlineKeyboardButton("🔔 Bildirishnomalar", callback_data="notifications"),
                InlineKeyboardButton("ℹ️ Yordam", callback_data="help")
            ]
        ])
        
        await update.message.reply_text(
            welcome_message,
            parse_mode='Markdown',
            reply_markup=keyboard
        )
    
    async def _handle_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = """
🏆 *O'zbekiston Futbol Federatsiyasi Boti*

*Buyruqlar:*
/start - Botni ishga tushirish
/help - Yordam ko'rsatish
/status - Arizalaringiz holati
/licenses - Litsenziyalaringiz ro'yxati
/applications - Arizalaringiz ro'yxati
/verify <kod> - Litsenziyani tekshirish

*Qo'shimcha imkoniyatlar:*
📋 Ariza holatini kuzatish
📜 Litsenziya ma'lumotlarini ko'rish
🔔 Bildirishnomalarni olish
🔍 Litsenziyani tekshirish

*Qo'llab bo'ling:*
📞 +998 71 236-65-55
🌐 www.uff.uz
📧 info@uff.uz
        """.strip()
        
        await update.message.reply_text(help_text, parse_mode='Markdown')
    
    async def _handle_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command - show application status"""
        telegram_user = await self._get_or_create_telegram_user(update.effective_user)
        
        if not telegram_user.user:
            await update.message.reply_text(
                "❌ Avval veb-saytda ro'yxatdan o'ting: https://uff.uz/auth"
            )
            return
        
        # Get user's applications
        applications = Application.objects.filter(user=telegram_user.user).order_by('-created_at')[:5]
        
        if not applications:
            await update.message.reply_text(
                "📋 Sizda hali arizalar yo'q.\n"
                "Yangi ariza yuborish uchun: https://uff.uz/apply"
            )
            return
        
        status_text = "📋 *So'nggi arizalaringiz:*\n\n"
        
        for app in applications:
            status_emoji = {
                'pending': '⏳',
                'under_review': '👀',
                'additional_docs': '📄',
                'approved': '✅',
                'rejected': '❌',
                'license_issued': '📜'
            }.get(app.status, '❓')
            
            status_text += f"{status_emoji} *{app.get_license_type_display()}*\n"
            status_text += f"📅 {app.created_at.strftime('%d.%m.%Y %H:%M')}\n"
            status_text += f"📊 {self._get_status_display(app.status)}\n\n"
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🌐 Barcha arizalar", callback_data="all_applications")]
        ])
        
        await update.message.reply_text(status_text, parse_mode='Markdown', reply_markup=keyboard)
    
    async def _handle_licenses(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /licenses command - show user licenses"""
        telegram_user = await self._get_or_create_telegram_user(update.effective_user)
        
        if not telegram_user.user:
            await update.message.reply_text(
                "❌ Avval veb-saytda ro'yxatdan o'ting: https://uff.uz/auth"
            )
            return
        
        # Get user's active licenses
        licenses = License.objects.filter(user=telegram_user.user, is_active=True).order_by('-issued_at')
        
        if not licenses:
            await update.message.reply_text(
                "📜 Sizda hali faol litsenziyalar yo'q.\n"
                "Litsenziya olish uchun ariza qoldiring: https://uff.uz/apply"
            )
            return
        
        license_text = "📜 *Faol litsenziyalaringiz:*\n\n"
        
        for license_obj in licenses:
            days_left = (license_obj.expires_at - timezone.now()).days
            expiry_warning = ""
            
            if days_left <= 30:
                expiry_warning = f" ⚠️ *{days_left} kun qoldi!*"
            elif days_left <= 7:
                expiry_warning = f" 🚨 *{days_left} kun qoldi!*"
            
            license_text += f"📜 *{license_obj.license_type.name}*\n"
            license_text += f"🔢 {license_obj.license_number}\n"
            license_text += f"📅 {license_obj.expires_at.strftime('%d.%m.%Y')} gacha{expiry_warning}\n\n"
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🌐 Barcha litsenziyalar", callback_data="all_licenses")],
            [InlineKeyboardButton("📥 PDF yuklab olish", callback_data="download_licenses")]
        ])
        
        await update.message.reply_text(license_text, parse_mode='Markdown', reply_markup=keyboard)
    
    async def _handle_applications(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /applications command"""
        await self._handle_status(update, context)  # Same logic as status
    
    async def _handle_verify(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /verify command"""
        if not context.args:
            await update.message.reply_text(
                "❌ Iltimos, litsenziya raqamini kiriting:\n"
                "/verify UFF-2024-PRO-000123"
            )
            return
        
        license_number = ' '.join(context.args)
        
        try:
            license_obj = License.objects.get(license_number=license_number)
            
            if license_obj.is_active and license_obj.expires_at > timezone.now():
                await update.message.reply_text(
                    f"✅ *Litsenziya haqiqiy!*\n\n"
                    f"📜 *Toifa:* {license_obj.license_type.name}\n"
                    f"👤 *Egasi:* {license_obj.user.get_full_name()}\n"
                    f"📅 *Muddati:* {license_obj.expires_at.strftime('%d.%m.%Y')} gacha\n"
                    f"🔢 *Raqami:* {license_obj.license_number}",
                    parse_mode='Markdown'
                )
            else:
                reason = "muddati tugagan" if license_obj.expires_at <= timezone.now() else "nofaol emas"
                await update.message.reply_text(
                    f"❌ *Litsenziya haqiqiy emas!*\n\n"
                    f"🔢 *Raqami:* {license_obj.license_number}\n"
                    f"📋 *Sababi:* {reason}",
                    parse_mode='Markdown'
                )
                
        except License.DoesNotExist:
            await update.message.reply_text(
                "❌ *Litsenziya topilmadi!*\n\n"
                "Iltimos, litsenziya raqamini tekshiring.",
                parse_mode='Markdown'
            )
    
    async def _handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle inline keyboard callbacks"""
        query = update.callback_query
        await query.answer()
        
        if query.data == "applications":
            await self._handle_status(update, context)
        elif query.data == "licenses":
            await self._handle_licenses(update, context)
        elif query.data == "notifications":
            await self._show_notifications(update, context)
        elif query.data == "help":
            await self._handle_help(update, context)
        elif query.data == "all_applications":
            await self._show_all_applications(update, context)
        elif query.data == "all_licenses":
            await self._show_all_licenses(update, context)
        elif query.data == "download_licenses":
            await self._download_licenses_info(update, context)
    
    async def _handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle non-command messages"""
        message_text = update.message.text.lower()
        
        # Quick responses for common queries
        if any(word in message_text for word in ['ariza', 'application', 'подача']):
            await update.message.reply_text(
                "📋 Ariza yuborish uchun veb-saytga tashrif buyuring:\n"
                "https://uff.uz/apply"
            )
        elif any(word in message_text for word in ['litsenziya', 'license', 'лицензия']):
            await update.message.reply_text(
                "📜 Litsenziyalar ro'yxati uchun /licenses buyrug'ini ishlating.\n"
                "Litsenziyani tekshirish uchun /verify <raqam> buyrug'ini ishlating."
            )
        elif any(word in message_text for word in ['yordam', 'help', 'помощь']):
            await self._handle_help(update, context)
        else:
            await update.message.reply_text(
                "🤖 Kechirasiz, tushunmadim. /help buyrug'i bilan yordam oling."
            )
    
    async def _get_or_create_telegram_user(self, telegram_user):
        """Get or create Telegram user record"""
        from .models import TelegramUser
        
        try:
            return await TelegramUser.objects.aget(telegram_id=telegram_user.id)
        except TelegramUser.DoesNotExist:
            # Try to find user by phone if provided
            django_user = None
            if telegram_user.username:
                try:
                    django_user = User.objects.get(phone__endswith=telegram_user.username)
                except User.DoesNotExist:
                    pass
            
            return await TelegramUser.objects.acreate(
                telegram_id=telegram_user.id,
                username=telegram_user.username,
                first_name=telegram_user.first_name,
                last_name=telegram_user.last_name,
                user=django_user
            )
    
    def _get_status_display(self, status):
        """Get Uzbek status display"""
        status_map = {
            'pending': 'Kutilmoqda',
            'under_review': 'Ko\'rib chiqilmoqda',
            'additional_docs': 'Qo\'shimcha hujjatlar talab qilinmoqda',
            'approved': 'Tasdiqlangan',
            'rejected': 'Rad etilgan',
            'license_issued': 'Litsenziya berilgan'
        }
        return status_map.get(status, status)
    
    async def _show_notifications(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show user notifications"""
        telegram_user = await self._get_or_create_telegram_user(update.effective_user)
        
        if not telegram_user.user:
            await update.message.reply_text("❌ Avval ro'yxatdan o'ting")
            return
        
        notifications = Notification.objects.filter(
            user=telegram_user.user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:10]
        
        if not notifications:
            await update.message.reply_text("🔔 Yangi bildirishnomalar yo'q.")
            return
        
        notification_text = "🔔 *So'nggi bildirishnomalar:*\n\n"
        
        for notif in notifications:
            emoji_map = {
                'application_received': '📋',
                'application_approved': '✅',
                'application_rejected': '❌',
                'license_issued': '📜',
                'license_expiring': '⚠️',
                'system_update': 'ℹ️'
            }
            
            emoji = emoji_map.get(notif.type, '📢')
            notification_text += f"{emoji} {notif.message}\n"
            notification_text += f"📅 {notif.created_at.strftime('%d.%m.%Y %H:%M')}\n\n"
        
        await update.message.reply_text(notification_text, parse_mode='Markdown')
    
    async def _send_notification(self, user: User, message: str, notification_type: str):
        """Send notification to user via Telegram"""
        try:
            telegram_user = TelegramUser.objects.get(user=user)
            
            emoji_map = {
                'application_received': '📋',
                'application_approved': '✅',
                'application_rejected': '❌',
                'license_issued': '📜',
                'license_expiring': '⚠️',
                'system_update': 'ℹ️'
            }
            
            emoji = emoji_map.get(notification_type, '📢')
            formatted_message = f"{emoji} {message}"
            
            await self.bot.send_message(
                chat_id=telegram_user.telegram_id,
                text=formatted_message,
                parse_mode='Markdown'
            )
            
        except TelegramUser.DoesNotExist:
            logger.warning(f"Telegram user not found for user {user.id}")
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")
    
    def run(self):
        """Start the bot"""
        logger.info("Starting UFF Telegram Bot...")
        self.app.run_polling(drop_pending_updates=True)


# Global bot instance
bot_instance = UFFTelegramBot()


def send_notification_to_user(user: User, message: str, notification_type: str):
    """Send notification to user (called from other parts of the system)"""
    asyncio.create_task(bot_instance._send_notification(user, message, notification_type))
