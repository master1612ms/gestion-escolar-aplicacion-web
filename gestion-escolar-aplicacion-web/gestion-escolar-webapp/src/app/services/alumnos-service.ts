// src\app\services\alumnos-service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ErrorsService } from './tools/errors-service';
import { ValidatorService } from './tools/validator-service';
import { AuthServices } from './auth-services';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AlumnosService {

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private authService: AuthServices
  ) { }

  /** Genera los HttpHeaders con el token de sesión si existe */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getSessionToken();
    return token
      ? new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  public esquemaAlumno(){
    return {
      'rol':'',
      'matricula': '',
      'carrera': '',
      'semestre': '',
      'promedio': '',
      'first_name': '',
      'last_name': '',
      'email': '',
      'password': '',
      'confirmar_password': '',
      'fecha_nacimiento': '',
      'curp': '',
      'edad': '',
      'telefono': '',
      'direccion': '',
      'genero': '',
      'materias_array': []
    }
  }

  //Validación para el formulario
  public validarAlumno(data: any, editar: boolean){
    const error: any = {};

    if(!this.validatorService.required(data["matricula"])){
      error["matricula"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["carrera"])){
      error["carrera"] = this.errorService.required;
    }else if(!['TIC', 'Ingeniería en Ciencias de la Computación', 'Licenciatura en Ciencias de la Computación'].includes(data["carrera"])){
      error["carrera"] = 'Selecciona una carrera válida';
    }

    if(!this.validatorService.required(data["semestre"])){
      error["semestre"] = this.errorService.required;
    }else if(!this.validatorService.integer(data["semestre"])){
      error["semestre"] = 'El semestre debe ser un número entero';
    }else if(Number(data["semestre"]) < 1 || Number(data["semestre"]) > 10){
      error["semestre"] = 'El semestre debe estar entre 1 y 10';
    }

    if(!this.validatorService.required(data["promedio"])){
      error["promedio"] = this.errorService.required;
    }else if(!this.validatorService.numeric(data["promedio"])){
      error["promedio"] = this.errorService.numeric;
    }else if(Number(data["promedio"]) < 0 || Number(data["promedio"]) > 10){
      error["promedio"] = 'El promedio debe estar entre 0 y 10';
    }

    if(!this.validatorService.required(data["first_name"])){
      error["first_name"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["last_name"])){
      error["last_name"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["email"])){
      error["email"] = this.errorService.required;
    }else if(!this.validatorService.maxLen(data["email"], 40)){
      error["email"] = this.errorService.max;
    }else if (!this.validatorService.email(data['email'])) {
      error['email'] = this.errorService.email;
    }

    if(!editar){
      if(!this.validatorService.required(data["password"])){
        error["password"] = this.errorService.required;
      }

      if(!this.validatorService.required(data["confirmar_password"])){
        error["confirmar_password"] = this.errorService.required;
      }
    }

    if(!this.validatorService.required(data["fecha_nacimiento"])){
      error["fecha_nacimiento"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["curp"])){
      error["curp"] = this.errorService.required;
    }else if(!this.validatorService.minLen(data["curp"], 18)){
      error["curp"] = this.errorService.min;
    }else if(!this.validatorService.maxLen(data["curp"], 18)){
      error["curp"] = this.errorService.max;
    }


    if(!this.validatorService.required(data["edad"])){
      error["edad"] = this.errorService.required;
    }else if(!this.validatorService.numeric(data["edad"])){
      error["edad"] = "El formato es solo números";
    }else{
      const edadVal = Number(data["edad"]);
      if(edadVal < 3 || edadVal > 120){
        error["edad"] = "Edad fuera de rango razonable";
      } else {
        // Si se proporcionó fecha_nacimiento, validar coherencia
        if(data["fecha_nacimiento"]){
          try{
            let bd: Date;
            if(typeof data["fecha_nacimiento"] === 'string'){
              // intentar formatos ISO o dd/mm/yyyy
              if(/\d{4}-\d{2}-\d{2}/.test(data["fecha_nacimiento"])){
                bd = new Date(data["fecha_nacimiento"]);
              } else if(/\d{2}\/\d{2}\/\d{4}/.test(data["fecha_nacimiento"])){
                const parts = data["fecha_nacimiento"].split('/');
                bd = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              } else {
                bd = new Date(data["fecha_nacimiento"]);
              }
            } else {
              bd = new Date(data["fecha_nacimiento"]);
            }
            if(!isNaN(bd.getTime())){
              const today = new Date();
              let computed = today.getFullYear() - bd.getFullYear();
              if((today.getMonth() < bd.getMonth()) || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())){
                computed -= 1;
              }
              if(Math.abs(computed - edadVal) > 1){
                error["edad"] = "La edad no coincide con la fecha de nacimiento";
              }
            }
          }catch(e){
            // si falla el parseo, no bloqueamos aquí — el backend validará
          }
        }
      }
    }

    if(!this.validatorService.required(data["telefono"])){
      error["telefono"] = this.errorService.required;
    }else if(!this.validatorService.phoneMX(data["telefono"])){
      error["telefono"] = 'El teléfono debe tener exactamente 10 números';
    }

    // Validar que seleccione al menos una materia solo al crear
    if(!editar && (!data["materias_array"] || !Array.isArray(data["materias_array"]) || data["materias_array"].length === 0)){
      error["materias_array"] = "Debes seleccionar al menos una materia";
    }

    //Return arreglo
    return error;
  }
  //Función para registrar un alumno, esta función se llamará en el método registrar() dentro del screen registro-usuarios-screen.ts
  public registrarAlumno(data: any): Observable<any> {
    return this.http.post<any>(`${environment.url_api}/alumnos/`, data, { headers: this.getAuthHeaders() });
  }

  //Función para obtener la lista de alumnos, esta función se llamará en el método cargarAlumnos() dentro del screen lista-alumnos-screen.ts
  public obtenerListaAlumnos(): Observable<any> {
    return this.http.get<any>(`${environment.url_api}/alumnos/`, { headers: this.getAuthHeaders() });
  }

  //Función para obtener un alumno por su ID, esta función se llamará en el método obtenerUsuarioPorId() dentro del screen registro-usuarios-screen.ts
  public obtenerAlumnoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${environment.url_api}/alumnos/?id=${id}`, { headers: this.getAuthHeaders() });
  }

  //Función para actualizar un alumno, esta función se llamará en el método actualizar() dentro del screen registro-usuarios-screen.ts
  public actualizarAlumno(data: any): Observable<any> {
    return this.http.put<any>(`${environment.url_api}/alumnos/`, data, { headers: this.getAuthHeaders() });
  }

  //Función para eliminar un alumno, esta función se llamará en el método eliminar() dentro del modal eliminar-user-modal.ts
  public eliminarAlumno(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.url_api}/alumnos/?id=${id}`, { headers: this.getAuthHeaders() });
  }


}
