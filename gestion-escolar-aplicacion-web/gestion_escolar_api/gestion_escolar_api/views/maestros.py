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
import json
from django.shortcuts import get_object_or_404
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

class MaestrosAll(generics.CreateAPIView):
    def get(self, request, *args, **kwargs):
        maestros = Maestros.objects.filter(user__is_active=1).order_by("id")
        lista = MaestrosSerializer(maestros, many=True).data
        for maestro in lista:
            if isinstance(maestro, dict) and "materias_array" in maestro:
                try:
                    maestro["materias_array"] = json.loads(maestro["materias_array"])
                except Exception:
                    maestro["materias_array"] = []
        return Response(lista, 200)

    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [permissions.IsAuthenticated()]

class MaestrosView(generics.CreateAPIView):
    # Permisos por método (sobrescribe el comportamiento default)
    # Verifica que el usuario esté autenticado para las peticiones GET, PUT y DELETE
    def get_permissions(self):
        if self.request.method in ['GET', 'PUT', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return []  # POST no requiere autenticación
    
    #Función para obtener un maestro específico por su ID
    #TODO: Agregar validación para verificar que el maestro exista y obtenerlo
    def get(self, request, *args, **kwargs):
        maestro = Maestros.objects.filter(id=request.GET.get("id"), user__is_active=1).first()
        if not maestro:
            return Response({"message": "Maestro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        data = MaestrosSerializer(maestro).data
        # Asegurar que materias_array siempre sea un array (normalizar si viene como JSON string)
        try:
            if 'materias_array' in data and isinstance(data['materias_array'], str):
                data['materias_array'] = json.loads(data['materias_array'] or '[]')
        except Exception:
            data['materias_array'] = []
        return Response(data, status=status.HTTP_200_OK)
    
    #Registrar nuevo usuario maestro
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        try:
            required_fields = [
                'rol', 'first_name', 'last_name', 'email', 'password',
                'id_trabajador', 'fecha_nacimiento', 'telefono', 'rfc',
                'cubiculo', 'area_investigacion', 'materias_array',
                'sueldo_estimado', 'centro_universitario',
            ]
            validation_error = _validate_required_fields(request.data, required_fields)
            if validation_error:
                return validation_error

            user = UserSerializer(data=request.data)
            if not user.is_valid():
                return Response(
                    {"message": "Error de validación al registrar maestro", "detalles": user.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            role = request.data['rol'].strip().lower()
            first_name = request.data['first_name']
            last_name = request.data['last_name']
            email = request.data['email']
            password = request.data['password']
            telefono = request.data.get('telefono')

            if len(_phone_digits(telefono)) != 10:
                return Response({"message": "El teléfono debe tener exactamente 10 números"}, status=status.HTTP_400_BAD_REQUEST)

            first_name_error = _validate_letters_field(first_name, "nombre")
            if first_name_error:
                return first_name_error
            last_name_error = _validate_letters_field(last_name, "apellidos")
            if last_name_error:
                return last_name_error
            id_trabajador_error = _validate_digits_field(request.data.get("id_trabajador"), "id_trabajador")
            if id_trabajador_error:
                return id_trabajador_error
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                return Response({"message": "Username " + email + ", is already taken"}, status=status.HTTP_400_BAD_REQUEST)

            rfc_error = _validate_code_field(request.data.get("rfc"), "RFC")
            if rfc_error:
                return rfc_error

            user = User.objects.create(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=1,
            )
            user.save()
            user.set_password(password)
            user.save()

            group, created = Group.objects.get_or_create(name=role)
            group.user_set.add(user)
            user.save()
            #Create a profile for the user
            maestro = Maestros.objects.create(
                user=user,
                id_trabajador=request.data["id_trabajador"],
                fecha_nacimiento=request.data["fecha_nacimiento"],
                telefono=_phone_digits(request.data["telefono"]),
                rfc=request.data["rfc"].upper(),
                cubiculo=request.data["cubiculo"],
                area_investigacion=request.data["area_investigacion"],
                materias_array=json.dumps(request.data.get("materias_array", [])),
                sueldo_estimado=request.data.get("sueldo_estimado"),
                centro_universitario=request.data.get("centro_universitario"),
            )
            maestro.save()
            return Response({"Maestro creado con ID= ": maestro.id}, status=status.HTTP_201_CREATED)
        except ValidationError as exc:
            return Response({"message": "Error de validación al registrar maestro", "detalles": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as exc:
            return Response({"message": "Error de integridad al registrar maestro", "detalles": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({"message": "Error de formato al registrar maestro", "detalles": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"message": "Error al registrar maestro", "detalles": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        required_fields = [
            'id', 'first_name', 'last_name', 'id_trabajador',
            'fecha_nacimiento', 'telefono', 'rfc', 'cubiculo',
            'area_investigacion', 'materias_array', 'sueldo_estimado',
            'centro_universitario',
        ]
        validation_error = _validate_required_fields(request.data, required_fields)
        if validation_error:
            return validation_error

        maestro = Maestros.objects.filter(id=request.data["id"], user__is_active=1).first()
        if not maestro:
            return Response({"message": "Maestro no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if request.data.get("rfc") is not None:
            rfc_error = _validate_code_field(request.data.get("rfc"), "RFC")
            if rfc_error:
                return rfc_error

        user = maestro.user
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

        if request.data.get("id_trabajador") is not None:
            id_trabajador_error = _validate_digits_field(request.data.get("id_trabajador"), "id_trabajador")
            if id_trabajador_error:
                return id_trabajador_error
            maestro.id_trabajador = request.data["id_trabajador"]
        if request.data.get("fecha_nacimiento") is not None:
            maestro.fecha_nacimiento = request.data["fecha_nacimiento"]
        if request.data.get("telefono") is not None:
            telefono = _phone_digits(request.data.get("telefono"))
            if len(telefono) != 10:
                return Response({"message": "El teléfono debe tener exactamente 10 números"}, status=status.HTTP_400_BAD_REQUEST)
            maestro.telefono = telefono
        if request.data.get("rfc") is not None:
            maestro.rfc = request.data["rfc"].upper()
        if request.data.get("cubiculo") is not None:
            maestro.cubiculo = request.data["cubiculo"]
        if request.data.get("area_investigacion") is not None:
            maestro.area_investigacion = request.data["area_investigacion"]
        if request.data.get("materias_array") is not None:
            maestro.materias_array = json.dumps(request.data["materias_array"])
        if request.data.get("sueldo_estimado") is not None:
            maestro.sueldo_estimado = request.data["sueldo_estimado"]
        if request.data.get("centro_universitario") is not None:
            maestro.centro_universitario = request.data["centro_universitario"]
        maestro.save()

        return Response({"message": "Maestro actualizado correctamente"}, status=status.HTTP_200_OK)
    
    #Función para eliminar un maestro específico por su ID
    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        maestro = Maestros.objects.filter(id=request.GET.get("id")).first()
        if not maestro:
            return Response({"message": "Maestro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        try:
            user = maestro.user
            # delete maestro first, then user to avoid FK issues
            maestro.delete()
            if user:
                user.delete()
            return Response({"details": "Maestro eliminado"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"details": "Error al eliminar maestro"}, status=status.HTTP_400_BAD_REQUEST)