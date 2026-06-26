import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-historique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Mon Historique</h1>
    <p>Traçabilité de toutes mes interventions</p>
  </div>

  <div class="kpi-row">
    <div class="kpi-card blue">
      <div class="kpi-icon">⚙</div>
      <div><div class="kpi-value">{{ interventions.length }}</div><div class="kpi-label">Total</div></div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-icon">✅</div>
      <div><div class="kpi-value">{{ getCount('TERMINEE') }}</div><div class="kpi-label">Terminées</div></div>
    </div>
    <div class="kpi-card orange">
      <div class="kpi-icon">⚙️</div>
      <div><div class="kpi-value">{{ getCount('EN_COURS') }}</div><div class="kpi-label">En cours</div></div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-icon">⏱️</div>
      <div><div class="kpi-value">{{ getMttr() }}h</div><div class="kpi-label">Durée moy.</div></div>
    </div>
  </div>

  <div class="filter-card">
    <div class="search-wrap">
      <span>🔍</span>
      <input type="text" [(ngModel)]="search" (input)="applyFilter()" placeholder="Rechercher une intervention..." class="search-input">
    </div>
    <select [(ngModel)]="filterType" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les types</option>
      <option value="CORRECTIF">Correctif</option>
      <option value="PREVENTIF">Préventif</option>
      <option value="MISE_A_JOUR">Mise à jour</option>
    </select>
    <select [(ngModel)]="filterStatut" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les statuts</option>
      <option value="TERMINEE">Terminée</option>
      <option value="EN_COURS">En cours</option>
      <option value="EN_ATTENTE">En attente</option>
      <option value="EN_ATTENTE_VALIDATION">En attente validation</option>
    </select>
    <select [(ngModel)]="filterPeriode" (change)="applyFilter()" class="filter-select">
      <option value="">Toutes les périodes</option>
      <option value="7">7 derniers jours</option>
      <option value="30">30 derniers jours</option>
      <option value="90">3 derniers mois</option>
      <option value="365">Cette année</option>
    </select>
  </div>

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>

  <div *ngIf="filtered.length === 0 && !isLoading" class="empty-state">
    <p>📋 Aucune intervention trouvée.</p>
  </div>

  <div class="timeline" *ngIf="!isLoading">
    <div *ngFor="let inv of filtered; let i = index" class="timeline-item">
      <div class="timeline-left">
        <div class="timeline-icon" [ngClass]="getTypeClass(inv.type)">🔧</div>
        <div class="timeline-dot" [ngClass]="getTypeClass(inv.type)"></div>
        <div class="timeline-line"></div>
      </div>
      <div class="timeline-card">
        <div class="card-header">
          <div class="card-left">
            <span class="inv-id">#{{ i + 1 }}</span>
            <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
            <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)">
              <span class="dot"></span>{{ inv.statut }}
            </span>
          </div>
          <span class="card-date">📅 {{ inv.dateIntervention | date:'dd/MM/yyyy' }}</span>
        </div>
        <div class="card-equip">
          <span class="equip-name">🔬 {{ inv.equipement?.nom || '—' }}</span>
          <span class="equip-parc" *ngIf="inv.equipement?.parc">— {{ inv.equipement.parc }}</span>
        </div>
        <p class="description" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</p>
        <div class="actions" *ngIf="inv.actionsEffectuees">
          <span class="actions-label">🔧 Actions :</span>
          <span class="actions-text">{{ inv.actionsEffectuees }}</span>
        </div>
        <div class="card-footer" *ngIf="inv.dureeHeures">
          <span class="duree">⏱ {{ inv.dureeHeures }}h</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}
