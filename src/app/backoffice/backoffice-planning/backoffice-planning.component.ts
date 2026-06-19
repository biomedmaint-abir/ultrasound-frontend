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
    <div class="header-actions">
      <button class="btn-pdf" (click)="showPdfModal = true">📄 Générer planning PDF</button>
      <button class="btn-new" (click)="showForm = !showForm">+ Nouvelle intervention</button>
    </div>
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
        <textarea [(ngModel)]="form.description" rows="3" class="form-textarea" placeholder="Description..."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" (click)="showForm = false">Annuler</button>
      <button class="btn-save" (click)="creer()" [disabled]="isSaving">{{ isSaving ? "Création..." : "✅ Créer" }}</button>
    </div>
  </div>

  <div *ngIf="successMsg" class="success-banner" style="margin-bottom:16px">{{ successMsg }}</div>

  <!-- Filtres -->
  <div class="filter-card">
    <div class="search-wrap">
      <span>🔍</span>
      <input type="text" [(ngModel)]="search" (input)="applyFilter()" placeholder="Rechercher..." class="search-input">
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

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>
  <div *ngIf="filtered.length === 0 && !isLoading" class="empty-state"><p>Aucune intervention.</p></div>

  <div class="interventions-list" *ngIf="!isLoading">
    <div *ngFor="let inv of filtered" class="inv-card">
      <div class="inv-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ formatMonth(inv.dateIntervention) }}</span>
          <span class="date-day">{{ formatDay(inv.dateIntervention) }}</span>
        </div>
        <div>
          <div class="inv-title">{{ inv.equipement?.nom || "—" }}</div>
          <div class="inv-sub">{{ inv.equipement?.parc || "—" }}</div>
          <div class="inv-desc" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</div>
        </div>
      </div>
      <div class="inv-right">
        <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        <span class="assign-badge" [class.assigned]="inv.nomFse">{{ inv.nomFse ? "👤 " + inv.nomFse : "⏳ Non assignée" }}</span>
        <div class="action-btns">
          <button class="btn-edit" (click)="ouvrirEdit(inv)">✏️</button>
          <button class="btn-delete" (click)="supprimer(inv.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal modification -->
<div class="modal-overlay" *ngIf="editInv" (click)="editInv = null">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2>✏️ Modifier #{{ editInv.id }}</h2>
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
      <button class="btn-save" (click)="sauvegarderEdit()" [disabled]="isSaving">{{ isSaving ? "..." : "💾 Sauvegarder" }}</button>
    </div>
  </div>
</div>

<!-- Modal PDF -->
<div class="modal-overlay" *ngIf="showPdfModal" (click)="showPdfModal = false">
  <div class="modal-card modal-pdf" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2>📄 Générer planning PDF</h2>
      <button class="modal-close" (click)="showPdfModal = false">✕</button>
    </div>
    <div class="pdf-form">
      <div class="field-wrapper">
        <label>Client / Parc *</label>
        <select [(ngModel)]="pdfForm.parc" (ngModelChange)="onParcChange()" class="form-select">
          <option value="">-- Sélectionner un client --</option>
          <option *ngFor="let p of parcsList" [value]="p">{{ p }}</option>
        </select>
      </div>
      <div class="field-wrapper">
        <label>Année *</label>
        <select [(ngModel)]="pdfForm.annee" class="form-select">
          <option *ngFor="let a of anneesList" [value]="a">{{ a }}</option>
        </select>
      </div>
      <div class="field-wrapper" *ngIf="equipementsParc.length > 0">
        <label>Équipements à inclure *</label>
        <div class="equipements-checkboxes">
          <label class="checkbox-item" *ngFor="let e of equipementsParc">
            <input type="checkbox" [(ngModel)]="e.selected">
            <span><strong>{{ e.nom }}</strong> — {{ e.modele || "—" }} — N° {{ e.numeroSerie || "—" }}</span>
          </label>
        </div>
      </div>
      <div *ngIf="pdfForm.parc && equipementsParc.length === 0" class="empty-state" style="padding:12px">
        Aucun équipement pour ce client.
      </div>
      <div class="field-wrapper" *ngIf="pdfForm.parc && equipementsParc.length > 0">
        <label>📅 Visites à inclure</label>
        <div class="visites-check-grid">
          <div *ngFor="let v of visitesCochees" class="visite-block">
            <label class="visite-check-item">
              <input type="checkbox" [(ngModel)]="v.checked">
              <span class="visite-check-label">{{ v.label }}</span>
            </label>
            <div class="visite-dates" *ngIf="v.checked">
              <span class="date-label">Entre le</span>
              <input type="date" [(ngModel)]="v.dateDebut" class="form-input small-date">
              <span class="date-label">et le</span>
              <input type="date" [(ngModel)]="v.dateFin" class="form-input small-date">
            </div>
          </div>
        </div>
    </div>
    <div class="form-actions" style="margin-top:20px">
      <button class="btn-cancel" (click)="showPdfModal = false">Annuler</button>
      <button class="btn-save" (click)="genererPDF()" [disabled]="!pdfForm.parc || equipementsParc.filter(e => e.selected).length === 0">
        📄 Générer le planning PDF
      </button>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:1000px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:"Plus Jakarta Sans",sans-serif}
