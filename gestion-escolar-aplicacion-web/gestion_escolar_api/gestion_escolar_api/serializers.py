from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Administradores, Maestros
from .models import Administradores, Alumnos
from .utils import Utils


class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.CharField(required=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ('id','first_name','last_name', 'email', 'is_active')

    def validate_first_name(self, value):
        if not Utils.isLettersOnly(value):
            raise serializers.ValidationError('El nombre solo puede contener letras, sin espacios')
        return value

    def validate_last_name(self, value):
        if not Utils.isLettersOnly(value):
            raise serializers.ValidationError('Los apellidos solo pueden contener letras, sin espacios')
        return value
        
class AdminSerializer(serializers.ModelSerializer):
    user=UserSerializer(read_only=True)
    class Meta:
        model = Administradores
        fields = '__all__'

class MaestrosSerializer(serializers.ModelSerializer):
    user=UserSerializer(read_only=True)
    class Meta:
        model = Maestros
        fields = '__all__'

class AlumnoSerializer(serializers.ModelSerializer):
    user=UserSerializer(read_only=True)
    class Meta:
        model = Alumnos
        fields = "__all__"
