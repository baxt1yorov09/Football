"""
SystemSettings signal'lari — sozlama o'zgartirilganda cache'larni tozalash.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import SystemSettings


@receiver(post_save, sender=SystemSettings)
def invalidate_maintenance_cache_on_save(sender, instance, **kwargs):
    """SystemSettings saqlanganda maintenance_mode cache'ni tozalash."""
    try:
        from .middleware import invalidate_maintenance_cache
        invalidate_maintenance_cache()
    except Exception:
        pass
