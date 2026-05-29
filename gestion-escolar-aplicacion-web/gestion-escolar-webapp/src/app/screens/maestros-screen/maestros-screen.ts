// src\app\screens\maestros-screen\maestros-screen.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { MatTableDataSource } from '@angular/material/table';
import { DatosMaestro } from '../../interfaces/usuarios-interfaces';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MaestrosService } from '../../services/maestros-service';
import { NotificationService } from '../../services/tools/notification-service';
import { AuthServices } from '../../services/auth-services';
import { EliminarUserModal } from '../../modals/eliminar-user-modal/eliminar-user-modal';

@Component({
  selector: 'app-maestros-screen',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './maestros-screen.html',
  styleUrl: './maestros-screen.scss',
})
export class MaestrosScreen implements OnInit{

  public name_user: string = '';
  public rol: string = '';
  public lista_maestros: any[] = [];
  public totalMaestros = 0;

  //Declaramos las columnas que se mostrarán en la tabla
  public displayedColumns: string[] = [
    'id_trabajador',
    'nombre',
    'email',
    'fecha_nacimiento',
    'telefono',
    'rfc',
    'centro_universitario',
    'sueldo_estimado',
    'editar',
    'eliminar'
  ];

  dataSource = new MatTableDataSource<DatosMaestro>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private authService: AuthServices,
    private maestrosService: MaestrosService,
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.authService.getUserCompleteName();
    this.rol = this.authService.getUserGroup();
    this.obtenerMaestros();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  //Función para obtener la lista de maestros registrados
  public obtenerMaestros(): void {
    this.maestrosService.obtenerListaMaestros().subscribe({
      next: (response) => {
        this.lista_maestros = response;
        this.totalMaestros = this.lista_maestros.length;

        if (this.lista_maestros.length > 0) {
          this.lista_maestros.forEach((usuario) => {
            usuario.first_name = usuario.user.first_name;
            usuario.last_name = usuario.user.last_name;
            usuario.email = usuario.user.email;
          });
        }

        this.dataSource = new MatTableDataSource<DatosMaestro>(
          this.lista_maestros as DatosMaestro[]
        );

        this.dataSource.filterPredicate = (data: any, filter: string) => {
          const searchable = [
            data.id_trabajador,
            data.first_name,
            data.last_name,
            data.email,
            data.rfc,
            data.centro_universitario,
            data.sueldo_estimado,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchable.includes(filter);
        };

        this.dataSource._updateChangeSubscription();

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: () => {
        this.notificationService.error('No se pudo obtener la lista de maestros');
      }
    });
  }

  public goEditar(idUser: number) {
    this.router.navigate(['/registro-usuarios', 'maestro', idUser]);
  }

  public aplicarFiltro(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public delete(idUser: number) {
    // Se obtiene el ID del usuario en sesión, es decir, quien intenta eliminar al maestro
    const idUserSession = Number(this.authService.getUserId());
    // --------- Pero el parámetro idUser (el de la función) es el ID del maestro que se quiere eliminar ---------
    // Administrador puede eliminar cualquier maestro
    // Maestro solo puede eliminar su propio registro
    if (this.rol === 'administrador' || (this.rol === 'maestro' && idUserSession === idUser)) {
      //Si es administrador o es maestro, es decir, cumple la condición, se puede eliminar
      const dialogRef = this.dialog.open(EliminarUserModal,{
        data: { id: idUser, rol: 'maestro' }, //Se pasan valores a través del componente
        height: '288px',
        width: '328px',
      });

      //Después de cerrar el modal, se actualiza la lista de maestros para reflejar los cambios
      dialogRef.afterClosed().subscribe(result => {
        if(result.isDelete){
          this.obtenerMaestros();
        }else{
          this.notificationService.error("Maestro no se ha podido eliminar.");
        }
      });
    }else{
      //Si no cumple la condición, se muestra un mensaje de error
      this.notificationService.error("No tienes permiso para eliminar a este maestro.");
    }

  }

}
