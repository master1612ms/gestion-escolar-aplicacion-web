// src\app\screens\admin-screen\admin-screen.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { AuthServices } from '../../services/auth-services';
import { Router } from '@angular/router';
import { AdministradoresService } from '../../services/administradores-service';
import { NotificationService } from '../../services/tools/notification-service';
import { EliminarUserModal } from '../../modals/eliminar-user-modal/eliminar-user-modal';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-admin-screen',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './admin-screen.html',
  styleUrl: './admin-screen.scss',
})
export class AdminScreen implements OnInit, AfterViewInit{
  // Variables y métodos del componente
  public name_user: string = "";
  public lista_admins: any[] = [];
  public displayedColumns: string[] = [
    'clave_admin',
    'nombre',
    'email',
    'rfc',
    'grado_academico',
    'jornada',
    'editar',
    'estado'
  ];

  public totalAdmins = 0;

  dataSource = new MatTableDataSource<any>([]);

  private _paginator!: MatPaginator;
  private _sort!: MatSort;

  @ViewChild(MatPaginator)
  set paginator(value: MatPaginator) {
    this._paginator = value;
    this.dataSource.paginator = value;
  }

  get paginator(): MatPaginator {
    return this._paginator;
  }

  @ViewChild(MatSort)
  set sort(value: MatSort) {
    this._sort = value;
    this.dataSource.sort = value;
  }

  get sort(): MatSort {
    return this._sort;
  }

  constructor(
    private authService: AuthServices,
    private notificationService: NotificationService,
    private administradoresService: AdministradoresService,
    private router: Router,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.obtenerAdministradores();
  }

  ngAfterViewInit(): void {
    if (this._paginator) {
      this.dataSource.paginator = this._paginator;
    }
    if (this._sort) {
      this.dataSource.sort = this._sort;
    }
  }

  // Método para cargar la lista de administradores al iniciar el componente
  public obtenerAdministradores(): void {
    this.administradoresService.obtenerAdmins().subscribe({
      next: (response) => {
        this.lista_admins = response;
        this.totalAdmins = this.lista_admins.length;

        if (this.lista_admins.length > 0) {
          this.lista_admins.forEach((admin) => {
            admin.first_name = admin.user?.first_name || admin.first_name || '';
            admin.last_name = admin.user?.last_name || admin.last_name || '';
            admin.email = admin.user?.email || admin.email || '';
          });
        }

        this.dataSource = new MatTableDataSource<any>(this.lista_admins);
        if (this._paginator) {
          this.dataSource.paginator = this._paginator;
        }
        if (this._sort) {
          this.dataSource.sort = this._sort;
        }
        this.dataSource.filterPredicate = (data: any, filter: string) => {
          const searchable = [
            data.clave_admin,
            data.first_name,
            data.last_name,
            data.email,
            data.rfc,
            data.grado_academico,
            data.jornada,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchable.includes(filter);
        };
        this.dataSource._updateChangeSubscription();
      },
      error: () => {
        this.notificationService.error('Error al cargar la lista de administradores. Intente de nuevo más tarde.');
      }
    });
  }

  //Metodo para editar un administrador, se redirige a la pantalla de edición con el id del administrador seleccionado
  public goEditar(id: number): void {
    this.router.navigate(['/registro-usuarios', 'administrador', id]);
  }

  public goEditarAdmin(admin: any): void {
    if (!admin.user?.is_active) {
      this.notificationService.error('El administrador está desactivado. Primero reactívalo para poder editarlo.');
      return;
    }
    this.goEditar(admin.id);
  }

  public aplicarFiltro(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  //Metodo para desactivar/reactivar un administrador
  public toggleEstado(admin: any): void {
    // Se obtiene el ID del usuario en sesión, es decir, quien intenta eliminar al administrador
    const idUserSession = Number(this.authService.getUserId());

    // Si el usuario en sesión es el mismo que el administrador que se intenta eliminar, se muestra un mensaje de error
    if (idUserSession === admin.id && admin.user?.is_active) {
      this.notificationService.error('No puedes desactivar tu propia cuenta de administrador.');
      return;
    }

    const dialogRef = this.dialog.open(EliminarUserModal, {
      data: {
        id: admin.id,
        rol: 'administrador',
        accion: admin.user?.is_active ? 'desactivar' : 'activar'
      },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isDelete) {
        this.obtenerAdministradores();
      } else if (result) {
        this.notificationService.error('Administrador no se ha podido actualizar.');
      }
    });
  }

}
