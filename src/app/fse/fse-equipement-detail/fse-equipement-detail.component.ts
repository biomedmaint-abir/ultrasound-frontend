import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-equipement-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <button class="back-btn" (click)="router.navigate(['/fse/equipements'])">←</button>
    <div>
      <h1>{{ equipement?.nom || 'Équipement' }}</h1>
      <p>{{ equipement?.parc }} — {{ equipement?.service }}</p>
    </div>
  </div>

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>

  <div *ngIf="equipement && !isLoading">
    <div class="info-card">
      <div class="section-header"><div class="section-icon">🔬</div><h2>Informations équipement</h2></div>
      <div class="info-row"><span class="label">Modèle</span><span class="value">{{ equipement.nom }}</span></div>
      <div class="info-row"><span class="label">N° Série</span><span class="value">{{ equipement.numeroSerie || '—' }}</span></div>
      <div class="info-row"><span class="label">Site / Parc</span><span class="value">{{ equipement.parc || '—' }}</span></div>
      <div class="info-row"><span class="label">Service</span><span class="value">{{ equipement.service || '—' }}</span></div>
      <div class="info-row"><span class="label">Statut</span>
        <span class="statut-badge" [ngClass]="getStatutClass(equipement.statut)">
          <span class="dot"></span>{{ getStatutLabel(equipement.statut) }}
        </span>
      </div>
    </div>

    <div class="historique-card">
      <div class="section-header"><div class="section-icon">📋</div><h2>Historique des interventions</h2><span class="count">{{ interventions.length }}</span></div>
      <div *ngIf="interventions.length === 0" class="empty-state"><p>Aucune intervention sur cet équipement.</p></div>
      <div *ngFor="let inv of interventions" class="inv-item">
        <div class="inv-left">
          <div class="date-block" [ngClass]="getTypeClass(inv.type)">
            <span class="date-month">{{ formatMonth(inv.dateIntervention) }}</span>
            <span class="date-day">{{ formatDay(inv.dateIntervention) }}</span>
          </div>
          <div>
            <div class="inv-type"><span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span></div>
            <div class="inv-desc">{{ inv.descriptionPanne || '—' }}</div>
          </div>
        </div>
        <span class="statut-badge" [ngClass]="getStatutInvClass(inv.statut)">
          <span class="dot"></span>{{ inv.statut }}
        </span>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.back-btn{background:none;border:none;font-size:20px;cursor:pointer;color:#0d1340;padding:4px 8px;border-radius:8px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:0;font-size:13px;color:#6b7280}
.info-card,.historique-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:20px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.section-icon{width:36px;height:36px;background:#EFF6FF;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
h2{margin:0;font-size:16px;font-weight:700;color:#0d1340;flex:1}
.count{background:#EFF6FF;color:#1a2eff;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700}
.info-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f3f5}
.info-row:last-child{border-bottom:none}
.label{font-size:13px;color:#6b7280}.value{font-size:14px;color:#0d1340;font-weight:600}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.statut-service{background:#DCFCE7;color:#16A34A}.statut-maintenance{background:#FEF9C3;color:#CA8A04}.statut-panne{background:#FEE2E2;color:#DC2626}.statut-default{background:#F3F4F6;color:#6B7280}
.inv-item{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f3f5}
.inv-item:last-child{border-bottom:none}
.inv-left{display:flex;align-items:center;gap:12px}
.date-block{display:flex;flex-direction:column;align-items:center;padding:8px 12px;border-radius:8px;min-width:50px;text-align:center}
.date-month{font-size:9px;font-weight:700;text-transform:uppercase}.date-day{font-size:18px;font-weight:800;line-height:1.1}
.type-correctif{background:#FEE2E2;color:#DC2626}.type-preventif{background:#DCFCE7;color:#16A34A}.type-maj{background:#DBEAFE;color:#1a2eff}
.type-badge{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.inv-desc{font-size:12px;color:#6b7280;margin-top:3px}
.statut-terminee{background:#DCFCE7;color:#16A34A}.statut-en_cours{background:#DBEAFE;color:#1D4ED8}.statut-en_attente{background:#FEF9C3;color:#CA8A04}
.empty-state,.center-state{text-align:center;padding:32px;color:#9CA3AF;font-size:13px}
  `]
})
export class FseEquipementDetailComponent implements OnInit {
  equipement: any = null;
  interventions: any[] = [];
  isLoading = true;

  constructor(private http: HttpClient, public router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<any>(`${environment.apiUrl}/equipements/${id}`).subscribe({
        next: (data) => { this.equipement = data; this.isLoading = false; this.cdr.detectChanges(); }
      });
      this.http.get<any[]>(`${environment.apiUrl}/interventions/equipement/${id}`).subscribe({
        next: (data) => { this.interventions = data; this.cdr.detectChanges(); },
        error: () => {}
      });
    }
  }

  formatMonth(date: string): string {
    if (!date) return '';
    const mois = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    return mois[new Date(date).getMonth()];
  }
  formatDay(date: string): string { return date ? String(new Date(date).getDate()).padStart(2, '0') : '—'; }
  getStatutClass(s: string): string { return s === 'EN_SERVICE' ? 'statut-service' : s === 'EN_MAINTENANCE' ? 'statut-maintenance' : s === 'EN_PANNE' ? 'statut-panne' : 'statut-default'; }
  getStatutLabel(s: string): string { return s === 'EN_SERVICE' ? '🟢 Opérationnel' : s === 'EN_MAINTENANCE' ? '🟡 En maintenance' : s === 'EN_PANNE' ? '🔴 En panne' : '⚪ Inconnu'; }
  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : t === 'PREVENTIF' ? 'type-preventif' : 'type-maj'; }
  getStatutInvClass(s: string): string { return s === 'TERMINEE' ? 'statut-terminee' : s === 'EN_COURS' ? 'statut-en_cours' : 'statut-en_attente'; }
}
