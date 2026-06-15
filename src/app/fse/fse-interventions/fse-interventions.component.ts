import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-interventions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header"><h1>Mes Interventions</h1><p>{{ filtered.length }} intervention(s)</p></div>
  <div class="filter-card">
    <div class="search-wrap"><span>🔍</span><input type="text" [(ngModel)]="search" (input)="applyFilter()" placeholder="Rechercher par équipement ou site..." class="search-input"></div>
    <select [(ngModel)]="filterStatut" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les statuts</option>
      <option value="EN_ATTENTE">En attente</option>
      <option value="EN_COURS">En cours</option>
      <option value="EN_ATTENTE_PIECE">En attente pièce</option>
      <option value="EN_ATTENTE_VALIDATION">En attente validation</option>
      <option value="TERMINEE">Terminée</option>
    </select>
    <select [(ngModel)]="filterType" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les types</option>
      <option value="CORRECTIF">Correctif</option>
      <option value="PREVENTIF">Préventif</option>
      <option value="MISE_A_JOUR">Mise à jour</option>
    </select>
    <select [(ngModel)]="filterPeriode" (change)="applyFilter()" class="filter-select">
      <option value="">Toutes les périodes</option>
      <option value="today">Aujourd'hui</option>
      <option value="7">7 derniers jours</option>
      <option value="30">30 derniers jours</option>
    </select>
  </div>

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>
  <div *ngIf="filtered.length === 0 && !isLoading" class="empty-state"><p>Aucune intervention trouvée.</p></div>

  <div class="interventions-list" *ngIf="!isLoading && filtered.length > 0">
    <div *ngFor="let inv of filtered" class="inv-card" [class.urgent]="inv.type === 'CORRECTIF' && inv.statut === 'EN_COURS'">
      <div class="inv-card-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ formatMonth(inv.dateIntervention) }}</span>
          <span class="date-day">{{ formatDay(inv.dateIntervention) }}</span>
        </div>
      </div>
      <div class="inv-card-center">
        <div class="inv-top">
          <span *ngIf="inv.type === 'CORRECTIF' && inv.statut === 'EN_COURS'" class="urgent-badge">🚨 URGENT</span>
          <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
          <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)"><span class="dot"></span>{{ inv.statut }}</span>
        </div>
        <div class="inv-equip">{{ inv.equipement?.nom || '—' }}<span *ngIf="inv.equipement?.parc"> — {{ inv.equipement.parc }}</span></div>
        <div class="inv-desc" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</div>
        <div class="inv-meta">
          <span>📅 {{ formatDateFr(inv.dateIntervention) }}</span>
          <span *ngIf="inv.dureeHeures">⏱ {{ inv.dureeHeures }}h</span>
        </div>
      </div>
      <div class="inv-card-right">
        <button class="btn-voir" (click)="router.navigate(['/fse/cloture', inv.id])"
          *ngIf="inv.statut !== 'TERMINEE' && inv.statut !== 'EN_ATTENTE_VALIDATION'">
          🔧 Clôturer
        </button>
        <button class="btn-bloquer" (click)="ouvrirMotif(inv)"
          *ngIf="inv.statut !== 'TERMINEE' && inv.statut !== 'EN_ATTENTE_VALIDATION'">
          🚫 Je ne peux pas
        </button>
        <span *ngIf="inv.statut === 'EN_ATTENTE_VALIDATION'" class="validation-label">⏳ En attente admin</span>
        <span *ngIf="inv.statut === 'TERMINEE'" class="done-label">✅ Terminée</span>
      </div>
    </div>
  </div>
</div>