.page-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;h1{margin:0;font-size:26px;font-weight:800;color:#0d1340;flex:1}p{margin:0;font-size:13px;color:#6b7280}}
.header-actions{display:flex;gap:10px}
.btn-pdf{background:#1C2B5A;color:white;border:none;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer}
.btn-new{background:#f97316;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer}
.form-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;.section-icon{width:36px;height:36px;background:#FFF7ED;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}h2{margin:0;font-size:16px;font-weight:700;color:#0d1340}}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.full-width{grid-column:span 2}
.field-wrapper{display:flex;flex-direction:column;gap:8px}label{font-size:13px;font-weight:600;color:#0d1340}
.form-input,.form-select{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;width:100%;box-sizing:border-box;background:white}
.form-textarea{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none;resize:vertical;width:100%;box-sizing:border-box;font-family:inherit}
.form-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:20px}
.btn-cancel{background:white;border:1.5px solid #e2e6f0;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;color:#0d1340;cursor:pointer}
.btn-save{background:#f97316;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;&:disabled{opacity:.5;cursor:not-allowed}}
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
.modal-card{background:white;border-radius:16px;padding:28px;width:560px;max-width:90%;box-shadow:0 8px 32px rgba(0,0,0,.15);max-height:85vh;overflow-y:auto}
.modal-pdf{width:640px}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;h2{margin:0;font-size:18px;font-weight:800;color:#0d1340}}
.modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280}
.pdf-form{display:flex;flex-direction:column;gap:16px}
.equipements-checkboxes{display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;border:1.5px solid #e2e6f0;border-radius:10px;padding:12px}
.visites-grid{display:flex;flex-direction:column;gap:8px;background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:10px;padding:12px}
.visites-check-grid{display:flex;flex-direction:column;gap:8px;background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:10px;padding:12px}
.visite-block{display:flex;flex-direction:column;gap:6px}
.visite-check-item{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;input[type=checkbox]{width:16px;height:16px;accent-color:#1C2B5A;cursor:pointer}}
.visite-check-label{font-size:13px;font-weight:600;color:#0d1340}
.visite-dates{display:flex;align-items:center;gap:8px;margin-left:24px}
.date-label{font-size:12px;color:#6b7280;white-space:nowrap}
.visite-row{display:flex;align-items:center;gap:8px}
.visite-label{font-size:12px;font-weight:600;color:#1C2B5A;width:80px;flex-shrink:0}
.small-date{padding:8px 10px!important;font-size:12px!important;flex:1}
.checkbox-item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;font-size:13px;color:#0d1340;&:hover{background:#f8f9fc}input[type=checkbox]{width:16px;height:16px;cursor:pointer;accent-color:#1C2B5A}}
.success-banner{background:#DCFCE7;color:#16A34A;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.error-banner{background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:10px;margin-bottom:16px}
.empty-state,.center-state{text-align:center;padding:48px;color:#9CA3AF;background:white;border-radius:16px}
  `]
})
export class BackofficePlanningComponent implements OnInit {
  interventions: any[] = [];
  filtered: any[] = [];
  equipements: any[] = [];
  contrats: any[] = [];
  isLoading = true;
  isSaving = false;
  showForm = false;
  showPdfModal = false;
  successMsg = "";
  errorMsg = "";
  search = ""; filterType = ""; filterMois = ""; filterStatut = "";
  editInv: any = null;
  editForm = { equipementId: null as number|null, type: "", date: "", description: "" };

  parcsList: string[] = [];
  equipementsParc: any[] = [];
  anneesList: number[] = [];

  pdfForm = {
    parc: "",
    annee: new Date().getFullYear(),
    date1debut: "", date1fin: "",
    date2debut: "", date2fin: "",
    date3debut: "", date3fin: "",
    date4debut: "", date4fin: ""
  };

  visitesCochees = [
    { num: 1, label: "1ère visite", dateDebut: "", dateFin: "", checked: false },
    { num: 2, label: "2ème visite", dateDebut: "", dateFin: "", checked: false },
    { num: 3, label: "3ème visite", dateDebut: "", dateFin: "", checked: false },
    { num: 4, label: "4ème visite", dateDebut: "", dateFin: "", checked: false },
  ];

  moisList = [
    {value:"01",label:"Janvier"},{value:"02",label:"Février"},{value:"03",label:"Mars"},
    {value:"04",label:"Avril"},{value:"05",label:"Mai"},{value:"06",label:"Juin"},
    {value:"07",label:"Juillet"},{value:"08",label:"Août"},{value:"09",label:"Septembre"},
    {value:"10",label:"Octobre"},{value:"11",label:"Novembre"},{value:"12",label:"Décembre"}
  ];

  form = { equipementId: null as number|null, type: "", date: "", description: "" };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.anneesList = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];


    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => { this.interventions = data; this.filtered = [...data]; this.isLoading = false; this.cdr.detectChanges(); }
    });
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => {
        this.equipements = data;
        this.parcsList = [...new Set(data.map((e: any) => e.parc).filter(Boolean))].sort() as string[];
        this.cdr.detectChanges();
      }
    });
    this.http.get<any[]>(`${environment.apiUrl}/contrats`).subscribe({
      next: (data) => { this.contrats = data; }
    });
  }



  resetVisites(): void {
    this.visitesCochees = [
      { num: 1, label: "1ère visite", dateDebut: "", dateFin: "", checked: false },
      { num: 2, label: "2ème visite", dateDebut: "", dateFin: "", checked: false },
      { num: 3, label: "3ème visite", dateDebut: "", dateFin: "", checked: false },
      { num: 4, label: "4ème visite", dateDebut: "", dateFin: "", checked: false },
    ];
  }

  onParcChange(): void {
    this.resetVisites();
    this.equipementsParc = this.equipements
      .filter(e => e.parc === this.pdfForm.parc)
      .map(e => ({ ...e, selected: true }));
    this.cdr.detectChanges();
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
    if (!this.form.equipementId || !this.form.type || !this.form.date) { this.errorMsg = "Champs obligatoires manquants."; return; }
    this.isSaving = true;
    const payload = { dateIntervention: this.form.date, type: this.form.type, statut: "EN_ATTENTE", descriptionPanne: this.form.description, equipement: { id: this.form.equipementId } };
    this.http.post(`${environment.apiUrl}/interventions`, payload).subscribe({
      next: (data: any) => {
        this.interventions.unshift(data); this.filtered = [...this.interventions];
        this.isSaving = false; this.successMsg = "Intervention créée !";
        this.form = { equipementId: null, type: "", date: "", description: "" };
        setTimeout(() => { this.showForm = false; this.successMsg = ""; this.cdr.detectChanges(); }, 2000);
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.errorMsg = "Erreur lors de la création."; }
    });
  }

  ouvrirEdit(inv: any): void {
    this.editInv = inv;
    this.editForm = { equipementId: inv.equipement?.id || null, type: inv.type, date: inv.dateIntervention, description: inv.descriptionPanne || "" };
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
    if (!confirm("Supprimer cette intervention ?")) return;
    this.http.delete(`${environment.apiUrl}/interventions/${id}`).subscribe({
      next: () => { this.interventions = this.interventions.filter(i => i.id !== id); this.filtered = this.filtered.filter(i => i.id !== id); this.cdr.detectChanges(); }
    });
  }

  async genererPDF(): Promise<void> {
    const selectedEquipements = this.equipementsParc.filter(e => e.selected);
    if (selectedEquipements.length === 0) return;

    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const annee = this.pdfForm.annee;
    const parc = this.pdfForm.parc;
    const today = new Date();
    const dateStr = today.toLocaleDateString("fr-FR");
    const contratClient = this.contrats.find(c => c.parc === parc || c.client === parc);
    const numMarche = contratClient?.reference || "—";
    const W = 210;
    const margin = 14;

    // EN-TÊTE GAUCHE
    doc.setFillColor(28, 43, 90);
    doc.rect(margin, 10, 35, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SCRIM", margin + 17.5, 18, { align: "center" });

    doc.setTextColor(28, 43, 90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(parc, margin, 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Client : " + parc, margin, 31);
    doc.text("Arrivée N° : ___________", margin, 36);
    doc.text("Date : ___________", margin, 41);

    // EN-TÊTE DROITE
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Rabat le " + dateStr, W - margin, 18, { align: "right" });
    doc.text("Client : " + parc, W - margin, 24, { align: "right" });
    doc.text("Ville : " + this.getVille(parc), W - margin, 29, { align: "right" });
    doc.text("Marché : " + numMarche, W - margin, 34, { align: "right" });

    // TITRE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    const titre = "Planning de la maintenance préventive " + annee;
    doc.text(titre, W / 2, 52, { align: "center" });
    doc.setLineWidth(0.5);
    const titreWidth = doc.getTextWidth(titre);
    doc.line(W / 2 - titreWidth / 2, 53, W / 2 + titreWidth / 2, 53);

    // PÉRIODES
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
    const visitesRaw = this.visitesCochees
      .filter(v => v.checked)
      .map(v => ({
        label: v.label,
        val: v.dateDebut && v.dateFin
          ? "Entre le " + formatDate(v.dateDebut) + " et le " + formatDate(v.dateFin)
          : "Entre le 01/" + String(v.num * 3).padStart(2,'0') + "/" + annee + " et le 31/" + String(v.num * 3).padStart(2,'0') + "/" + annee
      }));
    const visites = visitesRaw.map(v => v.val);

    // TABLEAU
    const visiteHeaders = visitesRaw.map(v => ({ content: v.label + "\n" + v.val, styles: { halign: "center" as const } }));
    const head = [[
      { content: "Désignation Appareil", styles: { halign: "center" as const } },
      { content: "N° Série", styles: { halign: "center" as const } },
      { content: "N° Inventaire", styles: { halign: "center" as const } },
      ...visiteHeaders
    ]];

    const emptyCells = visitesRaw.map(() => ({ content: "", styles: { halign: "center" as const } }));
    const body = selectedEquipements.map(e => [
      { content: (e.nom || "").toUpperCase() + "\nModèle : " + (e.modele || "—") + "\nMarque : PHILIPS MEDICAL SYSTEMS", styles: { halign: "left" as const } },
      { content: e.numeroSerie || "—", styles: { halign: "center" as const } },
      { content: e.numInventaire || "—", styles: { halign: "center" as const } },
      ...emptyCells
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      startY: 58,
      margin: { left: margin, right: margin },
      styles: { font: "helvetica", fontSize: 8, cellPadding: 3, valign: "middle", lineColor: [0, 0, 0], lineWidth: 0.3 },
      headStyles: { fillColor: [28, 43, 90], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", valign: "middle" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: (() => {
        const cols: any = { 0: { cellWidth: 55 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 } };
        const visiteCellWidth = visitesRaw.length > 0 ? Math.floor((210 - 14*2 - 55 - 22 - 22) / visitesRaw.length) : 25;
        visitesRaw.forEach((_, idx) => { cols[idx + 3] = { cellWidth: visiteCellWidth }; });
        return cols;
      })(),
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Page " + data.pageNumber, W / 2, 290, { align: "center" });
      }
    });

    // SIGNATURES
    const finalY = (doc as any).lastAutoTable?.finalY + 15 || 220;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Direction Technique SCRIM", margin, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("sav@scrim.ma", margin, finalY + 5);
    doc.text("N°Eco Scrim : 0802 000 089", margin, finalY + 10);
    doc.rect(margin, finalY + 14, 75, 30);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Cachet et signature SCRIM", margin + 37.5, finalY + 29, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(parc, W - margin - 75, finalY);
    doc.rect(W - margin - 75, finalY + 14, 75, 30);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Cachet et signature client", W - margin - 37.5, finalY + 29, { align: "center" });

    doc.save("Planning_Preventif_" + parc.replace(/ /g, "_") + "_" + annee + ".pdf");

    // Créer les interventions en base
    const equipementsCoches = this.equipementsParc.filter(e => e.selected).map(e => ({ id: e.id, nom: e.nom }));
    console.log('VISITES:', JSON.stringify(this.visitesCochees));
    const anneeStr = String(annee);
    const defaultDates: {[key:number]:string} = {1: anneeStr+'-03-15', 2: anneeStr+'-06-15', 3: anneeStr+'-09-15', 4: anneeStr+'-12-15'};
    const visitesDates = this.visitesCochees.filter(v => v.checked).map(v => v.dateDebut || defaultDates[v.num]);
    this.http.post(`${environment.apiUrl}/interventions/generer-planning`, {
      annee: annee,
      equipements: equipementsCoches,
      visitesDates: visitesDates
    }).subscribe({
      next: (res: any) => {
        this.successMsg = "✅ Planning généré — " + res.interventionsCreees + " interventions créées et disponibles pour assignation";
        this.showPdfModal = false;
        this.ngOnInit();
        this.cdr.detectChanges();
        setTimeout(() => { this.successMsg = ""; this.cdr.detectChanges(); }, 5000);
      },
      error: () => {
        this.showPdfModal = false;
      }
    });
  }

  getVille(parc: string): string {
    const villes: {[key: string]: string} = {
      "CHU Tanger": "Tanger", "HCK Casablanca": "Casablanca", "CHU Mohamed VI Oujda": "Oujda",
      "Hopital Ghassani Fes": "Fès", "ODM Fes": "Fès", "HCZ Rabat": "Rabat",
      "Dr Louah Rabat": "Rabat", "Dr Loubaris Rabat": "Rabat", "Clinique Slaoui Rabat": "Rabat",
      "Daoud Layla Rabat": "Rabat", "Clinique Dar DMANA Ouazzane": "Ouazzane",
      "Dr SAFI Asfi": "Safi", "Dr HADI Safi": "Safi", "Dr Boudhar Safi": "Safi",
      "Dr Lamhani Marrakech": "Marrakech", "Clinique Ibn Sina Tanger": "Tanger",
      "Dr SALMI Najlae Témara": "Témara", "Dr Agharabi Témarra": "Témara",
      "Promamec Bouskoura": "Bouskoura", "Dr EZ-ZAHRAOUI Casablanca": "Casablanca",
      "Dr ESSAKET Bani Mellal": "Beni Mellal", "Clinique Tarik Ibn Ziyad": "Tanger"
    };
    return villes[parc] || "—";
  }

  formatMonth(date: string): string {
    if (!date) return "";
    const mois = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
    return mois[new Date(date).getMonth()];
  }
  formatDay(date: string): string { return date ? String(new Date(date).getDate()).padStart(2, "0") : "—"; }
  getTypeClass(t: string): string { return t === "CORRECTIF" ? "type-correctif" : "type-preventif"; }
}
