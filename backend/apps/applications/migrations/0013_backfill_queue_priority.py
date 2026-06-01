from django.db import migrations
from django.db.models import F


def backfill_queue_priority(apps, schema_editor):
    """Mavjud arizalar uchun queue_priority = submitted_at qilib to'ldiramiz."""
    Application = apps.get_model('applications', 'Application')
    Application.objects.filter(queue_priority__isnull=True).update(
        queue_priority=F('submitted_at')
    )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0012_application_is_offline_application_queue_priority'),
    ]

    operations = [
        migrations.RunPython(backfill_queue_priority, noop),
    ]
