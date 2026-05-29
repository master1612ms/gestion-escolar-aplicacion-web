from django.db.models import *
from django.db import transaction
from django.db import IntegrityError
from gestion_escolar_api.models import Administradores, Maestros
from gestion_escolar_api.serializers import UserSerializer
from gestion_escolar_api.serializers import *
from gestion_escolar_api.models import *
from rest_framework import permissions
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404
import json
from datetime import datetime, date
from gestion_escolar_api.utils import Utils


def _phone_digits(value):
    return ''.join(ch for ch in str(value or '') if ch.isdigit())


def _validate_required_fields(request_data, required_fields):
    missing = Utils.missingRequiredFields(request_data, required_fields)
    if missing:
        return Response(
            {"message": "Faltan campos requeridos", "campos_faltantes": missing},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


def _validate_code_field(value, label):
    if not Utils.isAlphanumericNoSpaces(value):
        return Response(
            {"message": f"El campo {label} solo puede contener letras y números, sin espacios"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


def _validate_digits_field(value, label):
    if not Utils.isDigitsNoSpaces(value):
        return Response(
            {"message": f"El campo {label} solo puede contener números, sin espacios"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


def _validate_letters_field(value, label):
    if not Utils.isLettersOnly(value):
        return Response(
            {"message": f"El campo {label} solo puede contener letras, sin espacios"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None

class AlumnosAll(generics.CreateAPIView):
    def get(self, request, *args, **kwargs):
        alumnos = Alumnos.objects.filter(user__is_active=1).order_by("id")
        lista = AlumnoSerializer(alumnos, many=True).data
        # Normalizar materias_array si viene como JSON string
        for alumno in lista:
            if isinstance(alumno, dict) and "materias_array" in alumno:
                try:
                    alumno["materias_array"] = json.loads(alumno["materias_array"]) if alumno["materias_array"] else []
                except Exception:
                    alumno["materias_array"] = []
        return Response(lista, 200)

    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [permissions.IsAuthenticated()]

class AlumnosView(generics.CreateAPIView):
    # Permisos por método (sobrescribe el comportamiento default)
    # Verifica que el usuario esté autenticado para las peticiones GET, PUT y DELETE
    def get_permissions(self):
        if self.request.method in ['GET', 'PUT', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return []  # POST no requiere autenticación

    def get(self, request, *args, **kwargs):
        alumno_id = request.GET.get("id")
        if alumno_id:
            alumno = Alumnos.objects.filter(id=alumno_id, user__is_active=1).first()
            if not alumno:
                return Response({"message": "Alumno no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            data = AlumnoSerializer(alumno).data
            try:
                if 'materias_array' in data and isinstance(data['materias_array'], str):
                    data['materias_array'] = json.loads(data['materias_array'] or '[]')
            except Exception:
                data['materias_array'] = []
            return Response(data, status=status.HTTP_200_OK)

        alumnos = Alumnos.objects.filter(user__is_active=1).order_by("id")
        lista = AlumnoSerializer(alumnos, many=True).data
        return Response(lista, 200)
    
    #Registrar nuevo usuario
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        try:
            required_fields = [
                'rol', 'first_name', 'last_name', 'email', 'password',
                'matricula', 'carrera', 'semestre', 'promedio', 'curp',
                'fecha_nacimiento', 'edad', 'telefono', 'materias_array',
                'direccion', 'genero',
            ]
            validation_error = _validate_required_fields(request.data, required_fields)
            if validation_error:
                return validation_error

            # Role por defecto si no viene
            role = request.data['rol'].strip().lower()
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            email = request.data.get('email')
            password = request.data.get('password')
            telefono = request.data.get('telefono')

            if len(_phone_digits(telefono)) != 10:
                return Response({"message": "El teléfono debe tener exactamente 10 números"}, status=status.HTTP_400_BAD_REQUEST)

            first_name_error = _validate_letters_field(first_name, "nombre")
            if first_name_error:
                return first_name_error
            last_name_error = _validate_letters_field(last_name, "apellidos")
            if last_name_error:
                return last_name_error

            matricula_error = _validate_digits_field(request.data.get('matricula'), "matricula")
            if matricula_error:
                return matricula_error

            # Valida si existe el usuario
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                return Response({"message": f"Username {email}, is already taken"}, status=status.HTTP_400_BAD_REQUEST)

            curp_error = _validate_code_field(request.data.get('curp'), "CURP")
            if curp_error:
                return curp_error

            # Parsear fecha_nacimiento y calcular edad esperada
            raw_fecha = request.data.get('fecha_nacimiento')
            parsed_fecha = None
            computed_age = None
            if raw_fecha:
                try:
                    if isinstance(raw_fecha, (datetime, date)):
                        parsed_fecha = raw_fecha
                    else:
                        # Try ISO first, then common formats
                        try:
                            parsed_fecha = datetime.fromisoformat(raw_fecha)
                        except Exception:
                            try:
                                parsed_fecha = datetime.strptime(raw_fecha, '%Y-%m-%d')
                            except Exception:
                                try:
                                    parsed_fecha = datetime.strptime(raw_fecha, '%d/%m/%Y')
                                except Exception:
                                    parsed_fecha = None
                    if parsed_fecha:
                        bd = parsed_fecha.date() if isinstance(parsed_fecha, datetime) else parsed_fecha
                        today = date.today()
                        computed_age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
                except Exception:
                    parsed_fecha = None

            # Edad: si existe fecha_nacimiento, la tomamos como fuente de verdad
            # para evitar rechazos por desajustes manuales en el formulario.
            provided_age = request.data.get('edad')
            if provided_age is not None and provided_age != '':
                try:
                    provided_age = int(provided_age)
                except Exception:
                    return Response({"message": "Edad inválida"}, status=status.HTTP_400_BAD_REQUEST)

            age_to_store = computed_age if computed_age is not None else provided_age
            if age_to_store is not None:
                if age_to_store < 3 or age_to_store > 120:
                    return Response({"message": "Edad fuera de rango razonable"}, status=status.HTTP_400_BAD_REQUEST)

            # Crear usuario
            user = User.objects.create(username=email, email=email, first_name=first_name, last_name=last_name, is_active=1)
            user.set_password(password)
            user.save()

            group, created = Group.objects.get_or_create(name=role)
            group.user_set.add(user)
            user.save()

            # Normalizar materias_array
            materias_input = request.data.get('materias_array', [])
            if isinstance(materias_input, str):
                try:
                    materias_input = json.loads(materias_input)
                except Exception:
                    materias_input = []

            # Crear perfil alumno
            alumno = Alumnos.objects.create(user=user,
                                            matricula=request.data.get('matricula'),
                                            carrera=request.data.get('carrera'),
                                            semestre=request.data.get('semestre'),
                                            promedio=request.data.get('promedio'),
                                            curp=(request.data.get('curp') or '').upper(),
                                            fecha_nacimiento=(parsed_fecha if parsed_fecha is not None else None),
                                            edad=(age_to_store if age_to_store is not None else None),
                                            telefono=_phone_digits(request.data.get('telefono')),
                                            direccion=request.data.get('direccion'),
                                            genero=request.data.get('genero'),
                                            materias_array=json.dumps(materias_input))
            alumno.save()

            return Response({"Alumno creado con ID= ": alumno.id}, status=status.HTTP_201_CREATED)
        except ValidationError as exc:
            return Response({"message": "Error de validación al registrar alumno", "detalles": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as exc:
            return Response({"message": "Error de integridad al registrar alumno", "detalles": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({"message": "Error de formato al registrar alumno", "detalles": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"message": "Error al registrar alumno", "detalles": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        required_fields = ['id']
        validation_error = _validate_required_fields(request.data, required_fields)
        if validation_error:
            return validation_error

        alumno_id = request.data.get("id") or kwargs.get("id")
        alumno = Alumnos.objects.filter(id=alumno_id, user__is_active=1).first()
        if not alumno:
            return Response({"message": "Alumno no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if request.data.get("curp") is not None:
            curp_error = _validate_code_field(request.data.get("curp"), "CURP")
            if curp_error:
                return curp_error

        user = alumno.user
        if request.data.get("first_name") is not None:
            first_name_error = _validate_letters_field(request.data["first_name"], "nombre")
            if first_name_error:
                return first_name_error
            user.first_name = request.data["first_name"]
        if request.data.get("last_name") is not None:
            last_name_error = _validate_letters_field(request.data["last_name"], "apellidos")
            if last_name_error:
                return last_name_error
            user.last_name = request.data["last_name"]
        if request.data.get("email") is not None:
            user.email = request.data["email"]
            user.username = request.data["email"]
        user.save()

        if request.data.get("matricula") is not None:
            matricula_error = _validate_digits_field(request.data.get("matricula"), "matricula")
            if matricula_error:
                return matricula_error
            alumno.matricula = request.data["matricula"]
        if request.data.get("carrera") is not None:
            alumno.carrera = request.data["carrera"]
        if request.data.get("semestre") is not None:
            alumno.semestre = request.data["semestre"]
        if request.data.get("promedio") is not None:
            alumno.promedio = request.data["promedio"]
        if request.data.get("curp") is not None:
            alumno.curp = request.data["curp"].upper()
        # RFC removed for alumnos; ignore if provided
        if request.data.get("fecha_nacimiento") is not None:
            raw_fecha = request.data.get("fecha_nacimiento")
            parsed_fecha = None
            try:
                if isinstance(raw_fecha, (datetime, date)):
                    parsed_fecha = raw_fecha
                else:
                    try:
                        parsed_fecha = datetime.fromisoformat(raw_fecha)
                    except Exception:
                        try:
                            parsed_fecha = datetime.strptime(raw_fecha, '%Y-%m-%d')
                        except Exception:
                            try:
                                parsed_fecha = datetime.strptime(raw_fecha, '%d/%m/%Y')
                            except Exception:
                                parsed_fecha = None
            except Exception:
                parsed_fecha = None
            if parsed_fecha:
                alumno.fecha_nacimiento = parsed_fecha
                # fecha_nacimiento manda sobre la edad para mantener consistencia
                bd = parsed_fecha.date() if isinstance(parsed_fecha, datetime) else parsed_fecha
                today = date.today()
                computed_age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
                if computed_age < 3 or computed_age > 120:
                    return Response({"message": "Edad fuera de rango razonable"}, status=status.HTTP_400_BAD_REQUEST)
                alumno.edad = computed_age
            else:
                # invalid date format
                return Response({"message": "Formato de fecha de nacimiento inválido"}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get("edad") is not None:
            # edad may have been validated above when fecha_nacimiento provided; otherwise validate range
            try:
                edad_val = int(request.data.get("edad"))
            except Exception:
                return Response({"message": "Edad inválida"}, status=status.HTTP_400_BAD_REQUEST)
            if edad_val < 3 or edad_val > 120:
                return Response({"message": "Edad fuera de rango razonable"}, status=status.HTTP_400_BAD_REQUEST)
            if request.data.get("fecha_nacimiento") is None:
                alumno.edad = edad_val
        if request.data.get("telefono") is not None:
            telefono = _phone_digits(request.data.get("telefono"))
            if len(telefono) != 10:
                return Response({"message": "El teléfono debe tener exactamente 10 números"}, status=status.HTTP_400_BAD_REQUEST)
            alumno.telefono = telefono
        if request.data.get("direccion") is not None:
            alumno.direccion = request.data["direccion"]
        if request.data.get("genero") is not None:
            alumno.genero = request.data["genero"]
        if request.data.get("materias_array") is not None:
            try:
                materias_input = request.data.get("materias_array", [])
                if isinstance(materias_input, str):
                    materias_input = json.loads(materias_input)
                alumno.materias_array = json.dumps(materias_input)
            except Exception:
                alumno.materias_array = json.dumps([])
        alumno.save()

        return Response({"message": "Alumno actualizado correctamente"}, status=status.HTTP_200_OK)

    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        alumno = Alumnos.objects.filter(id=request.GET.get("id")).first()
        if not alumno:
            return Response({"message": "Alumno no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        try:
            user = alumno.user
            alumno.delete()
            if user:
                user.delete()
            return Response({"details": "Alumno eliminado"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"details": "Error al eliminar alumno"}, status=status.HTTP_400_BAD_REQUEST)


