import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_escolar_api.settings')
django.setup()

from django.contrib.auth.models import User, Group
from gestion_escolar_api.models import Administradores, Maestros, Alumnos

# Helper to create user and group
def create_user_with_group(email, password, first_name, last_name, group_name):
    user, created = User.objects.get_or_create(username=email, defaults={'email': email, 'first_name': first_name, 'last_name': last_name, 'is_active': True})
    if created:
        user.set_password(password)
        user.save()
    group, _ = Group.objects.get_or_create(name=group_name)
    group.user_set.add(user)
    return user

# Admin
admin_email = 'emiliocast611@gmail.com'
admin_password = '1234'
admin_user = create_user_with_group(admin_email, admin_password, 'Emilio', 'Castillo', 'administrador')
admin_profile, _ = Administradores.objects.get_or_create(user=admin_user, defaults={'clave_admin':'ADM001','telefono':'222-111-0000','rfc':'RFCADM000','edad':40,'ocupacion':'Admin'})
print('Admin created:', admin_profile.id)

# Maestro
maestro_email = 'maestro_test@example.com'
maestro_password = '1234'
maestro_user = create_user_with_group(maestro_email, maestro_password, 'Maestro', 'Prueba', 'maestro')
maestro_profile, _ = Maestros.objects.get_or_create(user=maestro_user, defaults={'id_trabajador':'100','telefono':'222-222-0000','rfc':'RFCMAE000','cubiculo':'C-1','area_investigacion':'AI','materias_array':'[]','sueldo_estimado':10000.00,'centro_universitario':'CU San Manuel'})
print('Maestro created:', maestro_profile.id)

# Alumno
alumno_email = 'alumno_test@example.com'
alumno_password = '1234'
alumno_user = create_user_with_group(alumno_email, alumno_password, 'Alumno', 'Prueba', 'alumno')
alumno_profile, _ = Alumnos.objects.get_or_create(user=alumno_user, defaults={'matricula':'100','carrera':'TIC','semestre':'3','promedio':8.5,'curp':'CURPTEST0000000000','fecha_nacimiento':None,'edad':20,'telefono':'222-333-0000','materias_array':'[]','direccion':'Calle Test','genero':'masculino'})
print('Alumno created:', alumno_profile.id)

print('Done creating test users')
