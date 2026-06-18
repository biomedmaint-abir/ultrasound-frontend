import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chefpole-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1>📊 Performance équipe</h1>
      <p>Indicateurs opérationnels de l'équipe FSE</p>
    </div>
    <select [(ngModel)]="filterPeriode" (change)="applyFilter()" class="filter-select">
      <option value="mois">Ce mois</option>
      <option value="trimestre">Ce trimestre</option>
      <option value="annee">Cette année</option>
    </select>
  </div>

  <!-- 4 KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card blue">
      <div class="kpi-icon">⏱️</div>
      <div class="kpi-info"><h2>{{ mttr | number:'1.0-1' }}h</h2><p>MTTR moyen</p></div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-icon">✅</div>
      <div class="kpi-info"><h2>{{ tauxDispo }}%</h2><p>Taux de disponibilité</p></div>
    </div>
    <div class="kpi-card orange">
      <div class="kpi-icon">📋</div>
      <div class="kpi-info"><h2>{{ terminesMois }}</h2><p>Terminées ce mois</p></div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-icon">🔄</div>
      <div class="kpi-info"><h2>{{ enCours }}</h2><p>En cours</p></div>
    </div>
  </div>

  <div class="charts-grid">
    <!-- Graphique 1 — Pannes par type -->
    <div class="chart-card">
      <div class="chart-header"><h3>Interventions par type</h3></div>
      <div class="bar-chart">
        <div *ngFor="let item of typeData" class="bar-item">
          <div class="bar-label">{{ item.label }}</div>
          <div class="bar-track">
            <div class="bar-fill" [style.width]="getBarWidth(item.value, maxType) + '%'" [style.background]="item.color"></div>
            <span class="bar-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique 2 — Performance par FSE -->
    <div class="chart-card">
      <div class="chart-header"><h3>Interventions terminées par FSE</h3></div>
      <div class="bar-chart">
        <div *ngFor="let item of fseData" class="bar-item">
          <div class="bar-label">{{ item.label }}</div>
          <div class="bar-track">
            <div class="bar-fill" [style.width]="getBarWidth(item.value, maxFse) + '%'" style="background:#1C2B5A"></div>
            <span class="bar-value">{{ item.value }}</span>
          </div>
        </div>
        <div *ngIf="fseData.length === 0" class="empty-chart">Aucune donnée</div>
      </div>
    </div>
  </div>

  <!-- Graphique 3 — MTTR par mois -->
  <div class="chart-card full-width">
    <div class="chart-header"><h3>Évolution du MTTR par mois (heures)</h3></div>
    <div class="line-chart">
      <div class="line-chart-inner">
        <div *ngFor="let item of mttrData; let i = index" class="line-point-col">
          <div class="line-bar-wrap">
            <div class="line-bar" [style.height]="getBarHeight(item.value, maxMttr) + '%'" [style.background]="item.value > 0 ? '#1C2B5A' : '#e2e6f0'"></div>
          </div>
          <div class="line-label">{{ item.label }}</div>
          <div class="line-value" *ngIf="item.value > 0">{{ item.value | number:'1.0-1' }}h</div>
        </div>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:1100px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:0;font-size:13px;color:#6b7280}}
