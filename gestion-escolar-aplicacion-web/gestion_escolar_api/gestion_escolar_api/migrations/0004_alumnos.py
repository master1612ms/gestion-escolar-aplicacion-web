import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_escolar_api', '0003_maestros'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Alumnos',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('matricula', models.CharField(blank=True, max_length=255, null=True)),
                ('carrera', models.CharField(blank=True, max_length=255, null=True)),
                ('semestre', models.CharField(blank=True, max_length=255, null=True)),
                ('promedio', models.FloatField(blank=True, null=True)),
                ('curp', models.CharField(blank=True, max_length=255, null=True)),
                ('fecha_nacimiento', models.DateTimeField(blank=True, null=True)),
                ('edad', models.IntegerField(blank=True, null=True)),
                ('telefono', models.CharField(blank=True, max_length=255, null=True)),
                ('materias_array', models.TextField(blank=True, null=True)),
                ('direccion', models.CharField(blank=True, max_length=255, null=True)),
                ('genero', models.CharField(blank=True, max_length=50, null=True)),
                ('creation', models.DateTimeField(auto_now_add=True, null=True)),
                ('update', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]