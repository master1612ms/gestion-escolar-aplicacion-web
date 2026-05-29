from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth.models import AbstractUser, User
from django.conf import settings
from django.core.validators import RegexValidator

from django.db import models
from django.contrib.auth.models import User

from rest_framework.authentication import TokenAuthentication

class BearerTokenAuthentication(TokenAuthentication):
    keyword = "Bearer"


class Administradores(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False, default=None)
    clave_admin = models.CharField(max_length=255,null=True, blank=True)
    telefono = models.CharField(max_length=255, null=True, blank=True)
    rfc = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[A-Za-z0-9]+$', 'El RFC solo puede contener letras y números, sin espacios')],
    )
    edad = models.IntegerField(null=True, blank=True)
    ocupacion = models.CharField(max_length=255,null=True, blank=True)
    grado_academico = models.CharField(max_length=255, null=True, blank=True)
    jornada = models.CharField(max_length=255, null=True, blank=True)
    creation = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    update = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return "Perfil del admin "+self.user.first_name+" "+self.user.last_name

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

class Maestros(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False, default=None)
    id_trabajador = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[0-9]+$', 'El id del trabajador solo puede contener números, sin espacios')],
    )
    fecha_nacimiento = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    telefono = models.CharField(max_length=255, null=True, blank=True)
    rfc = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[A-Za-z0-9]+$', 'El RFC solo puede contener letras y números, sin espacios')],
    )
    cubiculo = models.CharField(max_length=255,null=True, blank=True)
    edad = models.IntegerField(null=True, blank=True)
    area_investigacion = models.CharField(max_length=255,null=True, blank=True)
    materias_array = models.TextField(null=True, blank=True)
    sueldo_estimado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    centro_universitario = models.CharField(max_length=255, null=True, blank=True)
    creation = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    update = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return "Perfil del maestro "+self.user.first_name+" "+self.user.last_name

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

class Alumnos(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False, default=None)
    matricula = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[0-9]+$', 'La matrícula solo puede contener números, sin espacios')],
    )
    carrera = models.CharField(max_length=255,null=True, blank=True)
    semestre = models.CharField(max_length=255,null=True, blank=True)
    promedio = models.FloatField(null=True, blank=True)
    curp = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[A-Za-z0-9]+$', 'La CURP solo puede contener letras y números, sin espacios')],
    )
    fecha_nacimiento = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    edad = models.IntegerField(null=True, blank=True)
    telefono = models.CharField(max_length=255, null=True, blank=True)
    # reemplazamos 'ocupacion' por un arreglo de materias almacenado como JSON string
    materias_array = models.TextField(null=True, blank=True)
    direccion = models.CharField(max_length=255, null=True, blank=True)
    genero = models.CharField(max_length=50, null=True, blank=True)
    creation = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    update = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)