import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-backoffice-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1>Planning des maintenances</h1>
      <p>{{ filtered.length }} intervention(s)</p>
    </div>
    <button class="btn-new" (click)="showForm = !showForm">+ Nouvelle intervention</button>
  </div>

  <!-- Formulaire création -->
  <div class="form-card" *ngIf="showForm">
    <div class="section-header"><div class="section-icon">📋</div><h2>Créer une intervention</h2></div>
    <div *ngIf="successMsg" class="success-banner">✅ {{ successMsg }}</div>
    <div *ngIf="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>
    <div class="form-grid">
      <div class="field-wrapper">
        <label>Équipement *</label>
        <select [(ngModel)]="form.equipementId" class="form-select">
          <option [ngValue]="null">-- Sélectionner --</option>
          <option *ngFor="let e of equipements" [ngValue]="e.id">{{ e.nom }} — {{ e.parc }}</option>
        </select>
      </div>
      <div class="field-wrapper">
        <label>Type *</label>
        <select [(ngModel)]="form.type" class="form-select">
          <option value="">-- Sélectionner --</option>
          <option value="CORRECTIF">Correctif</option>
          <option value="PREVENTIF">Préventif</option>
        </select>
      </div>
      <div class="field-wrapper">
        <label>Date *</label>
        <input type="date" [(ngModel)]="form.date" class="form-input">
      </div>
      <div class="field-wrapper full-width">
        <label>Description</label>
        <textarea [(ngModel)]="form.description" rows="3" class="form-textarea" placeholder="Description de l'intervention..."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" (click)="showForm = false">Annuler</button>
      <button class="btn-save" (click)="creer()" [disabled]="isSaving">
        {{ isSaving ? 'Création...' : '✅ Créer l\'intervention' }}
      </button>
    </div>
  </div>

  <!-- Filtres -->
  <div class="filter-card">
    <div class="search-wrap">
      <span>🔍</span>
      <input type="text" [(ngModel)]="search" (input)="applyFilter()" placeholder="Rechercher un équipement..." class="search-input">
    </div>
    <select [(ngModel)]="filterType" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les types</option>
      <option value="CORRECTIF">Correctif</option>
      <option value="PREVENTIF">Préventif</option>
    </select>
    <select [(ngModel)]="filterMois" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les mois</option>
      <option *ngFor="let m of moisList" [value]="m.value">{{ m.label }}</option>
    </select>
    <select [(ngModel)]="filterStatut" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les statuts</option>
      <option value="EN_COURS">En cours</option>
      <option value="TERMINEE">Terminée</option>
      <option value="EN_ATTENTE_PIECE">En attente pièce</option>
    </select>
  </div>

  <!-- Liste -->
  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>
  <div *ngIf="filtered.length === 0 && !isLoading" class="empty-state"><p>Aucune intervention trouvée.</p></div>

  <div class="interventions-list" *ngIf="!isLoading">
    <div *ngFor="let inv of filtered" class="inv-card">
      <div class="inv-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ formatMonth(inv.dateIntervention) }}</span>
          <span class="date-day">{{ formatDay(inv.dateIntervention) }}</span>
        </div>
        <div>
          <div class="inv-title">{{ inv.equipement?.nom || '—' }}</div>
          <div class="inv-sub">{{ inv.equipement?.parc || '—' }}</div>
          <div class="inv-desc" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</div>
        </div>
      </div>
      <div class="inv-right">
        <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        <span class="assign-badge" [class.assigned]="inv.nomFse">
          {{ inv.nomFse ? '👤 ' + inv.nomFse : '⏳ Non assignée' }}
        </span>
        <div class="action-btns">
          <button class="btn-edit" (click)="ouvrirEdit(inv)" title="Modifier">✏️</button>
          <button class="btn-delete" (click)="supprimer(inv.id)" title="Supprimer">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal modification -->
