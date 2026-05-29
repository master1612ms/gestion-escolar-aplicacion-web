import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_escolar_api', '0002_administradores'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Maestros',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('id_trabajador', models.CharField(blank=True, max_length=255, null=True)),
                ('fecha_nacimiento', models.DateTimeField(blank=True, null=True)),
                ('telefono', models.CharField(blank=True, max_length=255, null=True)),
                ('rfc', models.CharField(blank=True, max_length=255, null=True)),
                ('cubiculo', models.CharField(blank=True, max_length=255, null=True)),
                ('edad', models.IntegerField(blank=True, null=True)),
                ('area_investigacion', models.CharField(blank=True, max_length=255, null=True)),
                ('materias_array', models.TextField(blank=True, null=True)),
                ('sueldo_estimado', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('centro_universitario', models.CharField(blank=True, max_length=255, null=True)),
                ('creation', models.DateTimeField(auto_now_add=True, null=True)),
                ('update', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]