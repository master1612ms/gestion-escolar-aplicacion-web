// src\app\screens\graficas-screen\graficas-screen.ts
import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import DatalabelsPlugin from 'chartjs-plugin-datalabels';
import { AdministradoresService } from '../../services/administradores-service';
import { MaestrosService } from '../../services/maestros-service';
import { AlumnosService } from '../../services/alumnos-service';
import { NotificationService } from '../../services/tools/notification-service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-graficas-screen',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './graficas-screen.html',
  styleUrl: './graficas-screen.scss',
})
export class GraficasScreen implements OnInit{
  //Agregar chartjs-plugin-datalabels
  //Variables

  public total_user: any = {};
  public totalAdministradores = 0;
  public totalMaestros = 0;
  public totalAlumnos = 0;

  //Histograma
  lineChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        label: 'Registro de usuarios',
        backgroundColor: '#F88406'
      }
    ]
  }
  lineChartOption = {
    responsive:false
  }
  lineChartPlugins = [ DatalabelsPlugin ];

  //Barras
  barChartData = {
    labels: ["Congreso", "FePro", "Presentación Doctoral", "Feria Matemáticas", "T-System"],
    datasets: [
      {
        data:[34, 43, 54, 28, 74],
        label: 'Eventos Académicos',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#82D3FB',
          '#FB82F5',
          '#2AD84A'
        ]
      }
    ]
  }
  barChartOption = {
    responsive:false
  }
  barChartPlugins = [ DatalabelsPlugin ];

  //Circular
  pieChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#FCFF44',
          '#F1C8F2',
          '#31E731'
        ]
      }
    ]
  }
  pieChartOption = {
    responsive:false
  }
  pieChartPlugins = [ DatalabelsPlugin ];

  // Doughnut
  doughnutChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#31E7E7'
        ]
      }
    ]
  }
  doughnutChartOption = {
    responsive:false
  }
  doughnutChartPlugins = [ DatalabelsPlugin ];

  constructor(
    private notificationService: NotificationService,
    private administradoresServices: AdministradoresService,
    private maestrosService: MaestrosService,
    private alumnosService: AlumnosService
  ) { }

  ngOnInit(): void {
    this.obtenerTotalUsers();
  }

  private obtenerCantidadRegistros(response: any): number {
    if (Array.isArray(response)) {
      return response.length;
    }

    if (typeof response === 'number') {
      return response;
    }

    if (response && typeof response === 'object') {
      if (typeof response.count === 'number') {
        return response.count;
      }

      const posiblesListas = ['data', 'results', 'usuarios', 'admins', 'maestros', 'alumnos'];
      for (const key of posiblesListas) {
        if (Array.isArray(response[key])) {
          return response[key].length;
        }
      }
    }

    return 0;
  }

  private actualizarGraficasUsuarios(): void {
    const values = [this.totalAdministradores, this.totalMaestros, this.totalAlumnos];

    this.lineChartData = {
      ...this.lineChartData,
      datasets: [
        {
          ...this.lineChartData.datasets[0],
          data: values
        }
      ]
    };

    this.pieChartData = {
      ...this.pieChartData,
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: values
        }
      ]
    };

    this.doughnutChartData = {
      ...this.doughnutChartData,
      datasets: [
        {
          ...this.doughnutChartData.datasets[0],
          data: values
        }
      ]
    };
  }

  // Función para obtener el total de usuarios registrados
  public obtenerTotalUsers(){
    forkJoin({
      administradores: this.administradoresServices.obtenerAdmins(),
      maestros: this.maestrosService.obtenerListaMaestros(),
      alumnos: this.alumnosService.obtenerListaAlumnos(),
    }).subscribe({
      next: ({ administradores, maestros, alumnos }) => {
        this.totalAdministradores = this.obtenerCantidadRegistros(administradores);
        this.totalMaestros = this.obtenerCantidadRegistros(maestros);
        this.totalAlumnos = this.obtenerCantidadRegistros(alumnos);

        this.total_user = {
          administradores: this.totalAdministradores,
          maestros: this.totalMaestros,
          alumnos: this.totalAlumnos,
          total: this.totalAdministradores + this.totalMaestros + this.totalAlumnos,
        };

        this.actualizarGraficasUsuarios();
        this.notificationService.success("Total de usuarios registrados por cada rol obtenido correctamente");
      },
      error: () => {
        this.notificationService.error("No se pudo obtener el total de cada rol de usuarios");
      }
    });
  }

}