<div class="modal-overlay" *ngIf="showMotifModal" (click)="showMotifModal = false">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <h2>🚫 Je ne peux pas intervenir</h2>
    <p>Intervention #{{ selectedInv?.id }} — {{ selectedInv?.equipement?.nom }}</p>
    <div class="field-wrapper">
      <label>Motif obligatoire</label>
      <select [(ngModel)]="motifSelectionne" class="filter-select" style="width:100%">
        <option value="">-- Sélectionner un motif --</option>
        <option value="Client absent">Client absent</option>
        <option value="Acces refuse">Accès refusé</option>
        <option value="Piece manquante">Pièce manquante</option>
        <option value="Probleme vehicule">Problème véhicule</option>
        <option value="Autre">Autre</option>
      </select>
    </div>
    <div class="field-wrapper" style="margin-top:12px" *ngIf="motifSelectionne === 'Autre'">
      <label>Précisez</label>
      <input type="text" [(ngModel)]="motifAutre" placeholder="Décrivez le motif..." style="padding:10px 14px;border:1.5px solid #e2e6f0;border-radius:10px;width:100%;box-sizing:border-box;font-size:14px;outline:none">
    </div>
    <div *ngIf="motifSucces" style="background:#DCFCE7;color:#16A34A;padding:10px 14px;border-radius:8px;margin-top:12px;font-size:13px">✅ {{ motifSucces }}</div>
    <div class="modal-actions">
      <button class="btn-cancel" (click)="showMotifModal = false">Annuler</button>
      <button class="btn-submit" (click)="soumettreBlocage()" [disabled]="!motifSelectionne || isSavingMotif">
        {{ isSavingMotif ? 'Envoi...' : 'Confirmer' }}
      </button>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:1000px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px}h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:0;font-size:13px;color:#6b7280}
