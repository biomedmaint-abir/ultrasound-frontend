import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  imports: [CommonModule, DatePipe],
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

  interventionsData: any[] = [];
  equipementsData: any[] = [];

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
        this.totalInterventions = data.length;
        this.interventionsData = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.equipementService.getAll().subscribe({
      next: (data) => {
        this.totalEquipements = data.length;
        this.equipementsData = data;
        const enService = data.filter((e: any) => e.statut === 'EN_SERVICE').length;
        this.disponibilite = data.length > 0 ? Math.round((enService / data.length) * 100) : 0;
        this.cdr.detectChanges();
        setTimeout(() => this.buildCharts(), 300);
      },
      error: () => {}
    });

    this.http.get<any[]>(`${environment.apiUrl}/contrats`).subscribe({
      next: (data) => {
        this.totalContrats = data.filter((c: any) => c.statut === 'ACTIF').length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });

    this.interventionService.getMTTR().subscribe({
      next: (data) => { this.mttr = data ?? 0; this.cdr.detectChanges(); },
      error: () => { this.mttr = 0; }
    });
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

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Préventif', 'Correctif', 'Mise à jour'],
        datasets: [{
          data: [preventif, correctif, maj],
          backgroundColor: ['#66bb6a', '#ef5350', '#42a5f5'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  buildEquipChart(): void {
    const canvas = document.getElementById('equipChart') as HTMLCanvasElement;
    if (!canvas) return;
    const enService = this.equipementsData.filter((e: any) => e.statut === 'EN_SERVICE').length;
    const enMaint = this.equipementsData.filter((e: any) => e.statut === 'EN_MAINTENANCE').length;
    const enPanne = this.equipementsData.filter((e: any) => e.statut === 'EN_PANNE').length;
    const horsService = this.equipementsData.filter((e: any) => e.statut === 'HORS_SERVICE').length;

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['En service', 'Maintenance', 'En panne', 'Hors service'],
        datasets: [{
          data: [enService, enMaint, enPanne, horsService],
          backgroundColor: ['#66bb6a', '#ffa726', '#ef5350', '#bdbdbd'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
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

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Interventions',
          data: counts,
          backgroundColor: '#1a237e',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  navigateTo(path: string): void { this.router.navigate([path]); }
}