import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chefpole-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1>Mon Planning</h1>
      <p>Assignation des FSE aux interventions</p>
    </div>
  </div>

  <!-- 1. INTERVENTIONS BLOQUÉES PAR FSE - EN HAUT -->
  <div class="bloquees-section" *ngIf="interventionsBloquees.length > 0">
    <div class="bloquees-header">
      <span class="bloquees-icon">🚫</span>
      <h2 class="bloquees-title">Interventions bloquées</h2>
      <span class="badge-red">{{ interventionsBloquees.length }}</span>
    </div>
    <div class="bloquees-grid">
      <div *ngFor="let inv of interventionsBloquees" class="bloquee-card">
        <div class="bloquee-card-top">
          <div class="date-block" [ngClass]="getTypeClass(inv.type)">
            <span class="date-month">{{ formatMonth(inv.dateIntervention) }}</span>
            <span class="date-day">{{ formatDay(inv.dateIntervention) }}</span>
          </div>
          <div class="bloquee-info">
            <div class="bloquee-equip">{{ inv.equipement?.nom || '—' }}</div>
            <div class="bloquee-site">🏥 {{ inv.equipement?.parc || '—' }}</div>
            <div class="bloquee-motif">⚠️ Motif : {{ inv.commentaireRejet?.replace('BLOCAGE FSE: ', '') }}</div>
            <div class="bloquee-fse">👤 FSE actuel : {{ inv.nomFse || 'Non assigné' }}</div>
          </div>
          <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        </div>
        <div class="bloquee-card-bottom">
          <div *ngIf="!showSelectFse[inv.id]">
            <button class="btn-reassigner" (click)="showSelectFse[inv.id] = true">
              👤 Réassigner FSE →
            </button>
          </div>
          <div *ngIf="showSelectFse[inv.id]" class="fse-selector">
            <select [(ngModel)]="selectedFse[inv.id]" class="fse-select">
              <option [ngValue]="null">-- Sélectionner un FSE --</option>
              <option *ngFor="let fse of fseList" [ngValue]="fse.id">
                {{ fse.prenom }} {{ fse.nom }}
              </option>
            </select>
            <div class="fse-actions">
              <button class="btn-cancel-small" (click)="showSelectFse[inv.id] = false">Annuler</button>
              <button class="btn-confirmer" (click)="reassignerFse(inv)" [disabled]="!selectedFse[inv.id]">✅ Confirmer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. INTERVENTIONS À ASSIGNER -->
  <div class="alert-section" *ngIf="nonAssignees.length > 0">
    <div class="alert-header">
      <span>🚨</span>
      <h2>Interventions à assigner</h2>
      <span class="alert-count">{{ nonAssignees.length }}</span>
    </div>
    <div *ngFor="let inv of nonAssignees" class="alert-row">
      <div class="inv-left">
        <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        <div>
          <div class="inv-title">{{ inv.equipement?.nom || '—' }}</div>
          <div class="inv-sub">{{ inv.equipement?.parc || '—' }} — {{ inv.dateIntervention | date:'dd/MM/yyyy' }}</div>
          <div class="inv-desc" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</div>
        </div>
      </div>
      <div class="inv-actions">
        <select [(ngModel)]="selectedFse[inv.id]" class="fse-select">
          <option [ngValue]="null">-- Sélectionner FSE --</option>
          <option *ngFor="let fse of fseList" [ngValue]="fse.id">{{ fse.prenom }} {{ fse.nom }}</option>
        </select>
        <button class="btn-assigner" (click)="assignerFse(inv)" [disabled]="!selectedFse[inv.id]">
          👤 Assigner →
        </button>
      </div>
    </div>
  </div>

  <div class="all-section">
    <div class="section-title">
      <h2>Toutes les interventions</h2>
      <span class="count">{{ interventions.length }}</span>
    </div>
    <div *ngFor="let inv of interventions" class="inv-card">
      <div class="inv-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ formatMonth(inv.dateIntervention) }}</span>
          <span class="date-day">{{ formatDay(inv.dateIntervention) }}</span>
        </div>
        <div>
          <div class="inv-title">{{ inv.equipement?.nom || '—' }}</div>
          <div class="inv-sub">{{ inv.equipement?.parc || '—' }}</div>
        </div>
      </div>
      <div class="inv-right">
        <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        <span class="fse-label" *ngIf="inv.nomFse">👤 {{ inv.nomFse }}</span>
        <span class="non-assigne" *ngIf="!inv.nomFse">⚠️ Non assignée</span>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:1000px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px;h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:0;font-size:13px;color:#6b7280}}
