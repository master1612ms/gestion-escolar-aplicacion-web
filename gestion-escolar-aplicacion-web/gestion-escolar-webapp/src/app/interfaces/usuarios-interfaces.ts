// src\app\interfaces\usuarios-interfaces.ts
// Interfaces de usuarios (Maestro, Administrador, Alumno)
// Se incluyen los campos usados por los esquemas y servicios

export interface DatosMaestro {
  id?: number;
  id_trabajador: string | number;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento?: string;
  telefono?: string;
  rfc?: string;
  cubiculo?: string;
  area_investigacion?: string | number;
  centro_universitario?: string;
  sueldo_estimado?: number | string;
  jornada?: string;
  materias_array?: string[];
  rol?: string;
  password?: string;
  confirmar_password?: string;
}

export interface DatosAdmin {
  id?: number;
  clave_admin?: string | number;
  first_name: string;
  last_name: string;
  email: string;
  telefono?: string;
  rfc?: string;
  edad?: number | string;
  jornada?: string;
  grado_academico?: string;
  ocupacion?: string;
  rol?: string;
  password?: string;
  confirmar_password?: string;
}

export interface DatosAlumno {
  id?: number;
  matricula?: string | number;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento?: string;
  telefono?: string;
  curp?: string;
  direccion?: string;
  genero?: string;
  materias_array?: string[];
  rol?: string;
  password?: string;
  confirmar_password?: string;
}
