import os

# Default to development to avoid SSL redirect issues
if os.getenv('DJANGO_ENV') == 'production':
    from .production import *
else:
    from .development import *
