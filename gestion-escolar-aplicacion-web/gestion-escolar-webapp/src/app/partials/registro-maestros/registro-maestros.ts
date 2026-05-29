// src\app\partials\registro-maestros\registro-maestros.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MaestrosService } from '../../services/maestros-service';
import { NotificationService } from '../../services/tools/notification-service';

@Component({
  selector: 'app-registro-maestros',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './registro-maestros.html',
  styleUrl: './registro-maestros.scss',
})
export class RegistroMaestros implements OnInit, OnChanges {

  @Input() rol:string = "";
  @Input() datos_user:any = {};
  @Input() editar:boolean = false;

  public maestro: any = {};
  public errors: any = {};
  public idUser: number = 0;

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  //Para el select
  public areas: any[] = [
    {value: '1', viewValue: 'Desarrollo Web'},
    {value: '2', viewValue: 'Programación'},
    {value: '3', viewValue: 'Bases de datos'},
    {value: '4', viewValue: 'Redes'},
    {value: '5', viewValue: 'Matemáticas'},
  ];

  public materias:any[] = [
    {value: '1', nombre: 'Aplicaciones Web'},
    {value: '2', nombre: 'Programación 1'},
    {value: '3', nombre: 'Bases de datos'},
    {value: '4', nombre: 'Tecnologías Web'},
    {value: '5', nombre: 'Minería de datos'},
    {value: '6', nombre: 'Desarrollo móvil'},
    {value: '7', nombre: 'Estructuras de datos'},
    {value: '8', nombre: 'Administración de redes'},
    {value: '9', nombre: 'Ingeniería de Software'},
    {value: '10', nombre: 'Administración de S.O.'},
  ];

  constructor(
    private location: Location,
    private router: Router,
    private maestrosService: MaestrosService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.maestro = this.maestrosService.esquemaMaestro();
    // Rol del usuario
    this.maestro.rol = this.rol;
    if (this.editar && this.datos_user) {
      this.maestro = { ...this.maestro, ...this.datos_user };
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datos_user'] && this.editar && this.datos_user) {
      this.maestro = { ...this.maestrosService.esquemaMaestro(), ...this.datos_user };
      if (this.datos_user.user) {
        this.maestro.first_name = this.datos_user.user.first_name || this.datos_user.first_name;
        this.maestro.last_name = this.datos_user.user.last_name || this.datos_user.last_name;
        this.maestro.email = this.datos_user.user.email || this.datos_user.email;
      }
      // Normalize materias_array if it's JSON string
      try {
        if (typeof this.maestro.materias_array === 'string') {
          this.maestro.materias_array = JSON.parse(this.maestro.materias_array || '[]');
        }
      } catch (e) {
        this.maestro.materias_array = [];
      }
    }
    if (changes['editar'] && !this.editar) {
      this.maestro = this.maestrosService.esquemaMaestro();
      this.maestro.rol = this.rol;
    }
  }

