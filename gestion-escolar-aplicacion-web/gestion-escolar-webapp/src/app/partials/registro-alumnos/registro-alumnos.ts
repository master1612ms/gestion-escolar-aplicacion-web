// src\app\partials\registro-alumnos\registro-alumnos.ts
import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { Router, ActivatedRoute } from '@angular/router';
import { AlumnosService } from '../../services/alumnos-service';
import { NotificationService } from '../../services/tools/notification-service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-registro-alumnos',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './registro-alumnos.html',
  styleUrl: './registro-alumnos.scss',
})
export class RegistroAlumnos implements OnInit, OnChanges {

  @Input() rol: string = '';
  @Input() datos_user: any = {};
  @Input() editar: boolean = false;

  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  public alumno: any = {};
  public errors: any = {};
  public idUser: number = 0;

  public materias: any[] = [
    { value: '1', nombre: 'Aplicaciones Web' },
    { value: '2', nombre: 'Programación 1' },
    { value: '3', nombre: 'Bases de datos' },
    { value: '4', nombre: 'Tecnologías Web' },
    { value: '5', nombre: 'Minería de datos' },
    { value: '6', nombre: 'Desarrollo móvil' },
    { value: '7', nombre: 'Estructuras de datos' },
    { value: '8', nombre: 'Administración de redes' },
    { value: '9', nombre: 'Ingeniería de Software' },
    { value: '10', nombre: 'Administración de S.O.' },
  ];

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private activatedRoute: ActivatedRoute,
    private alumnosService: AlumnosService
  ) {}

  ngOnInit(): void {
    this.alumno = this.alumnosService.esquemaAlumno();
    this.alumno.rol = this.rol;

    if (this.editar && this.datos_user) {
      this.alumno = { ...this.alumno, ...this.datos_user };
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datos_user'] && this.editar && this.datos_user) {
      this.alumno = { ...this.alumnosService.esquemaAlumno(), ...this.datos_user };
      if (this.datos_user.user) {
        this.alumno.first_name = this.datos_user.user.first_name || this.datos_user.first_name;
        this.alumno.last_name = this.datos_user.user.last_name || this.datos_user.last_name;
        this.alumno.email = this.datos_user.user.email || this.datos_user.email;
      }
    }

    if (changes['editar'] && !this.editar) {
      this.alumno = this.alumnosService.esquemaAlumno();
      this.alumno.rol = this.rol;
    }
  }

  public regresar(): void {
    this.errors = this.alumnosService.validarAlumno(this.alumno, this.editar);
    if (Object.keys(this.errors).length > 0) {
      this.notificationService.error('Completa los campos obligatorios antes de salir');
      return;
    }
    this.location.back();
  }

  public checkboxChange(event: any): void {
    if (!this.alumno.materias_array) {
      this.alumno.materias_array = [];
    }

    if (event.checked) {
      this.alumno.materias_array.push(event.source.value);
    } else {
      this.alumno.materias_array = this.alumno.materias_array.filter((materia: string) => materia !== event.source.value);
    }
  }

  public revisarSeleccion(nombre: string): boolean {
    return Array.isArray(this.alumno.materias_array) && this.alumno.materias_array.includes(nombre);
  }

  public registrar(): void {
    this.errors = {};
    this.errors = this.alumnosService.validarAlumno(this.alumno, this.editar);
    if (Object.keys(this.errors).length > 0) {
      return;
    }

    this.alumno.curp = (this.alumno.curp || '').replace(/\s+/g, '').toUpperCase();

    if (this.alumno.password === this.alumno.confirmar_password) {
      this.alumnosService.registrarAlumno(this.alumno).subscribe({
        next: () => {
          this.notificationService.success('Alumno registrado exitosamente');
          this.router.navigate(['/alumnos']);
        },
        error: () => {
          this.notificationService.error('Error al registrar alumno');
        }
      });
    } else {
      this.notificationService.error('Las contraseñas no coinciden');
      this.alumno.password = '';
      this.alumno.confirmar_password = '';
    }
  }

  public actualizar(): void {
    this.errors = {};
    this.errors = this.alumnosService.validarAlumno(this.alumno, true);
    if (Object.keys(this.errors).length > 0) {
      return;
    }

    const payload: any = { ...this.alumno };
    if (!payload.id && this.datos_user && this.datos_user.id) {
      payload.id = this.datos_user.id;
    }

    this.alumnosService.actualizarAlumno(payload).subscribe({
      next: () => {
        this.notificationService.success('Alumno actualizado correctamente');
        this.router.navigate(['/alumnos']);
      },
      error: (error: any) => {
        console.error('Error al actualizar alumno:', error);
        this.notificationService.error('Error al actualizar alumno');
      }
    });
  }

  showPassword(): void {
    if (this.inputType_1 === 'password') {
      this.inputType_1 = 'text';
      this.hide_1 = true;
    } else {
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  showPwdConfirmar(): void {
    if (this.inputType_2 === 'password') {
      this.inputType_2 = 'text';
      this.hide_2 = true;
    } else {
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  public changeFecha(event: any): void {
    this.alumno.fecha_nacimiento = event.value.toISOString().split('T')[0];
  }

  public soloLetras(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if (
      !(charCode >= 65 && charCode <= 90) &&
      !(charCode >= 97 && charCode <= 122) &&
      charCode !== 32
    ) {
      event.preventDefault();
    }
  }

  public limpiarCurp(): void {
    this.alumno.curp = (this.alumno.curp || '').replace(/\s+/g, '').toUpperCase();
  }

  public soloLetrasSinEspacios(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      return;
    }

    const charCode = event.key.charCodeAt(0);
    if (
      !(charCode >= 65 && charCode <= 90) &&
      !(charCode >= 97 && charCode <= 122) &&
      !(charCode >= 48 && charCode <= 57)
    ) {
      event.preventDefault();
    }
  }

  public soloDecimal(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const currentValue = input?.value ?? '';

    if (event.key === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const nextValue = `${currentValue}${event.key}`;
    const numericValue = Number(nextValue);
    if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
      event.preventDefault();
    }
  }

}
