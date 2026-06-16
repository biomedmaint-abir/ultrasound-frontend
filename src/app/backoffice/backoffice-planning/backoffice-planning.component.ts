import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-backoffice-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Planning des maintenances</h1>
    <p>{{ interventions.length }} intervention(s) planifiée(s)</p>
    <button class="btn-new" (click)="showForm = !showForm">+ Nouvelle intervention</button>
  </div>

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

  <div class="interventions-list">
    <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>
    <div *ngIf="interventions.length === 0 && !isLoading" class="empty-state"><p>Aucune intervention planifiée.</p></div>
    <div *ngFor="let inv of interventions" class="inv-card">
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
        <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)">
          <span class="dot"></span>{{ inv.nomFse ? 'Assignée à ' + inv.nomFse : 'Non assignée' }}
        </span>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:1000px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;h1{margin:0;font-size:26px;font-weight:800;color:#0d1340;flex:1}p{margin:0;font-size:13px;color:#6b7280}}
.btn-new{background:#f97316;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer}
.form-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;.section-icon{width:36px;height:36px;background:#FFF7ED;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}h2{margin:0;font-size:16px;font-weight:700;color:#0d1340}}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
.full-width{grid-column:span 2}
.field-wrapper{display:flex;flex-direction:column;gap:8px}label{font-size:13px;font-weight:600;color:#0d1340}
.form-input,.form-select,.form-textarea{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;width:100%;box-sizing:border-box;background:white}
.form-actions{display:flex;gap:12px;justify-content:flex-end}
.btn-cancel{background:white;border:1.5px solid #e2e6f0;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;color:#0d1340;cursor:pointer}
.btn-save{background:#f97316;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer}
.interventions-list{display:flex;flex-direction:column;gap:12px}
.inv-card{background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;align-items:center;justify-content:space-between}
.inv-left{display:flex;align-items:center;gap:12px}
.date-block{display:flex;flex-direction:column;align-items:center;padding:10px 14px;border-radius:10px;min-width:56px;text-align:center}
.date-month{font-size:10px;font-weight:700;text-transform:uppercase}.date-day{font-size:22px;font-weight:800;line-height:1.1}
.type-correctif{background:#FEE2E2;color:#DC2626}.type-preventif{background:#DCFCE7;color:#16A34A}
.inv-title{font-size:15px;font-weight:700;color:#0d1340}.inv-sub{font-size:12px;color:#6b7280}.inv-desc{font-size:12px;color:#9CA3AF;margin-top:2px}
.inv-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.type-badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#FEF9C3;color:#CA8A04}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.success-banner{background:#DCFCE7;color:#16A34A;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.error-banner{background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.empty-state,.center-state{text-align:center;padding:48px;color:#9CA3AF;background:white;border-radius:16px}
  `]
})
export class BackofficePlanningComponent implements OnInit {
  interventions: any[] = [];
  equipements: any[] = [];
  isLoading = true;
  isSaving = false;
  showForm = false;
  successMsg = '';
  errorMsg = '';

  form = { equipementId: null as number | null, type: '', date: '', description: '' };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => { this.interventions = data; this.isLoading = false; this.cdr.detectChanges(); }
    });
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => { this.equipements = data; }
    });
  }

  creer(): void {
    if (!this.form.equipementId || !this.form.type || !this.form.date) {
      this.errorMsg = 'Veuillez remplir tous les champs obligatoires.'; return;
    }
    this.isSaving = true;
    const payload = {
      dateIntervention: this.form.date, type: this.form.type,
      statut: 'EN_COURS', descriptionPanne: this.form.description,
      equipement: { id: this.form.equipementId }
    };
    this.http.post(`${environment.apiUrl}/interventions`, payload).subscribe({
      next: (data: any) => {
        this.interventions.unshift(data);
        this.isSaving = false;
        this.successMsg = 'Intervention créée avec succès !';
        this.form = { equipementId: null, type: '', date: '', description: '' };
        setTimeout(() => { this.showForm = false; this.successMsg = ''; }, 2000);
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.errorMsg = 'Erreur lors de la création.'; }
    });
  }

  formatMonth(date: string): string {
    if (!date) return '';
    const mois = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    return mois[new Date(date).getMonth()];
  }
  formatDay(date: string): string { return date ? String(new Date(date).getDate()).padStart(2, '0') : '—'; }
  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : 'type-preventif'; }
  getStatutClass(s: string): string { return s === 'TERMINEE' ? 'statut-terminee' : 'statut-en_cours'; }
}
