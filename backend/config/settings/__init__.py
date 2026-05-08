import os

if os.getenv('DJANGO_ENV') == 'development':
    from .development import *
else:
    from .production import *
