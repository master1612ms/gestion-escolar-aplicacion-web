from django.db.models import *
from django.db import transaction
from gestion_escolar_api.models import Administradores, Maestros
from gestion_escolar_api.serializers import UserSerializer
from gestion_escolar_api.serializers import *
from gestion_escolar_api.models import *
from rest_framework import permissions
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.models import Group
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

class AdminAll(generics.CreateAPIView):
    # Permite listar administradores sin bloquear la carga del frontend si el token no llegó.
    # Las operaciones de escritura siguen protegidas en AdminView.
    # Invocamos la petición GET para obtener todos los administradores
    def get(self, request, *args, **kwargs):
        admin = Administradores.objects.all().order_by("id")
        lista = AdminSerializer(admin, many=True).data
        return Response(lista, 200)

    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [permissions.IsAuthenticated()]
    
class AdminView(generics.CreateAPIView):
    # Permisos por método (sobrescribe el comportamiento default)
    # Verifica que el usuario esté autenticado para las peticiones GET, PUT y DELETE
    def get_permissions(self):
        if self.request.method in ['GET', 'PUT', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return []  # POST no requiere autenticación
    
    #Obtener un administrador específico por su ID
    def get(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(id=request.GET.get("id"), user__is_active=1).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminSerializer(admin)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    #Registrar nuevo usuario administrador
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        required_fields = [
            'rol', 'first_name', 'last_name', 'email', 'password',
            'clave_admin', 'telefono', 'rfc', 'edad', 'ocupacion',
            'jornada', 'grado_academico',
        ]
        validation_error = _validate_required_fields(request.data, required_fields)
        if validation_error:
            return validation_error

        # Serializamos los datos del administrador para volverlo de nuevo JSON
        user = UserSerializer(data=request.data)
        
        if user.is_valid():
            #Grab user data
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

            #Valida si existe el usuario o bien el email registrado
            existing_user = User.objects.filter(email=email).first()

            if existing_user:
                return Response({"message":"Nombre de usuario "+email+", ya existe"},400)

            rfc_error = _validate_code_field(request.data.get("rfc"), "RFC")
            if rfc_error:
                return rfc_error

            user = User.objects.create( username = email,
                                        email = email,
                                        first_name = first_name,
                                        last_name = last_name,
                                        is_active = 1)


            user.save()
            #Cifrar la contraseña
            user.set_password(password)
            user.save()

            #Asignar el rol al usuario a la tabla de grupos
            group, created = Group.objects.get_or_create(name=role)
            group.user_set.add(user)
            user.save()

            #Almacenar los datos adicionales del administrador en la tabla de administradores
            admin = Administradores.objects.create(user=user,
                                            clave_admin= request.data["clave_admin"],
                                            telefono= _phone_digits(request.data["telefono"]),
                                            rfc= request.data["rfc"].upper(),
                                            edad= request.data.get("edad"),
                                            ocupacion= request.data.get("ocupacion"),
                                            jornada= request.data.get("jornada"),
                                            grado_academico= request.data.get("grado_academico"))
            admin.save()

            return Response({"Administrador creado ID": admin.id }, 201)

        return Response(user.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Actualizar datos del administrador
    @transaction.atomic
    def put(self, request, *args, **kwargs):
        required_fields = [
            'id', 'first_name', 'last_name',
            'clave_admin', 'telefono', 'rfc', 'edad', 'ocupacion',
            'jornada', 'grado_academico',
        ]
        validation_error = _validate_required_fields(request.data, required_fields)
        if validation_error:
            return validation_error

        admin = Administradores.objects.filter(id=request.data["id"], user__is_active=1).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if request.data.get("rfc") is not None:
            rfc_error = _validate_code_field(request.data.get("rfc"), "RFC")
            if rfc_error:
                return rfc_error

        user = admin.user
        # Actualizar campos del usuario
        user.first_name = request.data["first_name"]
        user.last_name = request.data["last_name"]
        first_name_error = _validate_letters_field(user.first_name, "nombre")
        if first_name_error:
            return first_name_error
        last_name_error = _validate_letters_field(user.last_name, "apellidos")
        if last_name_error:
            return last_name_error
        #Guardamos los cambios del usuario no es necesario actualizar la contraseña
        user.save()

        # Actualizar campos del administrador
        admin.clave_admin = request.data.get("clave_admin")
        if request.data.get("telefono") is not None:
            telefono = _phone_digits(request.data.get("telefono"))
            if len(telefono) != 10:
                return Response({"message": "El teléfono debe tener exactamente 10 números"}, status=status.HTTP_400_BAD_REQUEST)
            admin.telefono = telefono
        if request.data.get("rfc") is not None:
            admin.rfc = request.data["rfc"].upper()
        admin.edad = request.data.get("edad")
        admin.ocupacion = request.data.get("ocupacion")
        admin.jornada = request.data.get("jornada")
        admin.grado_academico = request.data.get("grado_academico")
        admin.save()

        return Response({"message": "Administrador actualizado correctamente"}, status=status.HTTP_200_OK)
    
    #Función para eliminar un administrador específico por su ID
    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(id=request.GET.get("id"), user__is_active=1).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        try:
            admin.user.is_active = False
            admin.user.save()
            return Response({"details":"Administrador desactivado"},200)
        except Exception as e:
            return Response({"details":"Error al desactivar administrador"},400)
        
    #Función para desactivar un administrador específico por su ID
    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(id=request.data["id"]).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        try:
            admin.user.is_active = not admin.user.is_active
            admin.user.save()
            return Response({"details":"Administrador actualizado correctamente", "is_active": admin.user.is_active}, 200)
        except Exception as e:
            return Response({"details":"Error al actualizar administrador"},400)

class TotalUsuarios(generics.CreateAPIView):
    def get(self, request, *args, **kwargs):
        total_usuarios = User.objects.count()
        total_usuarios_activos = User.objects.filter(is_active=1).count()
        total_admins = Administradores.objects.filter(user__is_active=1).count()
        total_maestros = Maestros.objects.filter(user__is_active=1).count()
        total_alumnos = Alumnos.objects.filter(user__is_active=1).count()
        #En caso de error, se puede manejar con un bloque try-except para capturar cualquier excepción que pueda ocurrir durante la consulta a la base de datos y devolver una respuesta adecuada.
        try:
            return Response({
                "total_usuarios": total_usuarios,
                "total_usuarios_activos": total_usuarios_activos,
                "total_admins": total_admins,
                "total_maestros": total_maestros,
                "total_alumnos": total_alumnos,
                "admins": total_admins,
                "maestros": total_maestros,
                "alumnos": total_alumnos
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"details":"Error al obtener el total de usuarios"},400)

    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [permissions.IsAuthenticated()]