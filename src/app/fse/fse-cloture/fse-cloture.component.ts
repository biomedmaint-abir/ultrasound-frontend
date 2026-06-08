import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-cloture',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <button class="back-btn" (click)="goBack()">←</button>
    <div>
      <h1>Clôturer l'intervention</h1>
      <p *ngIf="intervention">#{{ intervention.id }} — {{ intervention.equipement?.nom }}</p>
    </div>
  </div>

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>

  <div *ngIf="intervention && !isLoading">
    <div class="info-card">
      <div class="section-header"><div class="section-icon">ℹ️</div><h2>Détails de l'intervention</h2></div>
      <div class="info-row"><span class="label">Équipement</span><span class="value">{{ intervention.equipement?.nom }}</span></div>
      <div class="info-row"><span class="label">Parc</span><span class="value">{{ intervention.equipement?.parc }}</span></div>
      <div class="info-row"><span class="label">Type</span><span class="value">{{ intervention.type }}</span></div>
      <div class="info-row"><span class="label">Description panne</span><span class="value">{{ intervention.descriptionPanne || '—' }}</span></div>
    </div>

    <div class="form-card">
      <div class="section-header"><div class="section-icon">🔧</div><h2>Rapport d'intervention</h2></div>

      <div *ngIf="successMsg" class="success-banner">✅ {{ successMsg }}</div>
      <div *ngIf="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

      <div class="form-grid">
        <div class="field-wrapper full-width">
          <label>Actions effectuées <span class="required">*</span></label>
          <textarea [(ngModel)]="form.actionsEffectuees" rows="4" class="form-textarea" placeholder="Décrivez les actions effectuées..."></textarea>
        </div>
        <div class="field-wrapper">
          <label>Durée (heures)</label>
          <input type="number" [(ngModel)]="form.duree" class="form-input" placeholder="Ex: 2">
        </div>
        <div class="field-wrapper">
          <label>Coût total (DH)</label>
          <input type="number" [(ngModel)]="form.coutTotal" class="form-input" placeholder="Ex: 1500">
        </div>
        <div class="field-wrapper full-width">
          <label>Résultat</label>
          <div class="result-buttons">
            <button class="result-btn" [class.active-green]="form.resultat === 'RESOLU'" (click)="form.resultat = 'RESOLU'">✅ Résolu</button>
            <button class="result-btn" [class.active-orange]="form.resultat === 'EN_ATTENTE_PIECE'" (click)="form.resultat = 'EN_ATTENTE_PIECE'">⏳ En attente pièce</button>
            <button class="result-btn" [class.active-red]="form.resultat === 'RETOUR'" (click)="form.resultat = 'RETOUR'">🔄 Retour nécessaire</button>
          </div>
        </div>
      </div>

      <div class="pieces-section">
        <div class="pieces-header">
          <h3>🔩 Pièces utilisées</h3>
          <button class="btn-add" (click)="ajouterPiece()">+ Ajouter</button>
        </div>
        <div *ngIf="piecesUtilisees.length === 0" class="empty-pieces">Aucune pièce ajoutée</div>
        <div *ngFor="let p of piecesUtilisees; let i = index" class="piece-row">
          <select [(ngModel)]="p.pieceId" (ngModelChange)="onPieceChange(i)" class="form-select">
            <option [ngValue]="null">-- Sélectionner --</option>
            <option *ngFor="let pd of piecesDisponibles" [ngValue]="pd.id">{{ pd.nom }} — {{ pd.reference }}</option>
          </select>
          <input type="number" [(ngModel)]="p.quantite" class="form-input small" placeholder="Qté">
          <button class="btn-delete" (click)="supprimerPiece(i)">🗑️</button>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-cancel" (click)="goBack()">Annuler</button>
        <button class="btn-submit" (click)="soumettre()" [disabled]="isSaving">
          📤 {{ isSaving ? 'Envoi...' : 'Soumettre pour validation' }}
        </button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.back-btn{background:none;border:none;font-size:20px;cursor:pointer;color:#0d1340;padding:4px 8px;border-radius:8px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:0;font-size:13px;color:#6b7280}
.info-card,.form-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:20px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.section-icon{width:36px;height:36px;background:#EFF6FF;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
h2{margin:0;font-size:16px;font-weight:700;color:#0d1340}
.info-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f3f5}.info-row:last-child{border-bottom:none}
.label{font-size:13px;color:#6b7280}.value{font-size:14px;color:#0d1340;font-weight:600}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
.full-width{grid-column:span 2}
.field-wrapper{display:flex;flex-direction:column;gap:8px}label{font-size:13px;font-weight:600;color:#0d1340}.required{color:#DC2626}
.form-input{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;width:100%;box-sizing:border-box}
.form-select{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;background:white;width:100%}
.form-textarea{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;resize:vertical;width:100%;box-sizing:border-box;font-family:inherit}
.result-buttons{display:flex;gap:12px}
.result-btn{padding:10px 20px;border:1.5px solid #e2e6f0;border-radius:10px;background:white;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.active-green{background:#DCFCE7;border-color:#16A34A;color:#16A34A}
.active-orange{background:#FFF7ED;border-color:#f97316;color:#f97316}
.active-red{background:#FEF2F2;border-color:#DC2626;color:#DC2626}
.pieces-section{margin-bottom:24px}
.pieces-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
h3{margin:0;font-size:14px;font-weight:700;color:#0d1340}
.btn-add{background:#EFF6FF;color:#1a2eff;border:1.5px solid #1a2eff;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:600;cursor:pointer}
.piece-row{display:flex;gap:10px;align-items:center;margin-bottom:8px}
.small{width:80px!important}
.btn-delete{background:#FEF2F2;border:none;border-radius:8px;padding:8px 10px;cursor:pointer}
.empty-pieces{text-align:center;padding:20px;background:#f8f9fa;border-radius:10px;color:#9CA3AF;font-size:13px}
.form-actions{display:flex;gap:12px;justify-content:flex-end}
.btn-cancel{background:white;border:1.5px solid #e2e6f0;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;color:#0d1340;cursor:pointer}
.btn-submit{background:#1a2eff;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer}&:disabled{opacity:.6;cursor:not-allowed}
.success-banner{background:#DCFCE7;color:#16A34A;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.error-banner{background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.center-state{text-align:center;padding:48px;color:#6b7280}
  `]
})
export class FseClotureComponent implements OnInit {
  intervention: any = null;
  piecesDisponibles: any[] = [];
  piecesUtilisees: { pieceId: number | null, quantite: number }[] = [];
  isLoading = true;
  isSaving = false;
  successMsg = '';
  errorMsg = '';

  form = {
    actionsEffectuees: '',
    duree: null as number | null,
    coutTotal: null as number | null,
    resultat: ''
  };

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
        next: (data) => { this.intervention = data; this.isLoading = false; this.cdr.detectChanges(); }
      });
    }
    this.http.get<any[]>(`${environment.apiUrl}/pieces`).subscribe({
      next: (data) => { this.piecesDisponibles = data; }
    });
  }

  ajouterPiece(): void { this.piecesUtilisees.push({ pieceId: null, quantite: 1 }); }
  supprimerPiece(i: number): void { this.piecesUtilisees.splice(i, 1); }
  onPieceChange(i: number): void {}

  soumettre(): void {
    if (!this.form.actionsEffectuees) { this.errorMsg = 'Veuillez remplir les actions effectuées.'; return; }
    this.isSaving = true;

    const statut = this.form.resultat === 'RESOLU' ? 'EN_ATTENTE_VALIDATION' :
                   this.form.resultat === 'EN_ATTENTE_PIECE' ? 'EN_ATTENTE_PIECE' : 'EN_COURS';

    const payload = {
      actionsEffectuees: this.form.actionsEffectuees,
      dureeHeures: this.form.duree,
      coutTotal: this.form.coutTotal,
      statut: statut
    };

    this.http.patch(`${environment.apiUrl}/interventions/${this.intervention.id}`, payload).subscribe({
      next: () => {
        const piecesValides = this.piecesUtilisees.filter(p => p.pieceId && p.quantite > 0);
        if (piecesValides.length > 0) {
          const piecesPayload = piecesValides.map(p => ({
            intervention: { id: this.intervention.id },
            piece: { id: p.pieceId },
            quantite: p.quantite,
            coutUnitaire: this.piecesDisponibles.find(pd => pd.id === p.pieceId)?.prixUnitaire || 0
          }));
          this.http.post(`${environment.apiUrl}/intervention-pieces/bulk`, piecesPayload).subscribe();
        }
        this.isSaving = false;
        this.successMsg = 'Rapport soumis pour validation !';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/fse/interventions']), 2000);
      },
      error: () => { this.isSaving = false; this.errorMsg = 'Erreur lors de la soumission.'; this.cdr.detectChanges(); }
    });
  }

  goBack(): void { this.router.navigate(['/fse/interventions']); }
}