.alert-section{background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px;border-left:4px solid #DC2626}
.alert-header{display:flex;align-items:center;gap:12px;padding:16px 20px;background:#FEF2F2;border-bottom:1px solid #f1f3f5;h2{margin:0;font-size:16px;font-weight:700;color:#0d1340;flex:1}.alert-count{background:#DC2626;color:white;padding:2px 12px;border-radius:20px;font-size:13px;font-weight:700}}
.alert-row{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #f1f3f5;&:last-child{border-bottom:none}}
.inv-actions{display:flex;gap:10px;align-items:center}
.fse-select{padding:8px 12px;border:1.5px solid #e2e6f0;border-radius:8px;font-size:13px;color:#0d1340;background:white;outline:none;min-width:180px}
.btn-assigner{background:#16A34A;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;&:disabled{opacity:.5;cursor:not-allowed}}
.all-section{background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.section-title{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid #f1f3f5;h2{margin:0;font-size:16px;font-weight:700;color:#0d1340;flex:1}.count{background:#EFF6FF;color:#1a2eff;padding:2px 12px;border-radius:20px;font-size:13px;font-weight:700}}
.inv-card{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #f1f3f5;&:last-child{border-bottom:none}}
.inv-left{display:flex;align-items:center;gap:12px}
.date-block{display:flex;flex-direction:column;align-items:center;padding:8px 12px;border-radius:8px;min-width:50px;text-align:center}
.date-month{font-size:9px;font-weight:700;text-transform:uppercase}.date-day{font-size:18px;font-weight:800;line-height:1.1}
.type-correctif{background:#FEE2E2;color:#DC2626}.type-preventif{background:#DCFCE7;color:#16A34A}
.inv-title{font-size:14px;font-weight:700;color:#0d1340}.inv-sub{font-size:12px;color:#6b7280}.inv-desc{font-size:11px;color:#9CA3AF}
.inv-right{display:flex;align-items:center;gap:10px}
.type-badge{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.fse-label{font-size:12px;color:#16A34A;font-weight:600}
.non-assigne{font-size:12px;color:#DC2626;font-weight:600}
  `]
})
export class ChefPolePlanningComponent implements OnInit, OnDestroy {
  interventions: any[] = [];
  nonAssignees: any[] = [];
  interventionsBloquees: any[] = [];
  fseList: any[] = [];
  selectedFse: { [key: number]: number | null } = {};
  showSelectFse: { [key: number]: boolean } = {};
  isSaving = false;
  private refreshSub: Subscription | null = null;
  isLoading = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData();
    this.refreshSub = interval(30000).subscribe(() => this.loadData());
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs/fse-disponibles`).subscribe({
      next: (data) => { this.fseList = data; this.cdr.detectChanges(); }
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data;
        this.nonAssignees = data.filter((i: any) => (!i.nomFse || i.nomFse.trim() === '') && !i.technicien);
        this.interventionsBloquees = data.filter((i: any) => i.commentaireRejet && i.commentaireRejet.startsWith('BLOCAGE FSE:') && i.statut !== 'TERMINEE');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  assignerFse(inv: any): void {
    const fseId = this.selectedFse[inv.id];
    if (!fseId) return;
    const fse = this.fseList.find((f: any) => f.id === fseId);
    const nomFse = fse ? ((fse.prenom || '') + ' ' + (fse.nom || '')).trim() : '';
    this.http.put(`${environment.apiUrl}/interventions/${inv.id}/assigner-fse`, { fseId, nomFse }).subscribe({
      next: () => {
        inv.nomFse = nomFse;
        inv.technicien = { id: fseId };
        this.nonAssignees = this.nonAssignees.filter(i => i.id !== inv.id);
        this.cdr.detectChanges();
      }
    });
  }

  reassignerFse(inv: any): void {
    const fseId = this.selectedFse[inv.id];
    if (!fseId) return;
    this.isSaving = true;
    const fse = this.fseList.find((f: any) => f.id === fseId);
    const nomFse = fse ? ((fse.prenom || '') + ' ' + (fse.nom || '')).trim() : '';
    this.http.put(`${environment.apiUrl}/interventions/${inv.id}/assigner-fse`, { fseId, nomFse }).subscribe({
      next: () => {
        this.interventionsBloquees = this.interventionsBloquees.filter(i => i.id !== inv.id);
        inv.nomFse = nomFse;
        inv.commentaireRejet = null;
        this.showSelectFse[inv.id] = false;
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; }
    });
  }

  formatMonth(date: string): string {
    if (!date) return '';
    const mois = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    return mois[new Date(date).getMonth()];
  }
  formatDay(date: string): string { return date ? String(new Date(date).getDate()).padStart(2, '0') : '—'; }
  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : 'type-preventif'; }
}
