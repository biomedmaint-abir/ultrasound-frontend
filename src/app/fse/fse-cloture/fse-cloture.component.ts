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

      <!-- CHECK-LIST PREVENTIF UNIQUEMENT -->
      <div class="checklist-section" *ngIf="intervention.type === 'PREVENTIF'">
        <div class="checklist-header" (click)="showChecklist = !showChecklist">
          <div class="checklist-title">
            <span>📋</span>
            <h3>Check-list de maintenance — Échographe</h3>
            <span class="checklist-badge">PRÉVENTIF</span>
          </div>
          <span class="toggle-icon">{{ showChecklist ? '▲' : '▼' }}</span>
        </div>

        <div class="checklist-body" *ngIf="showChecklist">

          <!-- INFOS GÉNÉRALES -->
          <div class="checklist-category">
            <div class="category-title">📌 INFORMATIONS GÉNÉRALES</div>
            <div class="info-field-row">
              <span class="field-label">Nom de l'hôpital / Clinique</span>
              <input type="text" [value]="intervention.equipement?.parc || ''" class="form-input readonly-field" readonly>
            </div>
            <div class="info-field-row">
              <span class="field-label">Service</span>
              <input type="text" [value]="intervention.equipement?.service || ''" class="form-input readonly-field" readonly>
            </div>
            <div class="info-field-row">
              <span class="field-label">Modèle</span>
              <input type="text" [value]="intervention.equipement?.modele || intervention.equipement?.nom || ''" class="form-input readonly-field" readonly>
            </div>
            <div class="info-field-row">
              <span class="field-label">Numéro de série</span>
              <input type="text" [value]="intervention.equipement?.numeroSerie || ''" class="form-input readonly-field" readonly>
            </div>
            <div class="info-field-row">
              <span class="field-label">Version logiciel</span>
              <input type="text" [(ngModel)]="checklistInfos.versionLogiciel" class="form-input" placeholder="Ex: 5.0.3">
            </div>
            <div class="info-field-row">
              <span class="field-label">N° ordre de service</span>
              <input type="text" [(ngModel)]="checklistInfos.numeroOrdreService" class="form-input" placeholder="Ex: OS-2026-001">
            </div>
          </div>

          <!-- SÉCURITÉ ÉLECTRIQUE -->
          <div class="checklist-category">
            <div class="category-title">⚡ SÉCURITÉ ÉLECTRIQUE</div>
            <div *ngFor="let item of getItemsByCategory('SECURITE_ELECTRIQUE')" class="checklist-item">
              <div class="item-info">
                <span class="item-name">{{ item.element }}</span>
              </div>
              <div class="item-controls">
                <button class="ctrl-btn" [class.ctrl-active-green]="item.statut === 'CONFORME'" (click)="item.statut = 'CONFORME'">✓ Conforme</button>
                <button class="ctrl-btn" [class.ctrl-active-gray]="item.statut === 'NA'" (click)="item.statut = 'NA'">N/A</button>
                <input type="text" [(ngModel)]="item.remarque" class="form-input remarque-input" placeholder="Remarque...">
              </div>
            </div>
          </div>

          <!-- CONTRÔLE FONCTIONNEL -->
          <div class="checklist-category">
            <div class="category-title">🔧 CONTRÔLE FONCTIONNEL / MÉCANIQUE</div>
            <div *ngFor="let item of getItemsByCategory('CONTROLE_FONCTIONNEL')" class="checklist-item">
              <div class="item-info">
                <span class="item-name">{{ item.element }}</span>
              </div>
              <div class="item-controls">
                <button class="ctrl-btn" [class.ctrl-active-green]="item.statut === 'CONFORME'" (click)="item.statut = 'CONFORME'">✓ Conforme</button>
                <button class="ctrl-btn" [class.ctrl-active-gray]="item.statut === 'NA'" (click)="item.statut = 'NA'">N/A</button>
                <input type="text" [(ngModel)]="item.remarque" class="form-input remarque-input" placeholder="Remarque...">
              </div>
            </div>
          </div>

          <!-- SONDES -->
          <div class="checklist-category">
            <div class="category-title">🔬 SONDES</div>
            <div *ngFor="let item of getItemsByCategory('SONDES')" class="checklist-item">
              <div class="item-info">
                <span class="item-name">{{ item.element }}</span>
              </div>
              <div class="item-controls">
                <input type="text" [(ngModel)]="item.remarque" class="form-input" placeholder="Modèle de la sonde...">
              </div>
            </div>
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

      <!-- Section code erreur non reconnu -->
      <div class="code-erreur-section">
        <div class="code-erreur-header" (click)="showCodeErreur = !showCodeErreur">
          <div class="code-erreur-title">
            <span>⚠️</span>
            <h3>Code erreur non reconnu ? <span class="optionnel">(optionnel)</span></h3>
          </div>
          <span class="toggle-icon">{{ showCodeErreur ? '▲' : '▼' }}</span>
        </div>
        <div class="code-erreur-body" *ngIf="showCodeErreur">
          <p class="code-erreur-desc">Si vous avez rencontré un code erreur absent de la base IA, signalez-le ici.</p>
          <div class="form-grid">
            <div class="field-wrapper">
              <label>Code erreur</label>
              <input type="text" [(ngModel)]="codeErreur.code" class="form-input" placeholder="Ex: E089, U034...">
            </div>
            <div class="field-wrapper">
              <label>Symptômes observés</label>
              <input type="text" [(ngModel)]="codeErreur.symptomes" class="form-input" placeholder="Ex: Écran noir...">
            </div>
            <div class="field-wrapper full-width">
              <label>Solution appliquée</label>
              <textarea [(ngModel)]="codeErreur.solution" rows="2" class="form-textarea" placeholder="Décrivez..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="field-wrapper full-width" style="margin-bottom:24px">
        <label>Nom du responsable client présent <span class="required">*</span></label>
        <input type="text" [(ngModel)]="form.responsableClient" class="form-input" placeholder="Nom et prénom du responsable technique du site">
      </div>

      <div class="form-actions">
        <button class="btn-cancel" (click)="goBack()">Annuler</button>
        <button class="btn-submit" (click)="soumettre()" [disabled]="isSaving">
          📤 {{ isSaving ? 'Envoi...' : 'Terminer l\'intervention' }}
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
.readonly-field{background:#f8f9fc;color:#6b7280;cursor:not-allowed}
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
.checklist-section{background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:14px;margin-bottom:24px;overflow:hidden}
.checklist-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;cursor:pointer}
.checklist-title{display:flex;align-items:center;gap:10px;h3{margin:0;font-size:14px;font-weight:700;color:#15803d}}
.checklist-badge{background:#16A34A;color:white;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700}
.toggle-icon{font-size:12px;color:#6b7280}
.checklist-body{padding:0 20px 20px}
.checklist-category{margin-bottom:20px}
.category-title{font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;padding:8px 0;border-bottom:1.5px solid #86EFAC;margin-bottom:12px}
.info-field-row{display:flex;align-items:center;gap:12px;margin-bottom:8px;.field-label{font-size:13px;color:#374151;font-weight:500;width:200px;flex-shrink:0}}
.checklist-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;margin-bottom:6px;background:white;border:1px solid #e2e6f0}
.item-info{flex:1}.item-name{font-size:13px;color:#0d1340;font-weight:500}
.item-controls{display:flex;gap:8px;align-items:center}
.ctrl-btn{padding:5px 12px;border:1.5px solid #e2e6f0;border-radius:8px;background:white;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
.ctrl-active-green{background:#DCFCE7;border-color:#16A34A;color:#16A34A}
.ctrl-active-gray{background:#F3F4F6;border-color:#9CA3AF;color:#6b7280}
.remarque-input{width:160px!important}
.code-erreur-section{background:#FFFBEB;border:1.5px solid #FCD34D;border-radius:14px;margin-bottom:24px;overflow:hidden}
.code-erreur-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;cursor:pointer}
.code-erreur-title{display:flex;align-items:center;gap:10px}
.optionnel{font-size:11px;color:#6b7280;font-weight:400}
.code-erreur-body{padding:0 20px 20px}
.code-erreur-desc{font-size:12px;color:#6b7280;margin:0 0 16px;font-style:italic}
.form-actions{display:flex;gap:12px;justify-content:flex-end}
.btn-cancel{background:white;border:1.5px solid #e2e6f0;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;color:#0d1340;cursor:pointer}
.btn-submit{background:#1a2eff;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer}.btn-submit:disabled{opacity:.6;cursor:not-allowed}
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
  showCodeErreur = false;
  showChecklist = true;

  form = {
    actionsEffectuees: '',
    duree: null as number | null,
    coutTotal: null as number | null,
    resultat: '',
    responsableClient: ''
  };

  codeErreur = { code: '', symptomes: '', solution: '' };

  checklistInfos = { versionLogiciel: '', numeroOrdreService: '' };

  checklistItems: any[] = [];

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
          this.isLoading = false;
          this.initChecklist();
          this.cdr.detectChanges();
        }
      });
    }
    this.http.get<any[]>(`${environment.apiUrl}/pieces`).subscribe({
      next: (data) => { this.piecesDisponibles = data; }
    });
  }

  initChecklist(): void {
    this.checklistItems = [
      { element: 'Tension secteur (V)', categorie: 'SECURITE_ELECTRIQUE', statut: '', remarque: '' },
      { element: 'Auto-test', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Filtre à air / Cache poussière', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Moniteur / Écran', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Trackball', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Panneau de commande', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Câble alimentation / Disjoncteur', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Roulettes', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Ports USB / Réseau', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'ECG', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Sécurité mécanique', categorie: 'CONTROLE_FONCTIONNEL', statut: '', remarque: '' },
      { element: 'Sonde 1', categorie: 'SONDES', statut: '', remarque: '' },
      { element: 'Sonde 2', categorie: 'SONDES', statut: '', remarque: '' },
      { element: 'Sonde 3', categorie: 'SONDES', statut: '', remarque: '' },
      { element: 'Sonde 4', categorie: 'SONDES', statut: '', remarque: '' },
    ];
  }

  getItemsByCategory(categorie: string): any[] {
    return this.checklistItems.filter(i => i.categorie === categorie);
  }

  ajouterPiece(): void { this.piecesUtilisees.push({ pieceId: null, quantite: 1 }); }
  supprimerPiece(i: number): void { this.piecesUtilisees.splice(i, 1); }
  onPieceChange(i: number): void {}

  soumettre(): void {
    if (!this.form.actionsEffectuees) { this.errorMsg = 'Veuillez remplir les actions effectuées.'; return; }
    this.isSaving = true;

    const statut = this.form.resultat === 'RESOLU' ? 'TERMINEE' :
                   this.form.resultat === 'EN_ATTENTE_PIECE' ? 'EN_ATTENTE_PIECE' : 'EN_COURS';

    const payload = {
      id: this.intervention.id,
      dateIntervention: this.intervention.dateIntervention,
      type: this.intervention.type,
      statut: statut,
      descriptionPanne: this.intervention.descriptionPanne,
      actionsEffectuees: this.form.actionsEffectuees + (this.form.responsableClient ? ' | Responsable client: ' + this.form.responsableClient : ''),
      dureeHeures: this.form.duree,
      coutTotal: this.form.coutTotal,
      nomFse: this.intervention.nomFse,
      equipement: this.intervention.equipement ? { id: this.intervention.equipement.id } : null,
      technicien: this.intervention.technicien ? { id: this.intervention.technicien.id } : null
    };

    this.http.put(`${environment.apiUrl}/interventions/${this.intervention.id}`, payload).subscribe({
      next: () => {
        const piecesValides = this.piecesUtilisees.filter(p => p.pieceId && p.quantite > 0);
        if (piecesValides.length > 0) {
          const piecesPayload = piecesValides.map(p => ({
            intervention: { id: this.intervention.id },
            piece: { id: p.pieceId },
            quantite: p.quantite,
            coutUnitaire: this.piecesDisponibles.find((pd: any) => pd.id === p.pieceId)?.prixUnitaire || 0
          }));
          this.http.post(`${environment.apiUrl}/intervention-pieces/bulk`, piecesPayload).subscribe();
        }

        // Sauvegarder checklist si PREVENTIF
        if (this.intervention.type === 'PREVENTIF' && this.checklistItems.length > 0) {
          const checklistPayload = this.checklistItems.map(item => ({
            element: item.element,
            categorie: item.categorie,
            statut: item.statut || 'NA',
            remarque: item.remarque || ''
          }));
          this.http.post(`${environment.apiUrl}/checklist/intervention/${this.intervention.id}/bulk`, checklistPayload).subscribe();
        }

        if (this.codeErreur.code && this.codeErreur.symptomes) {
          const codePayload = {
            code: this.codeErreur.code,
            symptomes: this.codeErreur.symptomes,
            actionsCorrectives: this.codeErreur.solution,
            causesProbables: 'Signalé par FSE — à vérifier',
            interventionId: this.intervention.id
          };
          this.http.post(`${environment.apiUrl}/codes-erreur/signalement`, codePayload).subscribe({ error: () => {} });
        }

        // Générer PDF Fiche 34
        this.genererFiche34();

        // Générer PDF checklist si PREVENTIF
        if (this.intervention.type === 'PREVENTIF') {
          this.genererChecklistPDF();
        }

        this.isSaving = false;
        this.successMsg = '✅ Intervention clôturée avec succès !';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/fse/interventions']), 2500);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMsg = 'Erreur lors de la soumission. Code: ' + err.status;
        this.cdr.detectChanges();
      }
    });
  }

async genererFiche34(): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const inv = this.intervention;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210; const margin = 15;
    const nomFse = inv.nomFse || localStorage.getItem('nom') + ' ' + localStorage.getItem('prenom') || '—';
    const dateStr = new Date(inv.dateIntervention).toLocaleDateString('fr-FR');

    // ── EN-TÊTE ──
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(28,43,90);
    doc.text('SCRIM', margin, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80,80,80);
    doc.text('Service Après Vente', margin, 24);

    // Badge N°Eco
    doc.setFillColor(28,43,90); doc.rect(W-margin-55, 10, 55, 10, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(8);
    doc.text('N° Éco 0802 000 089', W-margin-28, 16.5, {align:'center'});
    doc.setTextColor(28,43,90); doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.text('sav@scrim.ma', W-margin-28, 25, {align:'center'});

    doc.setDrawColor(28,43,90); doc.setLineWidth(0.5);
    doc.line(margin, 28, W-margin, 28);

    // ── TITRE ──
    let y = 32;
    doc.setDrawColor(0); doc.setLineWidth(0.3);
    doc.rect(margin, y, W-margin*2, 10);
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(0,0,0);
    doc.text('Rapport d\'intervention', margin+4, y+7);
    doc.setFontSize(11); doc.setTextColor(200,0,0);
    doc.text('N°  ' + String(inv.id).padStart(6,'0'), W-margin-35, y+7);

    // ── INFOS ──
    y += 14;
    const col1x = margin; const col2x = W/2+2;
    const colW = W/2 - margin - 2;

    const drawInfoBlock = (x: number, label: string, val: string, yy: number) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(28,43,90);
      doc.text(label+' :', x, yy);
      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
      doc.text(val, x+30, yy);
    };

    drawInfoBlock(col1x, 'Client', inv.equipement?.parc || '—', y);
    drawInfoBlock(col2x, 'Date', dateStr, y);
    y+=6;
    drawInfoBlock(col1x, 'Ville', this.getVilleFromParc(inv.equipement?.parc), y);
    drawInfoBlock(col2x, 'Salle', inv.equipement?.service || '—', y);
    y+=6;
    drawInfoBlock(col1x, 'Matériel', 'Echographe', y);
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(28,43,90);
    doc.text('Utilisation conforme :', col2x, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    doc.rect(col2x+38, y-3, 3, 3, 'F'); doc.text('Oui', col2x+42, y);
    doc.rect(col2x+52, y-3, 3, 3, 'S'); doc.text('Non', col2x+56, y);
    y+=6;
    drawInfoBlock(col1x, 'N° Série', inv.equipement?.numeroSerie || '—', y);

    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
    doc.line(margin, y+4, W-margin, y+4);

    // ── TABLEAU FSE ──
    y+=8;
    autoTable(doc, {
      head: [['Nom de l\'ingénieur','Date','Heure arrivée','Heure départ']],
      body: [[nomFse, dateStr, '', '']],
      startY: y, margin:{left:margin,right:margin},
      styles:{font:'helvetica',fontSize:8.5,cellPadding:2.5,lineColor:[0,0,0],lineWidth:0.2},
      headStyles:{fillColor:[28,43,90],textColor:[255,255,255],fontStyle:'bold',halign:'center' as const},
      columnStyles:{0:{cellWidth:60},1:{cellWidth:30,halign:'center' as const},2:{cellWidth:35,halign:'center' as const},3:{cellWidth:35,halign:'center' as const}},
    });

    // ── RAPPORT TECHNIQUE ──
    y = (doc as any).lastAutoTable.finalY + 4;
    doc.setFillColor(28,43,90); doc.rect(margin, y, W-margin*2, 7, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('Rapport technique', W/2, y+5, {align:'center'});
    y+=9;
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    const actionsText = this.form.actionsEffectuees || '';
    const lines = doc.splitTextToSize(actionsText, W-margin*2-6);
    const blockH = Math.max(20, lines.length*4.5+6);
    doc.rect(margin, y, W-margin*2, blockH);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(0,0,0);
    doc.text(lines, margin+3, y+5);
    y += blockH + 4;

    // ── TABLEAU PIÈCES ──
    doc.setFillColor(28,43,90); doc.rect(margin, y, W-margin*2, 7, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('Pièces utilisées', W/2, y+5, {align:'center'});
    y+=7;

    const piecesBody: any[] = this.piecesUtilisees
      .filter(p => p.pieceId)
      .map(p => {
        const pd = this.piecesDisponibles.find((x:any) => x.id === p.pieceId);
        return [pd?.reference || '—', String(p.quantite), '', pd?.nom || '—'];
      });
    while (piecesBody.length < 5) piecesBody.push(['','','','']);

    autoTable(doc, {
      head: [['Réf pièces fournies','Qté.','N° BS','Désignation']],
      body: piecesBody,
      startY: y, margin:{left:margin,right:margin},
      styles:{font:'helvetica',fontSize:8,cellPadding:2.5,lineColor:[0,0,0],lineWidth:0.2,minCellHeight:6},
      headStyles:{fillColor:[240,240,240],textColor:[0,0,0],fontStyle:'bold',halign:'center' as const},
      columnStyles:{0:{cellWidth:45},1:{cellWidth:15,halign:'center' as const},2:{cellWidth:25,halign:'center' as const},3:{cellWidth:95}},
    });

    // ── TYPE INTERVENTION ──
    y = (doc as any).lastAutoTable.finalY + 4;
    if (y > 220) { doc.addPage(); y = 15; }

    const isPreventif = inv.type === 'PREVENTIF';
    const isCorrectif = inv.type === 'CORRECTIF';
    const isTerminee = inv.statut === 'TERMINEE';
    const numContrat = '—';
    const col3W = (W-margin*2)/3;

    doc.setLineWidth(0.2); doc.setDrawColor(0);
    doc.rect(margin, y, col3W, 28);
    doc.rect(margin+col3W, y, col3W, 28);
    doc.rect(margin+col3W*2, y, col3W, 28);

    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(0,0,0);
    doc.rect(margin+2, y+3, 3, 3, 'S'); doc.text('Installation / Mise en service', margin+6, y+6);
    doc.rect(margin+2, y+9, 3, 3, 'S'); doc.text('Formation', margin+6, y+12);
    doc.rect(margin+2, y+15, 3, 3, 'S'); doc.text('Garantie', margin+6, y+18);

    doc.text('Contrat N° : '+numContrat, margin+col3W+2, y+6);
    doc.rect(margin+col3W+2, y+9, 3, 3, isPreventif?'F':'S'); doc.text('Maintenance préventive', margin+col3W+6, y+12);
    doc.rect(margin+col3W+2, y+15, 3, 3, isCorrectif?'F':'S'); doc.text('Maintenance corrective', margin+col3W+6, y+18);
    doc.rect(margin+col3W+2, y+21, 3, 3, 'S'); doc.text('Intervention facturable', margin+col3W+6, y+24);

    doc.text('Intervention achevée :', margin+col3W*2+2, y+6);
    doc.rect(margin+col3W*2+2, y+9, 3, 3, isTerminee?'F':'S'); doc.text('Oui', margin+col3W*2+6, y+12);
    doc.rect(margin+col3W*2+16, y+9, 3, 3, isTerminee?'S':'F'); doc.text('Non', margin+col3W*2+20, y+12);

    // ── SIGNATURES ──
    y += 32;
    if (y > 230) { doc.addPage(); y = 15; }

    doc.setLineWidth(0.2);
    doc.rect(margin, y, col3W, 32);
    doc.rect(margin+col3W, y, col3W, 32);
    doc.rect(margin+col3W*2, y, col3W, 32);

    doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text('Signature de l\'intervenant', margin+col3W/2, y+5, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text(nomFse, margin+col3W/2, y+10, {align:'center'});
    doc.text('Service Après Vente SCRIM', margin+2, y+15);
    doc.text('22, Zankat Al Mariniyine Hassan - Rabat', margin+2, y+19);
    doc.text('Tél : 05 37 26 06 06', margin+2, y+23);
    doc.text('www.scrim.ma', margin+2, y+27);

    doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text('Signature client', margin+col3W+col3W/2, y+5, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text('Date :', margin+col3W+2, y+15);

    doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text('Signature service client', margin+col3W*2+col3W/2, y+5, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text(inv.equipement?.parc || '—', margin+col3W*2+2, y+10);

    // ── PIED DE PAGE ──
    const pageH = 297;
    doc.setFillColor(240,240,240); doc.rect(0, pageH-22, W, 22, 'F');
    doc.setDrawColor(28,43,90); doc.setLineWidth(0.5);
    doc.line(0, pageH-22, W, pageH-22);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(60,60,60);
    doc.text('Avenue Mohamed Elyazidi, Villa N° 7, Bloc D, Secteur 9, Hay Riad - RABAT', W/2, pageH-16, {align:'center'});
    doc.text('Tél : +212 (5) 37 56 64 84 – Fax : +212 (5) 37 56 64 85 – Web : www.scrim.ma', W/2, pageH-11, {align:'center'});
    doc.text('S.A au capital de 4 000 000 Dhs - ICE 001603940000046 - RC : 20937 - CNSS : 1491696', W/2, pageH-6.5, {align:'center'});
    doc.text('IF : 03300951 - Patente : 25119572 - BMCI : 01070 0001 47 001 41 MAD', W/2, pageH-2, {align:'center'});

    doc.save('Fiche34_N'+String(inv.id).padStart(6,'0')+'_'+(inv.equipement?.nom||'Equipement')+'.pdf');
  }

  getVilleFromParc(parc: string): string {
    const villes: {[key:string]:string} = {
      'CHU Tanger':'Tanger','HCK Casablanca':'Casablanca','CHU Mohamed VI Oujda':'Oujda',
      'Hopital Ghassani Fes':'Fès','ODM Fes':'Fès','HCZ Rabat':'Rabat',
      'Dr Louah Rabat':'Rabat','Dr Loubaris Rabat':'Rabat','Clinique Slaoui Rabat':'Rabat',
      'Daoud Layla Rabat':'Rabat','Clinique Dar DMANA Ouazzane':'Ouazzane',
      'Dr SAFI Asfi':'Safi','Dr HADI Safi':'Safi','Dr Boudhar Safi':'Safi',
      'Dr Lamhani Marrakech':'Marrakech','Clinique Ibn Sina Tanger':'Tanger',
      'Dr SALMI Najlae Témara':'Témara','Dr Agharabi Témarra':'Témara',
      'Promamec Bouskoura':'Bouskoura','Dr EZ-ZAHRAOUI Casablanca':'Casablanca',
      'Dr ESSAKET Bani Mellal':'Beni Mellal','Clinique Tarik Ibn Ziyad':'Tanger'
    };
    return villes[parc] || '—';
  }

  async genererChecklistPDF(): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const inv = this.intervention;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 14;

    // EN-TÊTE
    doc.setFillColor(28, 43, 90); doc.rect(0, 0, W, 30, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text('CHECK-LIST DE MAINTENANCE — ÉCHOGRAPHE', W/2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('SCRIM | Service Après Vente', W/2, 22, { align: 'center' });

    // INFOS
    doc.setTextColor(0,0,0); doc.setFontSize(9);
    let y = 36;
    doc.setFont('helvetica', 'bold'); doc.text('Équipement :', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(inv.equipement?.nom || '—', margin + 28, y);
    doc.setFont('helvetica', 'bold'); doc.text('Site :', W/2, y);
    doc.setFont('helvetica', 'normal'); doc.text(inv.equipement?.parc || '—', W/2 + 12, y);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.text('N° Série :', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(inv.equipement?.numeroSerie || '—', margin + 22, y);
    doc.setFont('helvetica', 'bold'); doc.text('Date :', W/2, y);
    doc.setFont('helvetica', 'normal'); doc.text(new Date(inv.dateIntervention).toLocaleDateString('fr-FR'), W/2 + 14, y);
    y += 6;
    if (this.checklistInfos.versionLogiciel) {
      doc.setFont('helvetica', 'bold'); doc.text('Version logiciel :', margin, y);
      doc.setFont('helvetica', 'normal'); doc.text(this.checklistInfos.versionLogiciel, margin + 36, y);
    }
    if (this.checklistInfos.numeroOrdreService) {
      doc.setFont('helvetica', 'bold'); doc.text('N° OS :', W/2, y);
      doc.setFont('helvetica', 'normal'); doc.text(this.checklistInfos.numeroOrdreService, W/2 + 16, y);
    }

    // TABLEAU
    const categories = ['SECURITE_ELECTRIQUE', 'CONTROLE_FONCTIONNEL', 'SONDES'];
    const catLabels: {[key: string]: string} = {
      'SECURITE_ELECTRIQUE': 'Sécurité électrique',
      'CONTROLE_FONCTIONNEL': 'Contrôle fonctionnel / Mécanique',
      'SONDES': 'Sondes'
    };

    const body: any[] = [];
    categories.forEach(cat => {
      body.push([{ content: catLabels[cat], colSpan: 4, styles: { fillColor: [28, 43, 90], textColor: [255,255,255], fontStyle: 'bold', halign: 'left' as const } }]);
      this.getItemsByCategory(cat).forEach(item => {
        const isConforme = item.statut === 'CONFORME';
        const isNA = item.statut === 'NA';
        const isSonde = cat === 'SONDES';
        body.push([
          item.element,
          isSonde ? '—' : (isConforme ? '✓' : ''),
          isSonde ? '—' : (isNA ? '✓' : ''),
          item.remarque || ''
        ]);
      });
    });

    autoTable(doc, {
      head: [['Élément à vérifier', 'Conforme', 'N/A', 'Remarques']],
      body: body,
      startY: y + 8,
      margin: { left: margin, right: margin },
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3, lineColor: [0,0,0], lineWidth: 0.2 },
      headStyles: { fillColor: [28, 43, 90], textColor: [255,255,255], fontStyle: 'bold', halign: 'center' as const },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 22, halign: 'center' as const },
        2: { cellWidth: 22, halign: 'center' as const },
        3: { cellWidth: 58 }
      },
      alternateRowStyles: { fillColor: [248, 249, 252] },
    });

    // SIGNATURES
    const finalY = (doc as any).lastAutoTable?.finalY + 12 || 230;
    doc.setLineWidth(0.3); doc.setDrawColor(0,0,0);

    // Ligne séparatrice
    doc.line(margin, finalY, W - margin, finalY);

    // Bloc technicien
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0,0,0);
    doc.text('Technicien SAV :', margin, finalY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(inv.nomFse || '—', margin + 32, finalY + 8);
    doc.text('Date : ' + new Date(inv.dateIntervention).toLocaleDateString('fr-FR'), margin, finalY + 14);
    doc.text('Signature :', margin, finalY + 20);
    doc.rect(margin, finalY + 23, 75, 25);

    // Bloc client
    doc.setFont('helvetica', 'bold');
    doc.text('Représentant du client :', W/2 + 5, finalY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(inv.equipement?.parc || '—', W/2 + 5, finalY + 14);
    doc.text('Date :', W/2 + 5, finalY + 20);
    doc.rect(W/2 + 5, finalY + 23, 75, 25);

    // Pied de page
    doc.setFillColor(28,43,90); doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('SCRIM | sav@scrim.ma | N°Eco : 0802 000 089', margin, 293);
    doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR'), W - margin, 293, { align: 'right' });

    doc.save('Checklist_' + (inv.equipement?.nom || 'Equipement') + '_' + inv.dateIntervention + '.pdf');
  }

  goBack(): void { this.router.navigate(['/fse/interventions']); }
}
