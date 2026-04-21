import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-optimisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './optimisation.component.html',
  styleUrl: './optimisation.component.scss'
})
export class OptimisationComponent implements OnInit, AfterViewInit {

  interventions: any[] = [];
  equipements: any[] = [];
  contrats: any[] = [];
  isLoading = true;

  stats = {
    coutTotal: 0,
    coutMoyen: 0,
    mttrMoyen: 0,
    tauxDisponibilite: 0,
    interventionsTerminees: 0,
    equipementsEnPanne: 0
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data;
        this.calculateStats();
        this.cdr.detectChanges();
        setTimeout(() => this.buildCharts(), 300);
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => {
        this.equipements = data;
        const enService = data.filter((e: any) => e.statut === 'EN_SERVICE').length;
        this.stats.tauxDisponibilite = data.length > 0 ? Math.round((enService / data.length) * 100) : 0;
        this.stats.equipementsEnPanne = data.filter((e: any) => e.statut === 'EN_PANNE').length;
        this.cdr.detectChanges();
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/contrats`).subscribe({
      next: (data) => {
        this.contrats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(): void {
    const couts = this.interventions.filter(i => i.coutTotal).map(i => i.coutTotal);
    this.stats.coutTotal = couts.reduce((a, b) => a + b, 0);
    this.stats.coutMoyen = couts.length > 0 ? this.stats.coutTotal / couts.length : 0;

    const durees = this.interventions.filter(i => i.dureeHeures).map(i => i.dureeHeures);
    this.stats.mttrMoyen = durees.length > 0 ? durees.reduce((a, b) => a + b, 0) / durees.length : 0;

    this.stats.interventionsTerminees = this.interventions.filter(i => i.statut === 'TERMINEE').length;
  }

  buildCharts(): void {
    this.buildPannesChart();
    this.buildStatutChart();
    this.buildContratsChart();
    this.buildMttrChart();
  }

  buildPannesChart(): void {
    const canvas = document.getElementById('pannesChart') as HTMLCanvasElement;
    if (!canvas) return;

    const types: Record<string, number> = {};
    this.interventions.forEach(i => {
      types[i.type] = (types[i.type] || 0) + 1;
    });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(types),
        datasets: [{
          label: 'Nombre',
          data: Object.values(types),
          backgroundColor: ['#ef5350', '#66bb6a', '#42a5f5'],
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

  buildStatutChart(): void {
    const canvas = document.getElementById('statutChart') as HTMLCanvasElement;
    if (!canvas) return;

    const statuts: Record<string, number> = {};
    this.interventions.forEach(i => {
      statuts[i.statut] = (statuts[i.statut] || 0) + 1;
    });

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statuts),
        datasets: [{
          data: Object.values(statuts),
          backgroundColor: ['#66bb6a', '#ffa726', '#ef5350'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  buildContratsChart(): void {
    const canvas = document.getElementById('contratsChart') as HTMLCanvasElement;
    if (!canvas) return;

    const actif = this.contrats.filter(c => c.statut === 'ACTIF').length;
    const expire = this.contrats.filter(c => c.statut === 'EXPIRE').length;
    const resilier = this.contrats.filter(c => c.statut === 'RESILIER').length;

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Actif', 'Expiré', 'Résilié'],
        datasets: [{
          data: [actif, expire, resilier],
          backgroundColor: ['#66bb6a', '#bdbdbd', '#ef5350'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  buildMttrChart(): void {
    const canvas = document.getElementById('mttrChart') as HTMLCanvasElement;
    if (!canvas) return;

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const mttrByMonth: number[] = new Array(12).fill(0);
    const countByMonth: number[] = new Array(12).fill(0);

    this.interventions.forEach(i => {
      if (i.dateIntervention && i.dureeHeures) {
        const month = new Date(i.dateIntervention).getMonth();
        mttrByMonth[month] += i.dureeHeures;
        countByMonth[month]++;
      }
    });

    const avgMttr = mttrByMonth.map((total, i) =>
      countByMonth[i] > 0 ? parseFloat((total / countByMonth[i]).toFixed(1)) : 0
    );

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'MTTR (h)',
          data: avgMttr,
          borderColor: '#1a237e',
          backgroundColor: 'rgba(26,35,126,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1a237e'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  getContratRentabilite(contrat: any): number {
    const coutMaint = this.interventions
      .filter(i => i.coutTotal)
      .reduce((a, b) => a + b.coutTotal, 0);
    if (!contrat.montant || contrat.montant === 0) return 0;
    return Math.round(((contrat.montant - coutMaint) / contrat.montant) * 100);
  }
}