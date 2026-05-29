// src\app\screens\alumnos-screen\alumnos-screen.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { EliminarUserModal } from '../../modals/eliminar-user-modal/eliminar-user-modal';
import { Router } from '@angular/router';
import { AlumnosService } from '../../services/alumnos-service';
import { NotificationService } from '../../services/tools/notification-service';
import { AuthServices } from '../../services/auth-services';

@Component({
  selector: 'app-alumnos-screen',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './alumnos-screen.html',
  styleUrls: ['./alumnos-screen.scss'],
})
export class AlumnosScreen implements OnInit, AfterViewInit {

  public name_user: string = '';
  public rol: string = '';
  public lista_alumnos: any[] = [];

  // Declaramos las columnas que se mostrarán en la tabla
  public displayedColumns: string[] = [
    'matricula',
    'nombre',
    'apellidos',
    'email',
    'fecha_nacimiento',
    'telefono',
    'direccion',
    'genero',
    'editar',
    'eliminar'
  ];

  dataSource = new MatTableDataSource<any>([]);
  private tablaInicializada = false;
  public totalAlumnos = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private authService: AuthServices,
    private alumnosService: AlumnosService,
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.authService.getUserCompleteName();
    this.rol = this.authService.getUserGroup();
    this.obtenerAlumnos();
  }

  ngAfterViewInit() {
    this.tablaInicializada = true;
    this.configurarTabla();
  }

  private configurarTabla(): void {
    if (!this.tablaInicializada) {
      return;
    }

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'matricula':
          return item.matricula ?? '';
        case 'nombre':
          return (item.first_name ?? '').toString().toLowerCase();
        case 'apellidos':
          return (item.last_name ?? '').toString().toLowerCase();
        default:
          return item[property];
      }
    };
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchable = [
        data.matricula,
        data.first_name,
        data.last_name,
        data.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(filter);
    };
  }

  public aplicarFiltro(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Función para obtener la lista de alumnos registrados
  public obtenerAlumnos(): void {
    this.alumnosService.obtenerListaAlumnos().subscribe({
      next: (response) => {
        this.lista_alumnos = Array.isArray(response) ? response : [];
        this.totalAlumnos = this.lista_alumnos.length;

        if (this.lista_alumnos.length > 0) {
          this.lista_alumnos.forEach((usuario) => {
            usuario.first_name = usuario.user?.first_name || usuario.first_name || '';
            usuario.last_name = usuario.user?.last_name || usuario.last_name || '';
            usuario.email = usuario.user?.email || usuario.email || '';
          });
        }

        // Reinstanciar el datasource ayuda a refrescar el paginator y el conteo
        this.dataSource = new MatTableDataSource<any>(this.lista_alumnos);
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
        this.dataSource._updateChangeSubscription();
        this.configurarTabla();
      },
      error: () => {
        this.notificationService.error('No se pudo obtener la lista de alumnos');
      }
    });
  }

  public goEditar(idUser: number) {
    this.router.navigate(['/registro-usuarios', 'alumno', idUser]);
  }

  public delete(idUser: number) {
    const dialogRef = this.dialog.open(EliminarUserModal, {
      width: '520px',
      data: { id: idUser, rol: 'alumno' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isDelete) {
        this.notificationService.success('Alumno eliminado correctamente');
        this.obtenerAlumnos();
      }
    });
  }

}
