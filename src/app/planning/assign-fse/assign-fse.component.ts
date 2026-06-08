import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-assign-fse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <button class="back-btn" (click)="goBack()">←</button>
    <div>
      <h1>Assigner un FSE</h1>
      <p *ngIf="intervention">Intervention #{{ intervention.id }} — {{ intervention.equipement?.nom }} — {{ intervention.equipement?.parc }}</p>
    </div>
  </div>

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>

  <div *ngIf="intervention && !isLoading">
    <div class="info-card">
      <div class="section-header"><div class="section-icon">ℹ️</div><h2>Détails de l'intervention</h2></div>
      <div class="info-row"><span class="label">Équipement</span><span class="value">{{ intervention.equipement?.nom }}</span></div>
      <div class="info-row"><span class="label">Parc</span><span class="value">{{ intervention.equipement?.parc }}</span></div>
      <div class="info-row"><span class="label">Type</span><span class="value">{{ intervention.type }}</span></div>
      <div class="info-row"><span class="label">Date</span><span class="value">{{ intervention.dateIntervention | date:'dd/MM/yyyy' }}</span></div>
      <div class="info-row"><span class="label">Description</span><span class="value">{{ intervention.descriptionPanne || '—' }}</span></div>
      <div class="info-row"><span class="label">Statut actuel</span>
        <span class="statut-badge">{{ intervention.statut }}</span>
      </div>
    </div>

    <div class="form-card">
      <div class="section-header"><div class="section-icon">👤</div><h2>Assigner un FSE responsable</h2></div>

      <div *ngIf="successMsg" class="success-banner">✅ {{ successMsg }}</div>
      <div *ngIf="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

      <div class="field-wrapper">
        <label>FSE responsable <span class="required">*</span></label>
        <select [(ngModel)]="selectedFseId" class="form-select">
          <option [ngValue]="null">-- Sélectionner un FSE --</option>
          <option *ngFor="let f of fseList" [ngValue]="f.id">
            {{ f.prenom || '' }} {{ f.nom }} — {{ f.email }}
          </option>
        </select>
      </div>

      <div class="field-wrapper" style="margin-top:16px">
        <label>Statut</label>
        <select [(ngModel)]="selectedStatut" class="form-select">
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_COURS">En cours</option>
        </select>
      </div>

      <div class="form-actions">
        <button class="btn-cancel" (click)="goBack()">Annuler</button>
        <button class="btn-save" (click)="assigner()" [disabled]="isSaving || !selectedFseId">
          👤 {{ isSaving ? 'Assignation...' : 'Assigner le FSE' }}
        </button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:800px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.back-btn{background:none;border:none;font-size:20px;cursor:pointer;color:#0d1340;padding:4px 8px;border-radius:8px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:0;font-size:13px;color:#6b7280}
.info-card,.form-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:20px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.section-icon{width:36px;height:36px;background:#EFF6FF;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
h2{margin:0;font-size:16px;font-weight:700;color:#0d1340}
.info-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f3f5}
.info-row:last-child{border-bottom:none}
.label{font-size:13px;color:#6b7280}.value{font-size:14px;color:#0d1340;font-weight:600}
.statut-badge{padding:4px 12px;border-radius:20px;background:#FFF7ED;color:#f97316;font-size:12px;font-weight:600}
.field-wrapper{display:flex;flex-direction:column;gap:8px}
label{font-size:13px;font-weight:600;color:#0d1340}.required{color:#DC2626}
.form-select{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;color:#0d1340;background:white;outline:none;width:100%}
.form-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:24px}
.btn-cancel{background:white;border:1.5px solid #e2e6f0;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;color:#0d1340;cursor:pointer}
.btn-save{background:#1a2eff;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer}
.btn-save:disabled{opacity:.6;cursor:not-allowed}
.success-banner{background:#DCFCE7;color:#16A34A;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.error-banner{background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.center-state{text-align:center;padding:48px;color:#6b7280}
  `]
})
export class AssignFseComponent implements OnInit {
  intervention: any = null;
  fseList: any[] = [];
  selectedFseId: number | null = null;
  selectedStatut = 'EN_ATTENTE';
  isLoading = true;
  isSaving = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<any>(`${environment.apiUrl}/interventions/${id}`).subscribe({
        next: (data) => {
          this.intervention = data;
          this.selectedFseId = data.technicien?.id || null;
          this.selectedStatut = data.statut || 'EN_ATTENTE';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({
      next: (data) => {
        this.fseList = data.filter(u => u.role?.nom === 'TECHNICIEN' || u.role?.nom === 'INGENIEUR');
        this.cdr.detectChanges();
      }
    });
  }

  assigner(): void {
    if (!this.selectedFseId) return;
    this.isSaving = true;
    const fse = this.fseList.find(f => f.id === this.selectedFseId);
    const payload = {
      technicien: { id: this.selectedFseId },
      nomFse: fse ? (fse.prenom || fse.nom) : '',
      statut: this.selectedStatut
    };
    this.http.patch(`${environment.apiUrl}/interventions/${this.intervention.id}`, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMsg = 'FSE assigné avec succès !';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/planning']), 2000);
      },
      error: () => { this.isSaving = false; this.errorMsg = 'Erreur lors de l\'assignation.'; this.cdr.detectChanges(); }
    });
  }

  goBack(): void { this.router.navigate(['/planning']); }
}
