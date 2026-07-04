import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CacheService } from '../../services/cache.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1>Bonjour, {{ nom && prenom ? prenom + ' ' + nom : email }} 👋</h1>
      <p>{{ getDateFr() }}</p>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card blue">
      <div class="kpi-icon">⚙</div>
      <div><div class="kpi-value">{{ mesInterventions.length }}</div><div class="kpi-label">Mes interventions</div></div>
    </div>
    <div class="kpi-card orange">
      <div class="kpi-icon">🔄</div>
      <div><div class="kpi-value">{{ getCount('EN_COURS') }}</div><div class="kpi-label">En cours</div></div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-icon">✅</div>
      <div><div class="kpi-value">{{ getCount('TERMINEE') }}</div><div class="kpi-label">Terminées</div></div>
    </div>

  </div>

  <!-- Interventions urgentes -->
  <div class="urgent-section" *ngIf="interventionsUrgentes.length > 0">
    <div class="urgent-header">
      <span class="urgent-icon">🚨</span>
      <h2>Interventions urgentes</h2>
      <span class="urgent-count">{{ interventionsUrgentes.length }}</span>
    </div>
    <div *ngFor="let inv of interventionsUrgentes" class="urgent-row" (click)="router.navigate(['/fse/interventions'])">
      <div class="urgent-left">
        <span class="type-badge type-correctif">{{ inv.type }}</span>
        <div>
          <div class="inv-equip">{{ inv.equipement?.nom || '—' }}</div>
          <div class="inv-site">🏥 {{ inv.equipement?.parc || '—' }}</div>
        </div>
      </div>
      <div class="urgent-right">
        <span class="date-text">📅 {{ formatDate(inv.dateIntervention) }}</span>
        <span class="statut-badge statut-en_cours"><span class="dot"></span>{{ inv.statut }}</span>
      </div>
    </div>
  </div>

  <div class="sections-row">
    <!-- Interventions du jour -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-icon orange">📅</div>
        <h2>Interventions du jour</h2>
        <span class="count-badge">{{ interventionsAujourdhui.length }}</span>
      </div>
      <div *ngIf="interventionsAujourdhui.length === 0" class="empty-state">
        <p>✅ Aucune intervention prévue aujourd'hui</p>
      </div>
      <div *ngFor="let inv of interventionsAujourdhui" class="inv-item" (click)="router.navigate(['/fse/interventions'])">
        <div class="inv-left">
          <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
          <div>
            <div class="inv-equip">{{ inv.equipement?.nom || '—' }}</div>
            <div class="inv-site">🏥 {{ inv.equipement?.parc || '—' }}</div>
          </div>
        </div>
        <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)">
          <span class="dot"></span>{{ inv.statut }}
        </span>
      </div>
    </div>


  </div>
</div>`,
  styles: [`
.page-container{max-width:1100px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}
p{margin:4px 0 0;color:#6b7280;font-size:13px}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.kpi-card{background:white;border-radius:16px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06);display:flex;align-items:center;gap:16px}
.kpi-icon{font-size:28px}
.kpi-value{font-size:28px;font-weight:800;color:#0d1340}
.kpi-label{font-size:13px;color:#6b7280}
.blue{border-top:4px solid #1a2eff}.orange{border-top:4px solid #f97316}.green{border-top:4px solid #16A34A}.purple{border-top:4px solid #7C3AED}
.urgent-section{background:#FEF2F2;border:1.5px solid #FECACA;border-radius:16px;padding:20px;margin-bottom:24px}
.urgent-header{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.urgent-icon{font-size:20px}
h2{margin:0;font-size:15px;font-weight:700;color:#0d1340}
.urgent-count{background:#DC2626;color:white;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700}
.urgent-row{display:flex;justify-content:space-between;align-items:center;padding:12px;background:white;border-radius:10px;margin-bottom:8px;cursor:pointer;border-left:4px solid #DC2626}
.urgent-row:last-child{margin-bottom:0}
.urgent-left,.inv-left{display:flex;align-items:center;gap:10px}
.urgent-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.date-text{font-size:12px;color:#6b7280}
.sections-row{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.section-card{background:white;border-radius:16px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.section-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
.section-icon.orange{background:#FFF7ED}.section-icon.blue{background:#EFF6FF}
.count-badge{background:#EFF6FF;color:#1a2eff;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;margin-left:auto}
.inv-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f3f5;cursor:pointer}
.inv-item:last-child{border-bottom:none}
.inv-item:hover{background:#f8f9ff;border-radius:8px;padding:10px 8px}
.inv-equip{font-size:13px;font-weight:600;color:#0d1340}
.inv-site{font-size:11px;color:#6b7280;margin-top:2px}
.type-badge{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;flex-shrink:0}
.type-correctif{background:#FEE2E2;color:#DC2626}
.type-preventif{background:#DCFCE7;color:#16A34A}
.type-maj{background:#DBEAFE;color:#1a2eff}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;flex-shrink:0}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.statut-terminee{background:#DCFCE7;color:#16A34A}
.statut-en_cours{background:#DBEAFE;color:#1D4ED8}
.statut-en_attente{background:#FEF9C3;color:#CA8A04}
.statut-en_attente_validation{background:#F3E8FF;color:#7C3AED}
.empty-state{text-align:center;padding:20px;color:#9CA3AF;font-size:13px}
  `]
})
export class FseDashboardComponent implements OnInit {
  email = '';
  nom = '';
  prenom = '';
  userId = 0;
  today = new Date();
  mesInterventions: any[] = [];
  interventionsAujourdhui: any[] = [];
  interventionsUrgentes: any[] = [];

  constructor(private cache: CacheService, private http: HttpClient, public router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.email = localStorage.getItem('email') || '';
    this.nom = localStorage.getItem('nom') || '';
    this.prenom = localStorage.getItem('prenom') || '';
    this.userId = Number(localStorage.getItem('userId')) || 0;
    const cached = this.cache.get('fse_interventions');
    if (cached) {
      this.mesInterventions = cached.filter((i: any) =>
        i.technicien?.id === this.userId || i.nomFse === this.prenom ||
        i.nomFse === this.nom || i.nomFse === (this.prenom + ' ' + this.nom).trim()
      );
      this.cdr.detectChanges();
    }
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.mesInterventions = data.filter(i =>
          i.technicien?.id === this.userId ||
          i.nomFse === this.prenom ||
          i.nomFse === this.nom ||
          i.nomFse === this.email ||
          i.nomFse === (this.prenom + ' ' + this.nom).trim() ||
          i.nomFse === (this.nom + ' ' + this.prenom).trim()
        );
        const todayStr = new Date().toISOString().slice(0, 10);
        this.interventionsAujourdhui = this.mesInterventions.filter(i =>
          i.dateIntervention?.startsWith(todayStr)
        );
        this.interventionsUrgentes = this.mesInterventions.filter(i =>
          i.statut === 'EN_COURS' && i.type === 'CORRECTIF'
        );
        this.cdr.detectChanges();
      }
    });
  }

  getDateFr(): string {
    const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const d = new Date();
    return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const mois = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    const d = new Date(date);
    return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
  }

  getCount(statut: string): number { return this.mesInterventions.filter(i => i.statut === statut).length; }
  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : t === 'PREVENTIF' ? 'type-preventif' : 'type-maj'; }
  getStatutClass(s: string): string {
    switch(s) {
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_COURS': return 'statut-en_cours';
      case 'EN_ATTENTE_VALIDATION': return 'statut-en_attente_validation';
      default: return 'statut-en_attente';
    }
  }
}