p{margin:4px 0 0;color:#6b7280;font-size:13px}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.kpi-card{background:white;border-radius:16px;padding:16px 20px;box-shadow:0 1px 8px rgba(0,0,0,.06);display:flex;align-items:center;gap:12px}
.kpi-icon{font-size:24px}
.kpi-value{font-size:22px;font-weight:800;color:#0d1340}
.kpi-label{font-size:12px;color:#6b7280}
.blue{border-top:4px solid #1a2eff}.green{border-top:4px solid #16A34A}.orange{border-top:4px solid #f97316}.purple{border-top:4px solid #7C3AED}
.filter-card{display:flex;gap:12px;flex-wrap:wrap;background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.search-wrap{display:flex;align-items:center;gap:8px;flex:1;min-width:200px;background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:10px;padding:0 14px;height:44px}
.search-input{flex:1;border:none;outline:none;font-size:14px;background:transparent}
.filter-select{padding:10px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:13px;color:#0d1340;background:white;outline:none;min-width:130px}
.timeline{display:flex;flex-direction:column}
.timeline-item{display:flex;gap:12px;margin-bottom:4px}
.timeline-left{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:44px}
.timeline-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px}
.type-correctif{background:#FEE2E2;color:#DC2626}.type-preventif{background:#DCFCE7;color:#16A34A}.type-maj{background:#DBEAFE;color:#1a2eff}
.timeline-dot{width:8px;height:8px;border-radius:50%;margin:4px 0}
.timeline-line{width:2px;flex:1;min-height:20px;background:#e2e6f0}
.timeline-item:last-child .timeline-line{display:none}
.timeline-card{flex:1;background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,.06);margin-bottom:12px}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.card-left{display:flex;align-items:center;gap:8px}
.inv-id{font-weight:800;color:#0d1340;font-size:14px}
.type-badge{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.statut-terminee{background:#DCFCE7;color:#16A34A}
.statut-en_cours{background:#DBEAFE;color:#1D4ED8}
.statut-en_attente{background:#FEF9C3;color:#CA8A04}
.statut-en_attente_validation{background:#F3E8FF;color:#7C3AED}
.statut-en_attente_piece{background:#FEE2E2;color:#DC2626}
.card-date{font-size:12px;color:#6b7280}
.card-equip{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.equip-name{font-size:14px;font-weight:600;color:#0d1340}
.equip-parc{font-size:13px;color:#6b7280}
.description{margin:0 0 8px;font-size:13px;color:#374151}
.actions{display:flex;gap:6px;align-items:flex-start;margin-bottom:8px}
.actions-label{font-size:12px;font-weight:600;color:#6b7280;flex-shrink:0}
.actions-text{font-size:12px;color:#374151}
.card-footer{display:flex;gap:16px}
.duree{font-size:12px;color:#6b7280;font-weight:500}
.empty-state,.center-state{text-align:center;padding:48px;color:#9CA3AF;font-size:14px;background:white;border-radius:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
  `]
})
export class FseHistoriqueComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  userId = Number(localStorage.getItem('userId')) || 0;
  interventions: any[] = [];
  filtered: any[] = [];
  search = ''; filterType = ''; filterStatut = ''; filterPeriode = '';
  isLoading = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data.filter(i =>
          i.technicien?.id === this.userId ||
          i.nomFse === this.prenom ||
          i.nomFse === this.nom ||
          i.nomFse === this.email ||
          i.nomFse === (this.prenom + ' ' + this.nom).trim() ||
          i.nomFse === (this.nom + ' ' + this.prenom).trim()
        );
        this.filtered = [...this.interventions];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const now = new Date();
    this.filtered = this.interventions.filter(i => {
      const matchSearch = !this.search ||
        i.equipement?.nom?.toLowerCase().includes(this.search.toLowerCase()) ||
        i.dateIntervention?.includes(this.search);
      const matchType = !this.filterType || i.type === this.filterType;
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      let matchPeriode = true;
      if (this.filterPeriode) {
        const days = Number(this.filterPeriode);
        const limit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        matchPeriode = new Date(i.dateIntervention) >= limit;
      }
      return matchSearch && matchType && matchStatut && matchPeriode;
    });
  }

  getCount(statut: string): number { return this.interventions.filter(i => i.statut === statut).length; }
  getMttr(): string {
    const termine = this.interventions.filter(i => i.dureeHeures);
    if (!termine.length) return '0';
    return (termine.reduce((a, i) => a + i.dureeHeures, 0) / termine.length).toFixed(1);
  }
  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : t === 'PREVENTIF' ? 'type-preventif' : 'type-maj'; }
  getStatutClass(s: string): string {
    switch(s) {
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_COURS': return 'statut-en_cours';
      case 'EN_ATTENTE': return 'statut-en_attente';
      case 'EN_ATTENTE_VALIDATION': return 'statut-en_attente_validation';
      case 'EN_ATTENTE_PIECE': return 'statut-en_attente_piece';
      default: return 'statut-en_attente';
    }
  }
}
