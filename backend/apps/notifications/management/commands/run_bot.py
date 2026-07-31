from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Run UFA Telegram Bot in polling mode (local dev)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--drop-pending', action='store_true',
            help='Drop pending updates on start'
        )

    def handle(self, *args, **options):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not token:
            self.stderr.write(self.style.ERROR(
                'TELEGRAM_BOT_TOKEN is not set. Add it to your .env file.'
            ))
            return

        try:
            from apps.notifications.bot import TELEGRAM_AVAILABLE, _build_application
        except ImportError as e:
            self.stderr.write(self.style.ERROR(f'Import error: {e}'))
            return

        if not TELEGRAM_AVAILABLE:
            self.stderr.write(self.style.ERROR(
                'python-telegram-bot is not installed. Run: pip install python-telegram-bot'
            ))
            return

        app = _build_application()
        if app is None:
            self.stderr.write(self.style.ERROR('Failed to build bot application.'))
            return

        drop = options.get('drop_pending', False)
        self.stdout.write(self.style.SUCCESS('🤖 UFA Telegram Bot starting (polling mode)...'))
        self.stdout.write(f'   Token: {token[:10]}...')
        self.stdout.write(self.style.SUCCESS('✅ Bot is running. Press Ctrl+C to stop.'))

        app.run_polling(drop_pending_updates=drop)
