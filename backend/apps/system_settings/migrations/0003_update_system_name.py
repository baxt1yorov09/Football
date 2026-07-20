from django.db import migrations


def update_system_name(apps, schema_editor):
    """Mavjud singleton yozuvida tizim nomini UFA va tavsifini yangilash."""
    SystemSettings = apps.get_model('system_settings', 'SystemSettings')
    obj = SystemSettings.objects.filter(pk=1).first()
    if obj is None:
        return
    obj.system_name = 'UFA'
    obj.description = "O'zbekiston Futbol Assotsiatsiyasi"
    obj.save()


def reverse_migrate(apps, schema_editor):
    SystemSettings = apps.get_model('system_settings', 'SystemSettings')
    obj = SystemSettings.objects.filter(pk=1).first()
    if obj is None:
        return
    obj.system_name = 'UFF Football System'
    obj.description = "O'zbekiston Futbol Federatsiyasi - Murabbiylar litsenziyalash tizimi"
    obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ('system_settings', '0002_alter_systemsettings_description_and_more'),
    ]

    operations = [
        migrations.RunPython(update_system_name, reverse_migrate),
    ]
