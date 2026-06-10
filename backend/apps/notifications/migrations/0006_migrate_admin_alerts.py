from django.db import migrations
from django.db.models import Q


def migrate_admin_notifications(apps, schema_editor):
    """Eski admin xabarlarini (type='system') yangi 'admin_alert' turiga ko'chirish.

    Admin foydalanuvchilarga yuborilgan va admin sarlavhalari bo'lgan xabarlar:
    - "Yangi ariza keldi"
    - "Litsenziya N kunda tugaydi" (har xil N)
    """
    Notification = apps.get_model('notifications', 'Notification')
    User = apps.get_model('users', 'User')

    admin_user_ids = User.objects.filter(
        role__in=['super_admin', 'region_admin']
    ).values_list('id', flat=True)

    Notification.objects.filter(
        user_id__in=admin_user_ids,
        type='system',
    ).filter(
        Q(title='Yangi ariza keldi') |
        Q(title__startswith='Litsenziya') & Q(title__endswith='kunda tugaydi')
    ).update(type='admin_alert')


def reverse_migrate(apps, schema_editor):
    Notification = apps.get_model('notifications', 'Notification')
    Notification.objects.filter(type='admin_alert').update(type='system')


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0005_alter_notification_type'),
    ]

    operations = [
        migrations.RunPython(migrate_admin_notifications, reverse_migrate),
    ]
