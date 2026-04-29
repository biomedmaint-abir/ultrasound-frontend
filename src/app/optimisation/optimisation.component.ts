import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-optimisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './optimisation.component.html',
  styleUrl: './optimisation.component.scss'
})
export class OptimisationComponent implements OnInit, AfterViewInit {

  interventions: any[] = [];
  equipements: any[] = [];
  contrats: any[] = [];
  piecesParParc: any[] = [];
  parcsList: string[] = [];
  parcsAffiches: string[] = [];
  isLoading = true;
  anneeSelectionnee = new Date().getFullYear();
  parcSelectionne = '';
  annees: number[] = [];

  stats = {
    coutTotal: 0,
    coutMoyen: 0,
    mttrMoyen: 0,
    tauxDisponibilite: 0,
    interventionsTerminees: 0,
    equipementsEnPanne: 0,
    roi: 0,
    rentabilite: 0
  };

  piecesChart: any;

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

        // Générer les années dynamiquement depuis les interventions réelles
        const anneesInterventions = data
          .filter(i => i.dateIntervention)
          .map(i => new Date(i.dateIntervention).getFullYear());
        const currentYear = new Date().getFullYear();
        const minYear = Math.min(2024, ...anneesInterventions);
        const maxYear = Math.max(currentYear + 1, ...anneesInterventions);
        this.annees = [];
        for (let y = minYear; y <= maxYear; y++) {
          this.annees.push(y);
        }
        this.anneeSelectionnee = currentYear;

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
        this.calculateROI();
        this.cdr.detectChanges();
      }
    });

    this.loadPiecesParParc();
  }

  calculateStats(): void {
    const couts = this.interventions.filter(i => i.coutTotal).map(i => Number(i.coutTotal));
    this.stats.coutTotal = couts.reduce((a, b) => a + b, 0);
    this.stats.coutMoyen = couts.length > 0 ? this.stats.coutTotal / couts.length : 0;

    const durees = this.interventions.filter(i => i.dureeHeures).map(i => i.dureeHeures);
    this.stats.mttrMoyen = durees.length > 0 ? durees.reduce((a, b) => a + b, 0) / durees.length : 0;

    this.stats.interventionsTerminees = this.interventions.filter(i => i.statut === 'TERMINEE').length;
  }

  calculateROI(): void {
    const montantTotal = this.contrats
      .filter(c => c.statut === 'ACTIF' && c.montant)
      .reduce((a, b) => a + Number(b.montant), 0);

    if (this.stats.coutTotal > 0 && montantTotal > 0) {
      this.stats.roi = Math.round(((montantTotal - this.stats.coutTotal) / this.stats.coutTotal) * 100);
      this.stats.rentabilite = Math.round(((montantTotal - this.stats.coutTotal) / montantTotal) * 100);
    }
    this.cdr.detectChanges();
  }

  loadPiecesParParc(): void {
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (equips) => {
        const parcsEquip = [...new Set(equips.map((e: any) => e.parc).filter((p: any) => p))] as string[];
        this.http.get<any[]>(`${environment.apiUrl}/statistiques/pieces-par-parc?annee=${this.anneeSelectionnee}`).subscribe({
          next: (data) => {
            this.piecesParParc = data;
            this.parcsList = parcsEquip;
            this.parcsAffiches = [...this.parcsList];
            this.parcSelectionne = '';
            this.cdr.detectChanges();
            setTimeout(() => this.buildPiecesChart(), 300);
          },
          error: () => {}
        });
      }
    });
  }

  filterParc(): void {
    if (this.parcSelectionne) {
      this.parcsAffiches = [this.parcSelectionne];
    } else {
      this.parcsAffiches = [...this.parcsList];
    }
    this.cdr.detectChanges();
    setTimeout(() => this.buildPiecesChart(), 100);
  }

  getPiecesForParc(parc: string): any[] {
    return this.piecesParParc.filter(p => p.parc === parc);
  }

  getContratRentabilite(contrat: any): number {
    const coutMaint = this.stats.coutTotal;
    if (!contrat.montant || contrat.montant === 0 || coutMaint === 0) return 0;
    return Math.round(((Number(contrat.montant) - coutMaint) / Number(contrat.montant)) * 100);
  }

  buildCharts(): void {
    this.buildPannesChart();
    this.buildStatutChart();
    this.buildContratsChart();
    this.buildMttrChart();
  }

  buildPiecesChart(): void {
    if (this.piecesChart) this.piecesChart.destroy();
    const canvas = document.getElementById('piecesChart') as HTMLCanvasElement;
    if (!canvas) return;
    const dataFiltered = this.parcSelectionne
      ? this.piecesParParc.filter(p => p.parc === this.parcSelectionne)
      : this.piecesParParc;
    if (dataFiltered.length === 0) return;
    const labels = dataFiltered.map(p => `${p.parc} - ${p.piece}`);
    const data = dataFiltered.map(p => p.pourcentage);
    const colors = ['#1a237e','#1565c0','#42a5f5','#90caf9','#ef5350','#ff7043','#66bb6a','#26a69a','#ab47bc','#ffa726','#8d6e63'];
    this.piecesChart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ label: '% utilisation', data, backgroundColor: colors.slice(0, data.length), borderRadius: 8 }] },
      options: {
        responsive: true, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw}% — Coût: ${dataFiltered[ctx.dataIndex]?.coutTotal} DH` } } },
        scales: { x: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } } }
      }
    });
  }

  buildPannesChart(): void {
    const canvas = document.getElementById('pannesChart') as HTMLCanvasElement;
    if (!canvas) return;
    const types: Record<string, number> = {};
    this.interventions.forEach(i => { types[i.type] = (types[i.type] || 0) + 1; });
    new Chart(canvas, {
      type: 'bar',
      data: { labels: Object.keys(types), datasets: [{ label: 'Nombre', data: Object.values(types), backgroundColor: ['#ef5350', '#66bb6a', '#42a5f5'], borderRadius: 8 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  buildStatutChart(): void {
    const canvas = document.getElementById('statutChart') as HTMLCanvasElement;
    if (!canvas) return;
    const statuts: Record<string, number> = {};
    this.interventions.forEach(i => { statuts[i.statut] = (statuts[i.statut] || 0) + 1; });
    new Chart(canvas, {
      type: 'doughnut',
      data: { labels: Object.keys(statuts), datasets: [{ data: Object.values(statuts), backgroundColor: ['#66bb6a', '#ffa726', '#ef5350'], borderWidth: 0 }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
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
      data: { labels: ['Actif', 'Expiré', 'Résilié'], datasets: [{ data: [actif, expire, resilier], backgroundColor: ['#66bb6a', '#bdbdbd', '#ef5350'], borderWidth: 0 }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
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
    const avgMttr = mttrByMonth.map((total, i) => countByMonth[i] > 0 ? parseFloat((total / countByMonth[i]).toFixed(1)) : 0);
    new Chart(canvas, {
      type: 'line',
      data: { labels: months, datasets: [{ label: 'MTTR (h)', data: avgMttr, borderColor: '#1a237e', backgroundColor: 'rgba(26,35,126,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#1a237e' }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
}