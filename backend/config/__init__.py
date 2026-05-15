"""
Celery app loaded lazily — faqat Celery o'rnatilgan bo'lsa.
Bu Django'ni Redis/Celery'siz ham ishga tushira olish imkonini beradi.
"""
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except Exception:  # celery o'rnatilmagan bo'lsa indamasdan o'tib ketadi
    __all__ = ()
