// src\app\screens\registro-usuarios-screen\registro-usuarios-screen.ts
import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { Location } from '@angular/common';
import { MatRadioChange } from '@angular/material/radio';
import { AuthServices } from '../../services/auth-services';
import { RegistroAdmin } from '../../partials/registro-admin/registro-admin';
import { RegistroAlumnos } from '../../partials/registro-alumnos/registro-alumnos';
import { RegistroMaestros } from '../../partials/registro-maestros/registro-maestros';
import { ActivatedRoute } from '@angular/router';
import { AdministradoresService } from '../../services/administradores-service';
import { NotificationService } from '../../services/tools/notification-service';
import { MaestrosService } from '../../services/maestros-service';
import { AlumnosService } from '../../services/alumnos-service';

@Component({
  selector: 'app-registro-usuarios-screen',
  imports: [
    ...SHARED_IMPORTS,
    RegistroAdmin,
    RegistroAlumnos,
    RegistroMaestros
  ],
  templateUrl: './registro-usuarios-screen.html',
  styleUrl: './registro-usuarios-screen.scss',
})
export class RegistroUsuariosScreen implements OnInit {

  public tipo:string = "registro-usuarios";
  public user:any = {};
  public editar:boolean = false;
  public rol:string = "";
  public idUser:number = 0;

  //Banderas para el tipo de usuario
  public isAdmin:boolean = false;
  public isAlumno:boolean = false;
  public isMaestro:boolean = false;

  public tipo_user:string = "";

  constructor(
    private location: Location,
    public authService: AuthServices,
    private activatedRoute: ActivatedRoute,
    private administradoresService: AdministradoresService,
    private maestrosService: MaestrosService,
    private alumnosService: AlumnosService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.user.tipo_usuario = '';
    //Obtener el rol y id del usuario a editar desde la URL
    if(this.activatedRoute.snapshot.params['rol'] !== undefined){
      this.rol = this.activatedRoute.snapshot.params['rol'];
    }
    if(this.activatedRoute.snapshot.params['id'] !== undefined){
      this.idUser = this.activatedRoute.snapshot.params['id'];
    }

    //Si se recibe un rol y un id, se activa el modo de edición
    if(this.rol !== "" && this.idUser !== 0){
      this.editar = true;
      //Llamamos a la función para obtener los datos del usuario a editar
      this.obtenerUsuarioPorId();
    }
  }

  //Función para obtener los datos del usuario a editar, dependiendo del rol se llama a la función correspondiente
  public obtenerUsuarioPorId() {
    if(this.rol === "administrador"){
      //Lógica para obtener un administrador por su ID
      this.administradoresService.obtenerAdminPorId(this.idUser).subscribe({
        next: (response) => {
          this.user = response;
          //Verificar que se hayan obtenido los datos correctamente
          console.log("Datos del admin encontrado: ", this.user);
          // Asignar datos, soportando respuesta plana o anidada
          this.user.first_name = response.user?.first_name || response.first_name;
          this.user.last_name = response.user?.last_name || response.last_name;
          this.user.email = response.user?.email || response.email;
          // Establecer el tipo de usuario para mostrar el formulario correspondiente
          this.user.tipo_usuario = this.rol;
          // Activar el formulario de administrador
          this.isAdmin = true;
        },
        error: (error) => {
          this.notificationService.error('Error al cargar los datos del administrador. Intente de nuevo más tarde.');
          console.log(error);

        }
      });

    }else if(this.rol === "alumno"){
      //Lógica para obtener un alumno por su ID
      this.alumnosService.obtenerAlumnoPorId(this.idUser).subscribe({
        next: (response) => {
          this.user = response;
          console.log('Datos del alumno encontrado: ', this.user);
          // Normalizar campos provenientes de la API
          this.user.first_name = response.user?.first_name || response.first_name;
          this.user.last_name = response.user?.last_name || response.last_name;
          this.user.email = response.user?.email || response.email;
          // materias_array puede venir como string JSON o arreglo
          try{
            if(typeof this.user.materias_array === 'string'){
              this.user.materias_array = JSON.parse(this.user.materias_array || '[]');
            }
          }catch(e){ this.user.materias_array = []; }
          this.user.tipo_usuario = this.rol;
          this.isAlumno = true;
        },
        error: (error) => {
          this.notificationService.error('Error al cargar los datos del alumno. Intente de nuevo más tarde.');
          console.log(error);
        }
      });
    }else if(this.rol === "maestro"){
      //Lógica para obtener un maestro por su ID
      this.maestrosService.obtenerMaestroPorId(this.idUser).subscribe({
        next: (response) => {
          this.user = response;
          console.log('Datos del maestro encontrado: ', this.user);
          this.user.first_name = response.user?.first_name || response.first_name;
          this.user.last_name = response.user?.last_name || response.last_name;
          this.user.email = response.user?.email || response.email;
          try{
            if(typeof this.user.materias_array === 'string'){
              this.user.materias_array = JSON.parse(this.user.materias_array || '[]');
            }
          }catch(e){ this.user.materias_array = []; }
          this.user.tipo_usuario = this.rol;
          this.isMaestro = true;
        },
        error: (error) => {
          this.notificationService.error('Error al cargar los datos del maestro. Intente de nuevo más tarde.');
          console.log(error);
        }
      });
    }
  }

  public radioChange(event: MatRadioChange) {
    if(event.value === "administrador"){
      this.isAdmin = true;
      this.isAlumno = false;
      this.isMaestro = false;
      this.tipo_user = "administrador";
    }else if (event.value === "alumno"){
      this.isAdmin = false;
      this.isAlumno = true;
      this.isMaestro = false;
      this.tipo_user = "alumno";
    }else if (event.value === "maestro"){
      this.isAdmin = false;
      this.isAlumno = false;
      this.isMaestro = true;
      this.tipo_user = "maestro";
    }
  }

  //Función para regresar a la pantalla anterior
  public goBack() {
    this.location.back();
  }

}
