"""
Litsenziya turlarini qayta tuzish:
 * D, C, B, A, PRO uchun prerequisite'larni to'g'rilash.
 * FITNESS/GK/FUTSAL kodlarini _1 variantiga o'tkazish (mavjud FK'lar buzilmasin).
 * FITNESS_2/_3, GK_2/_3, FUTSAL_2/_3 va FUTSAL_GK_1/_2/_3 yozuvlarini yaratish.
 * BEACH nomini "Sohil futboli murabbiyi litsenziyasi" ga o'zgartirish.
 * PSYCH nomini "Sport psixolog litsenziyasi" ga o'zgartirish.
"""
from django.db import migrations


def restructure(apps, schema_editor):
    LicenseType = apps.get_model('licenses', 'LicenseType')

    def upsert(code, defaults):
        prereq_code = defaults.pop('prereq_code', None)
        obj, _ = LicenseType.objects.update_or_create(code=code, defaults=defaults)
        if prereq_code:
            try:
                obj.prerequisite_type = LicenseType.objects.get(code=prereq_code)
            except LicenseType.DoesNotExist:
                obj.prerequisite_type = None
        else:
            obj.prerequisite_type = None
        obj.save()
        return obj

    # --- 1) Rename existing single-level codes to *_1 so FKs remain valid ---
    for old_code, new_code in (('FITNESS', 'FITNESS_1'), ('GK', 'GK_1'), ('FUTSAL', 'FUTSAL_1')):
        try:
            row = LicenseType.objects.get(code=old_code)
            if not LicenseType.objects.filter(code=new_code).exists():
                row.code = new_code
                row.save(update_fields=['code'])
        except LicenseType.DoesNotExist:
            pass

    # --- 2) Fix main track prerequisites & names ---
    upsert('D', dict(
        name_uz="D toifasi murabbiylik litsenziyasi",
        name_ru="Тренерская лицензия категории D",
        category='main', level=4, sort_order=4, is_active=True,
        prereq_code=None,
    ))
    upsert('C', dict(
        name_uz="C toifasi murabbiylik litsenziyasi",
        name_ru="Тренерская лицензия категории C",
        category='main', level=3, sort_order=3, is_active=True,
        prereq_code=None,
    ))
    upsert('B', dict(
        name_uz="B toifasi murabbiylik litsenziyasi",
        name_ru="Тренерская лицензия категории B",
        category='main', level=2, sort_order=2, is_active=True,
        prereq_code='C',
    ))
    upsert('A', dict(
        name_uz="A toifasi murabbiylik litsenziyasi",
        name_ru="Тренерская лицензия категории A",
        category='main', level=1, sort_order=1, is_active=True,
        prereq_code='B',
    ))
    upsert('PRO', dict(
        name_uz="PRO toifasi murabbiylik litsenziyasi",
        name_ru="Тренерская лицензия категории PRO",
        category='main', level=0, sort_order=0, is_active=True,
        tashkent_only=True,
        prereq_code='A',
    ))

    # --- 3) Fitness track (Level 1..3) ---
    upsert('FITNESS_1', dict(
        name_uz="Fitness litsenziyasi (Level 1)",
        name_ru="Лицензия по фитнесу (Уровень 1)",
        category='fitness', level=1, sort_order=10, is_active=True,
        prereq_code='B',
    ))
    upsert('FITNESS_2', dict(
        name_uz="Fitness litsenziyasi (Level 2)",
        name_ru="Лицензия по фитнесу (Уровень 2)",
        category='fitness', level=2, sort_order=11, is_active=True,
        prereq_code='FITNESS_1',
    ))
    upsert('FITNESS_3', dict(
        name_uz="Fitness litsenziyasi (Level 3)",
        name_ru="Лицензия по фитнесу (Уровень 3)",
        category='fitness', level=3, sort_order=12, is_active=True,
        prereq_code='FITNESS_2',
    ))

    # --- 4) Goalkeeper track (Level 1..3) ---
    upsert('GK_1', dict(
        name_uz="Darvozabonlar murabbiylik litsenziyasi (Level 1)",
        name_ru="Тренерская лицензия для вратарей (Уровень 1)",
        category='gk', level=1, sort_order=20, is_active=True,
        prereq_code='C',
    ))
    upsert('GK_2', dict(
        name_uz="Darvozabonlar murabbiylik litsenziyasi (Level 2)",
        name_ru="Тренерская лицензия для вратарей (Уровень 2)",
        category='gk', level=2, sort_order=21, is_active=True,
        prereq_code='B',
    ))
    upsert('GK_3', dict(
        name_uz="Darvozabonlar murabbiylik litsenziyasi (Level 3)",
        name_ru="Тренерская лицензия для вратарей (Уровень 3)",
        category='gk', level=3, sort_order=22, is_active=True,
        prereq_code='GK_2',
    ))

    # --- 5) Futsal track (Level 1..3) ---
    upsert('FUTSAL_1', dict(
        name_uz="Futzal murabbiylik litsenziyasi (Level 1)",
        name_ru="Тренерская лицензия по футзалу (Уровень 1)",
        category='special', level=1, sort_order=30, is_active=True,
        prereq_code=None,
    ))
    upsert('FUTSAL_2', dict(
        name_uz="Futzal murabbiylik litsenziyasi (Level 2)",
        name_ru="Тренерская лицензия по футзалу (Уровень 2)",
        category='special', level=2, sort_order=31, is_active=True,
        prereq_code='FUTSAL_1',
    ))
    upsert('FUTSAL_3', dict(
        name_uz="Futzal murabbiylik litsenziyasi (Level 3)",
        name_ru="Тренерская лицензия по футзалу (Уровень 3)",
        category='special', level=3, sort_order=32, is_active=True,
        prereq_code='FUTSAL_2',
    ))

    # --- 6) Futsal goalkeeper track (Level 1..3) ---
    upsert('FUTSAL_GK_1', dict(
        name_uz="Futzal darvozabon murabbiylik litsenziyasi (Level 1)",
        name_ru="Тренерская лицензия вратаря по футзалу (Уровень 1)",
        category='special', level=1, sort_order=40, is_active=True,
        prereq_code='FUTSAL_1',
    ))
    upsert('FUTSAL_GK_2', dict(
        name_uz="Futzal darvozabon murabbiylik litsenziyasi (Level 2)",
        name_ru="Тренерская лицензия вратаря по футзалу (Уровень 2)",
        category='special', level=2, sort_order=41, is_active=True,
        prereq_code='FUTSAL_GK_1',
    ))
    upsert('FUTSAL_GK_3', dict(
        name_uz="Futzal darvozabon murabbiylik litsenziyasi (Level 3)",
        name_ru="Тренерская лицензия вратаря по футзалу (Уровень 3)",
        category='special', level=3, sort_order=42, is_active=True,
        prereq_code='FUTSAL_GK_2',
    ))

    # --- 7) Rename BEACH & PSYCH ---
    try:
        beach = LicenseType.objects.get(code='BEACH')
        beach.name_uz = "Sohil futboli murabbiylik litsenziyasi"
        beach.name_ru = "Тренерская лицензия по пляжному футболу"
        beach.save(update_fields=['name_uz', 'name_ru'])
    except LicenseType.DoesNotExist:
        pass

    try:
        psych = LicenseType.objects.get(code='PSYCH')
        psych.name_uz = "Sport psixolog litsenziyasi"
        psych.name_ru = "Лицензия спортивного психолога"
        psych.save(update_fields=['name_uz', 'name_ru'])
    except LicenseType.DoesNotExist:
        pass


def noop(apps, schema_editor):
    # Data-only migration; no reverse.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('licenses', '0007_fix_pro_category'),
    ]

    operations = [
        migrations.RunPython(restructure, noop),
    ]
