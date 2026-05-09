from .base import *

DEBUG = True

# Database for development - use SQLite for simplicity
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# CORS for development
CORS_ALLOW_ALL_ORIGINS = True

# Disable security headers in development
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = False
SECURE_HSTS_SECONDS = 0
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Allow all hosts for development
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# Disable trailing slash to avoid 301 redirects
APPEND_SLASH = False
