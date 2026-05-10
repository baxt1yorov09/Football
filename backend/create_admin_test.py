import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

# Create admin user
u = User(
    phone='900000000',
    email='admin@uff.uz',
    full_name='Super Admin',
    role='super_admin',
    is_active=True
)
u.set_password('Admin1234!')
u.save()
print('Yaratildi:', u.email, u.role)
