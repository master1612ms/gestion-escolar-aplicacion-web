from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from gestion_escolar_api.models import Administradores

class Command(BaseCommand):
    help = 'Create a test admin user ui_test@example.com / secret123'

    def handle(self, *args, **options):
        User = get_user_model()
        username = 'ui_test@example.com'
        password = 'secret123'
        user = User.objects.filter(username=username).first()
        if user:
            self.stdout.write(self.style.WARNING('User already exists: %s' % username))
            return
        user = User.objects.create(username=username, email=username, first_name='UI', last_name='Test', is_active=True)
        user.set_password(password)
        user.save()
        admin = Administradores.objects.create(user=user, clave_admin='ADM001', telefono='000', rfc='XAXX010101000', edad=30, ocupacion='testing')
        admin.save()
        self.stdout.write(self.style.SUCCESS('Created test user %s' % username))
