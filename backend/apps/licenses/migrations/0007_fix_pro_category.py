from django.db import migrations


def fix_pro_category(apps, schema_editor):
    """PRO litsenziyasi asosiy iyerarxiya (D → C → B → A → PRO) qismi bo'lgani uchun
    uni 'specialist' kategoriyadan 'main' kategoriyaga o'tkazamiz va A dan keyin joylaymiz.
    """
    LicenseType = apps.get_model('licenses', 'LicenseType')
    try:
        pro = LicenseType.objects.get(code='PRO')
    except LicenseType.DoesNotExist:
        return
    pro.category = 'main'
    pro.sort_order = 0  # A dan oldin (eng yuqori professional daraja)
    pro.save()


def reverse_fix(apps, schema_editor):
    LicenseType = apps.get_model('licenses', 'LicenseType')
    try:
        pro = LicenseType.objects.get(code='PRO')
    except LicenseType.DoesNotExist:
        return
    pro.category = 'specialist'
    pro.sort_order = 8
    pro.save()


class Migration(migrations.Migration):

    dependencies = [
        ('licenses', '0006_license_image'),
    ]

    operations = [
        migrations.RunPython(fix_pro_category, reverse_fix),
    ]
