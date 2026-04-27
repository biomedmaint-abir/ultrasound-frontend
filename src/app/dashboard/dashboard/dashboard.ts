import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InterventionService } from '../../services/intervention';
import { EquipementService } from '../../services/equipement';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  totalInterventions = 0;
  totalEquipements = 0;
  totalContrats = 0;
  mttr: number | null = 0;
  disponibilite = 0;
  email = localStorage.getItem('email') || '';
  isLoading = true;
  today = new Date();

  allInterventions: any[] = [];
  allEquipements: any[] = [];
  allContrats: any[] = [];
  interventionsData: any[] = [];
  equipementsData: any[] = [];

  parcs: string[] = [];
  selectedParc = '';

  typeChart: any;
  equipChart: any;
  monthChart: any;

  constructor(
    private interventionService: InterventionService,
    private equipementService: EquipementService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/auth']); return; }
    this.loadData();
  }

  ngAfterViewInit(): void {}

  loadData(): void {
    this.interventionService.getAll().subscribe({
      next: (data) => {
        this.allInterventions = data;
        this.interventionsData = data;
        this.totalInterventions = data.length;
        const durees = data.filter((i: any) => i.dureeHeures).map((i: any) => i.dureeHeures);
        this.mttr = durees.length > 0 ? durees.reduce((a: number, b: number) => a + b, 0) / durees.length : 0;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.equipementService.getAll().subscribe({
      next: (data) => {
        this.allEquipements = data;
        this.equipementsData = data;
        this.parcs = [...new Set(data.map((e: any) => e.parc).filter((p: any) => p))];
        this.calculateEquipStats(data);
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.buildCharts(), 300);
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });

    this.http.get<any[]>(`${environment.apiUrl}/contrats`).subscribe({
      next: (data) => {
        this.allContrats = data;
        if (this.selectedParc) {
          this.totalContrats = data.filter((c: any) =>
            c.parc && c.parc.trim() === this.selectedParc.trim() && c.statut === 'ACTIF'
          ).length;
        } else {
          this.totalContrats = data.filter((c: any) => c.statut === 'ACTIF').length;
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  filterByParc(): void {
    const parc = this.selectedParc ? this.selectedParc.trim() : '';

    if (parc) {
      this.equipementsData = this.allEquipements.filter((e: any) =>
        e.parc && e.parc.trim() === parc
      );
      const equipIds = this.equipementsData.map((e: any) => e.id);
      this.interventionsData = this.allInterventions.filter((i: any) =>
        i.equipement && equipIds.includes(i.equipement.id)
      );
    } else {
      this.equipementsData = [...this.allEquipements];
      this.interventionsData = [...this.allInterventions];
    }

    this.calculateEquipStats(this.equipementsData);
    this.totalInterventions = this.interventionsData.length;

    const durees = this.interventionsData.filter((i: any) => i.dureeHeures).map((i: any) => i.dureeHeures);
    this.mttr = durees.length > 0 ? durees.reduce((a: number, b: number) => a + b, 0) / durees.length : 0;

    // Recharger les contrats avec token frais
    this.http.get<any[]>(`${environment.apiUrl}/contrats`).subscribe({
      next: (data) => {
        this.allContrats = data;
        if (parc) {
          this.totalContrats = data.filter((c: any) =>
            c.parc && c.parc.trim() === parc && c.statut === 'ACTIF'
          ).length;
        } else {
          this.totalContrats = data.filter((c: any) => c.statut === 'ACTIF').length;
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.cdr.detectChanges();
    this.rebuildCharts();
  }

  calculateEquipStats(data: any[]): void {
    this.totalEquipements = data.length;
    const enService = data.filter((e: any) => e.statut === 'EN_SERVICE').length;
    this.disponibilite = data.length > 0 ? Math.round((enService / data.length) * 100) : 0;
    this.totalInterventions = this.interventionsData.length;
  }

  rebuildCharts(): void {
    if (this.typeChart) this.typeChart.destroy();
    if (this.equipChart) this.equipChart.destroy();
    if (this.monthChart) this.monthChart.destroy();
    setTimeout(() => this.buildCharts(), 100);
  }

  buildCharts(): void {
    this.buildTypeChart();
    this.buildEquipChart();
    this.buildMonthChart();
  }

  buildTypeChart(): void {
    const canvas = document.getElementById('typeChart') as HTMLCanvasElement;
    if (!canvas) return;
    const preventif = this.interventionsData.filter(i => i.type === 'PREVENTIF').length;
    const correctif = this.interventionsData.filter(i => i.type === 'CORRECTIF').length;
    const maj = this.interventionsData.filter(i => i.type === 'MISE_A_JOUR').length;
    this.typeChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Préventif', 'Correctif', 'Mise à jour'],
        datasets: [{ data: [preventif, correctif, maj], backgroundColor: ['#66bb6a', '#ef5350', '#42a5f5'], borderWidth: 0 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  buildEquipChart(): void {
    const canvas = document.getElementById('equipChart') as HTMLCanvasElement;
    if (!canvas) return;
    const enService = this.equipementsData.filter((e: any) => e.statut === 'EN_SERVICE').length;
    const enMaint = this.equipementsData.filter((e: any) => e.statut === 'EN_MAINTENANCE').length;
    const enPanne = this.equipementsData.filter((e: any) => e.statut === 'EN_PANNE').length;
    const horsService = this.equipementsData.filter((e: any) => e.statut === 'HORS_SERVICE').length;
    this.equipChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['En service', 'Maintenance', 'En panne', 'Hors service'],
        datasets: [{ data: [enService, enMaint, enPanne, horsService], backgroundColor: ['#66bb6a', '#ffa726', '#ef5350', '#bdbdbd'], borderWidth: 0 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  buildMonthChart(): void {
    const canvas = document.getElementById('monthChart') as HTMLCanvasElement;
    if (!canvas) return;
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const counts = new Array(12).fill(0);
    this.interventionsData.forEach(i => {
      if (i.dateIntervention) {
        const month = new Date(i.dateIntervention).getMonth();
        counts[month]++;
      }
    });
    this.monthChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{ label: 'Interventions', data: counts, backgroundColor: '#1a237e', borderRadius: 8 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  navigateTo(path: string): void { this.router.navigate([path]); }
}