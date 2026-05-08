from django.core.management.base import BaseCommand
from django.conf import settings
import asyncio


class Command(BaseCommand):
    help = 'Run UFF Telegram Bot'

    def handle(self, *args, **options):
        from ..bot import bot_instance
        
        self.stdout.write(self.style.SUCCESS('Starting UFF Telegram Bot...'))
        
        try:
            bot_instance.run()
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Bot stopped by user'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Bot error: {e}'))