  //Funciones para password
  public showPassword()
  {
    if(this.inputType_1 === 'password'){
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else{
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  public showPwdConfirmar()
  {
    if(this.inputType_2 === 'password'){
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else{
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  public normalizarRfc() {
    if (this.maestro?.rfc !== undefined && this.maestro?.rfc !== null) {
      this.maestro.rfc = String(this.maestro.rfc).replace(/\s+/g, '').toUpperCase();
    }
  }

  // Normaliza el ID de trabajador: solo dígitos, sin espacios
  public normalizarIdTrabajador() {
    if (this.maestro?.id_trabajador !== undefined && this.maestro?.id_trabajador !== null) {
      this.maestro.id_trabajador = String(this.maestro.id_trabajador).replace(/\s+/g, '').replace(/[^0-9]/g, '');
    }
  }

  // Normaliza nombre: permite letras y espacios, convierte a mayúsculas
  public normalizarNombre() {
    if (this.maestro?.first_name !== undefined && this.maestro?.first_name !== null) {
      this.maestro.first_name = String(this.maestro.first_name)
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '')
        .toUpperCase();
    }
  }

  // Normaliza apellidos: permite letras y espacios, convierte a mayúsculas
  public normalizarApellidos() {
    if (this.maestro?.last_name !== undefined && this.maestro?.last_name !== null) {
      this.maestro.last_name = String(this.maestro.last_name)
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '')
        .toUpperCase();
    }
  }

  public regresar(){
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if (Object.keys(this.errors).length > 0) {
      this.notificationService.error('Completa los campos obligatorios antes de salir');
      return;
    }
    this.location.back();
  }

  public registrar(){

    // Inicializo el objeto de errores para evitar que se muestren errores anteriores o datos anteriores al momento de registrar un nuevo admin
    this.errors = {};
    console.log("Datos del maestro: ", this.maestro);

    // Validar datos y mostrar errores
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    //Verificamos si el objeto de errores está vacío, lo que indica que no hay errores de validación
    if(Object.keys(this.errors).length > 0){
      return;
    }

    // Validar si las contraseñas coinciden solo si no se está editando, ya que en la edición no es obligatorio cambiar la contraseña
    if(this.maestro.password === this.maestro.confirmar_password){
      //Lógica para registrar el maestro, conectando con el backend y mostrando notificaciones de éxito o error según corresponda
      this.maestrosService.registrarMaestro(this.maestro).subscribe({
        next: (response) => {
          this.notificationService.success("Maestro registrado exitosamente");
          this.router.navigate(['/maestros']);
        },
        error: (error) => {
          console.error("Error al registrar el maestro: ", error);
          this.notificationService.error("Error al registrar el maestro. Por favor, inténtalo de nuevo.");
        }
      });
    }else{
      this.notificationService.error("Las contraseñas no coinciden");
      this.maestro.password="";
      this.maestro.confirmar_password="";
    }

  }

  public actualizar(){
    // Validación de los datos antes de actualizar
    this.errors = {};
    this.errors = this.maestrosService.validarMaestro(this.maestro, true);
    if(Object.keys(this.errors).length > 0){
      return;
    }

    const payload: any = { ...this.maestro };
    if(!payload.id && this.datos_user && this.datos_user.id){
      payload.id = this.datos_user.id;
    }

    // Llamada al servicio para actualizar el maestro
    this.maestrosService.actualizarMaestro(payload).subscribe({
      next: (response) => {
        this.notificationService.success('Maestro actualizado exitosamente');
        this.router.navigate(['/maestros']);
      },
      error: (error) => {
        console.error('Error al actualizar maestro:', error);
        this.notificationService.error('Error al actualizar maestro');
      }
    });

  }

  //Función para detectar el cambio de fecha
  public changeFecha(event :any){
    this.maestro.fecha_nacimiento = event.value.toISOString().split("T")[0];
  }

  // Funciones para los checkbox
  public checkboxChange(event:any){
    if(event.checked){
      this.maestro.materias_array.push(event.source.value)
    }else{
      this.maestro.materias_array.forEach((materia: any, i: any) => {
        if(materia === event.source.value){
          this.maestro.materias_array.splice(i,1)
        }
      });
    }
  }

  public revisarSeleccion(nombre: string){
    if(this.maestro.materias_array){
      const busqueda = this.maestro.materias_array.find((element: string)=>element===nombre);
      if(busqueda !== undefined){
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }
  }

  public soloNumeros(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    if (
      !(charCode >= 48 && charCode <= 57) &&
      charCode !== 8 &&
      charCode !== 9 &&
      charCode !== 46
    ) {
      event.preventDefault();
    }
  }

  // Bloquea la entrada de números en campos de nombre y apellidos
  public bloquearNumeros(event: KeyboardEvent) {
    const controlKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', 'Enter'];
    if (controlKeys.includes(event.key)) return;
    if (/\d/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Bloquea la entrada de letras en el campo de ID (matrícula)
  public bloquearLetrasId(event: KeyboardEvent) {
    const controlKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', 'Enter'];
    if (controlKeys.includes(event.key)) return;
    if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(event.key)) {
      event.preventDefault();
    }
  }

}