.filter-card{display:flex;gap:12px;flex-wrap:wrap;background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.search-wrap{display:flex;align-items:center;gap:8px;flex:1;min-width:200px;background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:10px;padding:0 14px;height:44px}
.search-input{flex:1;border:none;outline:none;font-size:14px;background:transparent}
.filter-select{padding:10px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:13px;color:#0d1340;background:white;outline:none;min-width:130px}
.interventions-list{display:flex;flex-direction:column;gap:12px}
.inv-card{background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;align-items:center;gap:16px;transition:box-shadow .2s}
.inv-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
.inv-card.urgent{border-left:4px solid #DC2626;background:#FFFAFA}
.date-block{display:flex;flex-direction:column;align-items:center;padding:10px 14px;border-radius:10px;min-width:56px;text-align:center;flex-shrink:0}
.date-month{font-size:10px;font-weight:700;text-transform:uppercase}.date-day{font-size:22px;font-weight:800;line-height:1.1}
.type-correctif{background:#FEE2E2;color:#DC2626}.type-preventif{background:#DCFCE7;color:#16A34A}.type-maj{background:#DBEAFE;color:#1a2eff}
.inv-card-center{flex:1}
.inv-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.urgent-badge{background:#DC2626;color:white;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700}
.type-badge{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.statut-terminee{background:#DCFCE7;color:#16A34A}.statut-en_cours{background:#DBEAFE;color:#1D4ED8}.statut-en_attente{background:#FEF9C3;color:#CA8A04}.statut-en_attente_validation{background:#F3E8FF;color:#7C3AED}.statut-en_attente_piece{background:#FEE2E2;color:#DC2626}
.inv-equip{font-size:14px;font-weight:700;color:#0d1340;margin-bottom:4px}
.inv-desc{font-size:12px;color:#6b7280;margin-bottom:4px}
.inv-meta{display:flex;gap:16px;font-size:12px;color:#9CA3AF}
.inv-card-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.btn-voir{background:#1a2eff;color:white;border:none;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.btn-bloquer{background:white;color:#DC2626;border:1.5px solid #DC2626;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
.btn-bloquer:hover{background:#FEF2F2}
.validation-label{font-size:12px;color:#7C3AED;font-weight:600}.done-label{font-size:12px;color:#16A34A;font-weight:600}
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal-card{background:white;border-radius:16px;padding:28px;width:480px;max-width:90%;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.modal-card h2{margin:0 0 8px;font-size:18px;font-weight:800;color:#0d1340}
.modal-card p{margin:0 0 20px;font-size:13px;color:#6b7280}
.field-wrapper{display:flex;flex-direction:column;gap:8px}label{font-size:13px;font-weight:600;color:#0d1340}
.modal-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:20px}
.btn-cancel{background:white;border:1.5px solid #e2e6f0;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;color:#0d1340;cursor:pointer}
.btn-submit{background:#1a2eff;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer}
.btn-submit:disabled{opacity:.6;cursor:not-allowed}
.empty-state,.center-state{text-align:center;padding:48px;color:#9CA3AF;font-size:14px;background:white;border-radius:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
  `]
})
export class FseInterventionsComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  userId = Number(localStorage.getItem('userId')) || 0;
  interventions: any[] = [];
  filtered: any[] = [];
  search = ''; filterStatut = ''; filterType = ''; filterPeriode = '';
  isLoading = true;
  showMotifModal = false;
  selectedInv: any = null;
  motifSelectionne = '';
  motifAutre = '';
  isSavingMotif = false;
  motifSucces = '';

  constructor(private http: HttpClient, public router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data.filter(i =>
          i.technicien?.id === this.userId ||
          i.nomFse === this.prenom ||
          i.nomFse === this.nom ||
          i.nomFse === this.email
        ).sort((a, b) => new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime());
        this.filtered = [...this.interventions];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    this.filtered = this.interventions.filter(i => {
      const matchSearch = !this.search ||
        i.equipement?.nom?.toLowerCase().includes(this.search.toLowerCase()) ||
        i.equipement?.parc?.toLowerCase().includes(this.search.toLowerCase());
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      const matchType = !this.filterType || i.type === this.filterType;
      let matchPeriode = true;
      if (this.filterPeriode === 'today') {
        matchPeriode = i.dateIntervention?.startsWith(todayStr);
      } else if (this.filterPeriode) {
        const days = Number(this.filterPeriode);
        const limit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        matchPeriode = new Date(i.dateIntervention) >= limit;
      }
      return matchSearch && matchStatut && matchType && matchPeriode;
    });
  }

  ouvrirMotif(inv: any): void {
    this.selectedInv = inv;
    this.motifSelectionne = '';
    this.motifAutre = '';
    this.motifSucces = '';
    this.showMotifModal = true;
  }

  soumettreBlocage(): void {
    if (!this.motifSelectionne) return;
    this.isSavingMotif = true;
    const motif = this.motifSelectionne === 'Autre' ? this.motifAutre : this.motifSelectionne;
    const payload = {
      id: this.selectedInv.id,
      dateIntervention: this.selectedInv.dateIntervention,
      type: this.selectedInv.type,
      statut: 'EN_COURS',
      descriptionPanne: this.selectedInv.descriptionPanne,
      nomFse: this.selectedInv.nomFse,
      commentaireRejet: 'BLOCAGE FSE: ' + motif,
      equipement: this.selectedInv.equipement ? { id: this.selectedInv.equipement.id } : null,
      technicien: this.selectedInv.technicien ? { id: this.selectedInv.technicien.id } : null
    };
    this.http.put(`${environment.apiUrl}/interventions/${this.selectedInv.id}`, payload).subscribe({
      next: () => {
        this.isSavingMotif = false;
        this.motifSucces = 'Signalement envoyé à l\'administrateur !';
        setTimeout(() => { this.showMotifModal = false; this.ngOnInit(); }, 2000);
      },
      error: () => { this.isSavingMotif = false; }
    });
  }

  formatMonth(date: string): string {
    if (!date) return '';
    const mois = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    return mois[new Date(date).getMonth()];
  }
  formatDay(date: string): string { return date ? String(new Date(date).getDate()).padStart(2, '0') : '—'; }
  formatDateFr(date: string): string {
    if (!date) return '—';
    const mois = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    const d = new Date(date);
    return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
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