.filter-select{padding:10px 16px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:13px;color:#0d1340;background:white;outline:none}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.kpi-card{background:white;border-radius:14px;padding:20px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);border-top:3px solid transparent}
.kpi-card.blue{border-top-color:#1a2eff}.kpi-card.green{border-top-color:#16A34A}.kpi-card.orange{border-top-color:#f97316}.kpi-card.purple{border-top-color:#7C3AED}
.kpi-icon{font-size:24px}
.kpi-info h2{margin:0;font-size:22px;font-weight:800;color:#0d1340}
.kpi-info p{margin:4px 0 0;font-size:12px;color:#6b7280}
.charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.chart-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.full-width{grid-column:span 2}
.chart-header h3{margin:0 0 20px;font-size:15px;font-weight:700;color:#0d1340}
.bar-chart{display:flex;flex-direction:column;gap:12px}
.bar-item{display:flex;align-items:center;gap:10px}
.bar-label{font-size:12px;color:#6b7280;width:120px;flex-shrink:0;text-align:right}
.bar-track{flex:1;height:24px;background:#f1f3f5;border-radius:6px;position:relative;display:flex;align-items:center}
.bar-fill{height:100%;border-radius:6px;transition:width .5s ease;min-width:2px}
.bar-value{position:absolute;right:8px;font-size:12px;font-weight:700;color:#0d1340}
.empty-chart{text-align:center;color:#9CA3AF;font-size:13px;padding:20px}
.line-chart{overflow-x:auto}
.line-chart-inner{display:flex;align-items:flex-end;gap:8px;height:160px;padding:0 8px}
.line-point-col{display:flex;flex-direction:column;align-items:center;flex:1;min-width:40px}
.line-bar-wrap{height:120px;display:flex;align-items:flex-end;width:100%}
.line-bar{width:100%;border-radius:4px 4px 0 0;transition:height .5s ease;min-height:2px}
.line-label{font-size:10px;color:#6b7280;margin-top:4px;text-align:center}
.line-value{font-size:9px;color:#1C2B5A;font-weight:700}
  `]
})
export class ChefPolePerformanceComponent implements OnInit {
  filterPeriode = 'mois';
  allInterventions: any[] = [];
  allEquipements: any[] = [];
  filtered: any[] = [];

  mttr = 0;
  tauxDispo = 0;
  terminesMois = 0;
  enCours = 0;

  typeData: any[] = [];
  fseData: any[] = [];
  mttrData: any[] = [];

  maxType = 1;
  maxFse = 1;
  maxMttr = 1;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => { this.allInterventions = data; this.applyFilter(); }
    });
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => { this.allEquipements = data; this.calcTauxDispo(); }
    });
  }

  applyFilter(): void {
    const now = new Date();
    this.filtered = this.allInterventions.filter(i => {
      const d = new Date(i.dateIntervention);
      if (this.filterPeriode === 'mois') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (this.filterPeriode === 'trimestre') {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    });
    this.calcKpis();
    this.calcTypeData();
    this.calcFseData();
    this.calcMttrData();
    this.cdr.detectChanges();
  }

  calcKpis(): void {
    const terminees = this.filtered.filter(i => i.statut === 'TERMINEE');
    const avecDuree = terminees.filter(i => i.dureeHeures);
    this.mttr = avecDuree.length > 0 ? avecDuree.reduce((s, i) => s + i.dureeHeures, 0) / avecDuree.length : 0;
    const now = new Date();
    this.terminesMois = this.allInterventions.filter(i => {
      const d = new Date(i.dateIntervention);
      return i.statut === 'TERMINEE' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    this.enCours = this.allInterventions.filter(i => i.statut === 'EN_COURS').length;
    this.calcTauxDispo();
  }

  calcTauxDispo(): void {
    if (!this.allEquipements.length) return;
    const op = this.allEquipements.filter(e => e.statut === 'EN_SERVICE').length;
    this.tauxDispo = Math.round((op / this.allEquipements.length) * 100);
  }

  calcTypeData(): void {
    const types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];
    const colors = ['#16A34A', '#DC2626', '#1a2eff'];
    const labels = ['Préventif', 'Correctif', 'Mise à jour'];
    this.typeData = types.map((t, i) => ({
      label: labels[i],
      value: this.filtered.filter(inv => inv.type === t).length,
      color: colors[i]
    }));
    this.maxType = Math.max(1, ...this.typeData.map(d => d.value));
  }

  calcFseData(): void {
    const fseMap: {[key: string]: number} = {};
    this.filtered.filter(i => i.statut === 'TERMINEE' && i.nomFse).forEach(i => {
      fseMap[i.nomFse] = (fseMap[i.nomFse] || 0) + 1;
    });
    this.fseData = Object.entries(fseMap).map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => b.value - a.value);
    this.maxFse = Math.max(1, ...this.fseData.map(d => d.value));
  }

  calcMttrData(): void {
    const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const now = new Date();
    this.mttrData = moisLabels.map((label, idx) => {
      const inv = this.allInterventions.filter(i => {
        const d = new Date(i.dateIntervention);
        return d.getMonth() === idx && d.getFullYear() === now.getFullYear() && i.dureeHeures;
      });
      const avg = inv.length > 0 ? inv.reduce((s, i) => s + i.dureeHeures, 0) / inv.length : 0;
      return { label, value: avg };
    });
    this.maxMttr = Math.max(1, ...this.mttrData.map(d => d.value));
  }

  getBarWidth(val: number, max: number): number { return max > 0 ? Math.round((val / max) * 90) : 0; }
  getBarHeight(val: number, max: number): number { return max > 0 ? Math.round((val / max) * 100) : 0; }
}