<div class="modal-overlay" *ngIf="editInv" (click)="editInv = null">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2>✏️ Modifier l'intervention #{{ editInv.id }}</h2>
      <button class="modal-close" (click)="editInv = null">✕</button>
    </div>
    <div class="form-grid" style="margin-top:16px">
      <div class="field-wrapper">
        <label>Équipement</label>
        <select [(ngModel)]="editForm.equipementId" class="form-select">
          <option *ngFor="let e of equipements" [ngValue]="e.id">{{ e.nom }} — {{ e.parc }}</option>
        </select>
      </div>
      <div class="field-wrapper">
        <label>Type</label>
        <select [(ngModel)]="editForm.type" class="form-select">
          <option value="CORRECTIF">Correctif</option>
          <option value="PREVENTIF">Préventif</option>
        </select>
      </div>
      <div class="field-wrapper">
        <label>Date</label>
        <input type="date" [(ngModel)]="editForm.date" class="form-input">
      </div>
      <div class="field-wrapper full-width">
        <label>Description</label>
        <textarea [(ngModel)]="editForm.description" rows="3" class="form-textarea"></textarea>
      </div>
    </div>
    <div class="form-actions" style="margin-top:16px">
      <button class="btn-cancel" (click)="editInv = null">Annuler</button>
      <button class="btn-save" (click)="sauvegarderEdit()" [disabled]="isSaving">
        {{ isSaving ? 'Sauvegarde...' : '💾 Sauvegarder' }}
      </button>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:1000px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{display:flex;align-items:center;gap:16px;margin-bottom:24px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340;flex:1}p{margin:0;font-size:13px;color:#6b7280}
.btn-new{background:#f97316;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}
.form-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;.section-icon{width:36px;height:36px;background:#FFF7ED;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}h2{margin:0;font-size:16px;font-weight:700;color:#0d1340}}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.full-width{grid-column:span 2}
.field-wrapper{display:flex;flex-direction:column;gap:8px}label{font-size:13px;font-weight:600;color:#0d1340}
.form-input,.form-select{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;width:100%;box-sizing:border-box;background:white}
.form-textarea{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;resize:vertical;width:100%;box-sizing:border-box;font-family:inherit}
.form-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:20px}
.btn-cancel{background:white;border:1.5px solid #e2e6f0;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;color:#0d1340;cursor:pointer}
.btn-save{background:#f97316;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer}
.filter-card{display:flex;gap:12px;flex-wrap:wrap;background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.search-wrap{display:flex;align-items:center;gap:8px;flex:1;min-width:200px;background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:10px;padding:0 14px;height:44px}
.search-input{flex:1;border:none;outline:none;font-size:14px;background:transparent}
.filter-select{padding:10px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:13px;color:#0d1340;background:white;outline:none;min-width:130px}
.interventions-list{display:flex;flex-direction:column;gap:12px}
.inv-card{background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;align-items:center;justify-content:space-between;gap:16px}
.inv-left{display:flex;align-items:center;gap:12px;flex:1}
.date-block{display:flex;flex-direction:column;align-items:center;padding:10px 14px;border-radius:10px;min-width:56px;text-align:center;flex-shrink:0}
.date-month{font-size:10px;font-weight:700;text-transform:uppercase}.date-day{font-size:22px;font-weight:800;line-height:1.1}
.type-correctif{background:#FEE2E2;color:#DC2626}.type-preventif{background:#DCFCE7;color:#16A34A}
.inv-title{font-size:15px;font-weight:700;color:#0d1340}.inv-sub{font-size:12px;color:#6b7280}.inv-desc{font-size:12px;color:#9CA3AF;margin-top:2px}
.inv-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.type-badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.assign-badge{font-size:12px;font-weight:600;color:#CA8A04;&.assigned{color:#16A34A}}
.action-btns{display:flex;gap:6px}
.btn-edit{background:#EFF6FF;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:14px}
.btn-delete{background:#FEF2F2;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:14px}
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal-card{background:white;border-radius:16px;padding:28px;width:560px;max-width:90%;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.modal-header{display:flex;justify-content:space-between;align-items:center;h2{margin:0;font-size:18px;font-weight:800;color:#0d1340}}
.modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280}
.success-banner{background:#DCFCE7;color:#16A34A;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.error-banner{background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.empty-state,.center-state{text-align:center;padding:48px;color:#9CA3AF;background:white;border-radius:16px}
  `]
})
export class BackofficePlanningComponent implements OnInit {
  interventions: any[] = [];
  filtered: any[] = [];
  equipements: any[] = [];
  isLoading = true;
  isSaving = false;
  showForm = false;
  successMsg = '';
  errorMsg = '';
  search = ''; filterType = ''; filterMois = ''; filterStatut = '';
  editInv: any = null;
  editForm = { equipementId: null as number|null, type: '', date: '', description: '' };

  moisList = [
    {value:'01',label:'Janvier'},{value:'02',label:'Février'},{value:'03',label:'Mars'},
    {value:'04',label:'Avril'},{value:'05',label:'Mai'},{value:'06',label:'Juin'},
    {value:'07',label:'Juillet'},{value:'08',label:'Août'},{value:'09',label:'Septembre'},
    {value:'10',label:'Octobre'},{value:'11',label:'Novembre'},{value:'12',label:'Décembre'}
  ];

  form = { equipementId: null as number|null, type: '', date: '', description: '' };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => { this.interventions = data; this.filtered = [...data]; this.isLoading = false; this.cdr.detectChanges(); }
    });
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => { this.equipements = data; }
    });
  }

  applyFilter(): void {
    this.filtered = this.interventions.filter(i => {
      const matchSearch = !this.search || i.equipement?.nom?.toLowerCase().includes(this.search.toLowerCase());
      const matchType = !this.filterType || i.type === this.filterType;
      const matchMois = !this.filterMois || i.dateIntervention?.substring(5,7) === this.filterMois;
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      return matchSearch && matchType && matchMois && matchStatut;
    });
  }

  creer(): void {
    if (!this.form.equipementId || !this.form.type || !this.form.date) {
      this.errorMsg = 'Veuillez remplir tous les champs obligatoires.'; return;
    }
    this.isSaving = true;
    const payload = { dateIntervention: this.form.date, type: this.form.type, statut: 'EN_COURS', descriptionPanne: this.form.description, equipement: { id: this.form.equipementId } };
    this.http.post(`${environment.apiUrl}/interventions`, payload).subscribe({
      next: (data: any) => {
        this.interventions.unshift(data); this.filtered = [...this.interventions];
        this.isSaving = false; this.successMsg = 'Intervention créée !';
        this.form = { equipementId: null, type: '', date: '', description: '' };
        setTimeout(() => { this.showForm = false; this.successMsg = ''; this.cdr.detectChanges(); }, 2000);
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.errorMsg = 'Erreur lors de la création.'; }
    });
  }

  ouvrirEdit(inv: any): void {
    this.editInv = inv;
    this.editForm = { equipementId: inv.equipement?.id || null, type: inv.type, date: inv.dateIntervention, description: inv.descriptionPanne || '' };
  }

  sauvegarderEdit(): void {
    if (!this.editInv) return;
    this.isSaving = true;
    const payload = { id: this.editInv.id, dateIntervention: this.editForm.date, type: this.editForm.type, statut: this.editInv.statut, descriptionPanne: this.editForm.description, nomFse: this.editInv.nomFse, equipement: this.editForm.equipementId ? { id: this.editForm.equipementId } : null };
    this.http.put(`${environment.apiUrl}/interventions/${this.editInv.id}`, payload).subscribe({
      next: (data: any) => {
        const idx = this.interventions.findIndex(i => i.id === this.editInv.id);
        if (idx > -1) this.interventions[idx] = data;
        this.filtered = [...this.interventions];
        this.isSaving = false; this.editInv = null; this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Supprimer cette intervention ?')) return;
    this.http.delete(`${environment.apiUrl}/interventions/${id}`).subscribe({
      next: () => {
        this.interventions = this.interventions.filter(i => i.id !== id);
        this.filtered = this.filtered.filter(i => i.id !== id);
        this.cdr.detectChanges();
      }
    });
  }

  formatMonth(date: string): string { if (!date) return ''; const mois = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']; return mois[new Date(date).getMonth()]; }
  formatDay(date: string): string { return date ? String(new Date(date).getDate()).padStart(2, '0') : '—'; }
  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : 'type-preventif'; }
}
