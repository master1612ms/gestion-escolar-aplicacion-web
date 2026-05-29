import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','gestion_escolar_api.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
User=get_user_model()
user=User.objects.filter(username='ui_test@example.com').first()
if not user:
    print('NO_USER')
else:
    print('USER', user.username, 'is_active', user.is_active)
    print('check_password secret123 ->', user.check_password('secret123'))
    print('check_password wrong ->', user.check_password('x'))
