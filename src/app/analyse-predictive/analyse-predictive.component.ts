import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CacheService } from '../services/cache.service';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-analyse-predictive',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
<ng-container *ngIf="!detailMode">
<div class="page">
  <div class="page-header">
    <div>
      <h1>📈 Analyse prédictive</h1>
      <p>Détection et prévention des anomalies basées sur l'historique des interventions</p>
    </div>
    <div class="header-right">
      <div class="periode-btns">
        <button *ngFor="let p of periodes" [class.active]="periode === p.val" (click)="setPeriode(p.val)">{{ p.label }}</button>
      </div>
      <button class="btn-refresh" (click)="loadData()">🔄 Actualiser</button>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card kpi-blue"><div class="kpi-icon">🧠</div><div class="kpi-info"><div class="kpi-val">{{ equipements.length }}</div><div class="kpi-label">Analyses actives</div></div></div>
    <div class="kpi-card kpi-red"><div class="kpi-icon">⚠️</div><div class="kpi-info"><div class="kpi-val">{{ critiques }}</div><div class="kpi-label">Alertes critiques</div></div></div>
    <div class="kpi-card kpi-orange"><div class="kpi-icon">🕐</div><div class="kpi-info"><div class="kpi-val">{{ avertissements }}</div><div class="kpi-label">Avertissements</div></div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-info"><div class="kpi-val">{{ normaux }}</div><div class="kpi-label">États normaux</div></div></div>
  </div>

  <div *ngIf="isLoading" class="loading">Chargement des analyses...</div>

  <div class="equip-grid" *ngIf="!isLoading">
    <div *ngFor="let eq of equipements" class="equip-card">
      <div class="card-header">
        <div class="card-header-left">
          <div class="card-nom">{{ eq.nom }} ({{ eq.parc }})</div>
          <div class="card-sub">Probabilité</div>
          <div class="badges-row">
            <span class="badge-niveau" [ngClass]="'badge-' + eq.couleur">{{ eq.niveau }}</span>
            <span *ngIf="eq.statut === 'EN_MAINTENANCE'" class="badge-hors">HORS SERVICE</span>
            <span *ngIf="eq.sousContrat" class="badge-contrat">Sous contrat</span>
          </div>
        </div>
        <div class="card-pct" [ngClass]="'pct-' + eq.couleur">{{ eq.probabilite }}%</div>
      </div>
      <div class="card-desc">{{ getDesc(eq) }}</div>
      <div class="sparkline-wrap" [ngClass]="'spark-bg-' + eq.couleur">
        <svg viewBox="0 0 120 50" preserveAspectRatio="none" class="sparkline">
          <polyline [attr.points]="getSparkPoints(eq)" fill="none" [attr.stroke]="getColor(eq.couleur)" stroke-width="2"/>
        </svg>
      </div>
      <button class="btn-detail" (click)="voirDetail(eq.id)">Voir les détails →</button>
    </div>
  </div>
</div>
</ng-container>

<ng-container *ngIf="detailMode && detail">
  <div class="page">
    <button class="btn-back" (click)="retourListe()">← Retour</button>
    <div class="detail-header">
      <div class="detail-header-top">
        <span>⚙️</span><span class="detail-nom">{{ detail.nom }}</span>
        <span class="detail-date">{{ today | date:'dd/MM/yyyy' }}</span>
      </div>
      <div class="detail-sub">
        <span class="badge-niveau" [ngClass]="'badge-' + detail.couleur">{{ detail.niveau }}</span>
        <span class="badge-pct">{{ detail.probabilite }}%</span>
        <span class="detail-loc">📍 {{ detail.service }}, {{ detail.parc }}</span>
        <span class="detail-id">ID : {{ detail.id }}</span>
      </div>
    </div>
    <div class="bloc">
      <div class="info-grid">
        <div><div class="info-label">Marque & Modèle</div><div class="info-val">Philips {{ detail.nom }}</div></div>
        <div><div class="info-label">Type</div><div class="info-val">{{ detail.service || '—' }}</div></div>
        <div><div class="info-label">Statut</div>
          <span *ngIf="detail.statut === 'EN_SERVICE'" class="badge-actif">EN SERVICE</span>
          <span *ngIf="detail.statut !== 'EN_SERVICE'" class="badge-maint">{{ detail.statut }}</span>
        </div>
        <div><div class="info-label">Âge</div><div class="info-val">{{ detail.age }} ans</div></div>
        <div><div class="info-label">Pannes 12 mois</div><div class="info-val">{{ detail.pannes12mois }}</div></div>
        <div><div class="info-label">Contrat</div><div class="info-val">{{ detail.sousContrat ? 'Actif' : 'Hors contrat' }}</div></div>
      </div>
    </div>
    <div class="alerte-bloc">
      <span>⚠️</span>
      <div class="alerte-text">
        <strong>Analyse IA :</strong>
        <span *ngIf="detail.couleur === 'rouge'"> Forte probabilité de défaillance ({{ detail.probabilite }}%). Attention immédiate requise.</span>
        <span *ngIf="detail.couleur === 'orange'"> Probabilité modérée ({{ detail.probabilite }}%). Inspection préventive recommandée.</span>
        <span *ngIf="detail.couleur === 'vert'"> Équipement en bon état. Maintenir le planning préventif.</span>
      </div>
    </div>
    <div class="reco-bloc">
      <div class="reco-title">💡 Recommandations</div>
      <ul class="reco-list">
        <ng-container *ngIf="detail.couleur === 'rouge'">
          <li>Programmer une intervention corrective dans les 48h</li>
          <li>Inspection complète des composants critiques</li>
          <li>Préparer les pièces de rechange nécessaires</li>
        </ng-container>
        <ng-container *ngIf="detail.couleur === 'orange'">
          <li>Planifier une visite préventive dans les 15 jours</li>
          <li>Vérifier les composants les plus sollicités</li>
          <li>Signaler au chef de pôle pour planification</li>
        </ng-container>
        <ng-container *ngIf="detail.couleur === 'vert'">
          <li>Maintenir le planning préventif actuel</li>
          <li>Continuer les visites selon le contrat</li>
        </ng-container>
      </ul>
    </div>
    <div class="date-bloc">🕐 Analysé le {{ today | date:'dd/MM/yyyy' }} à {{ today | date:'HH:mm' }}</div>
  </div>
</ng-container>
  `,
  styles: [`
.page{padding:28px 32px;background:#F9FAFB;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
.page-header h1{font-size:26px;font-weight:800;color:#0d1340;margin:0}
.page-header p{font-size:13px;color:#6B7280;margin:4px 0 0}
.header-right{display:flex;align-items:center;gap:12px}
.periode-btns{display:flex;gap:6px}
.periode-btns button{padding:7px 14px;border:1.5px solid #e2e6f0;border-radius:8px;background:white;font-size:13px;font-weight:600;color:#374151;cursor:pointer}
.periode-btns button.active{background:#1C2B5A;color:white;border-color:#1C2B5A}
.btn-refresh{background:white;border:1.5px solid #e2e6f0;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.kpi-card{border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;color:white}
.kpi-icon{font-size:28px}
.kpi-val{font-size:32px;font-weight:800;line-height:1}
.kpi-label{font-size:13px;opacity:.9;margin-top:4px}
.kpi-blue{background:#3B82F6}
.kpi-red{background:#DC2626}
.kpi-orange{background:#F59E0B}
.kpi-green{background:#16A34A}
.loading{text-align:center;padding:40px;color:#6B7280}
.equip-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.equip-card{background:white;border-radius:12px;padding:20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:12px}
.card-header{display:flex;justify-content:space-between;align-items:flex-start}
.card-nom{font-size:14px;font-weight:700;color:#111827;margin-bottom:2px}
.card-sub{font-size:11px;color:#6B7280;margin-bottom:6px}
.badges-row{display:flex;gap:6px;flex-wrap:wrap}
.card-pct{font-size:28px;font-weight:800}
.pct-rouge{color:#DC2626}.pct-orange{color:#F59E0B}.pct-vert{color:#16A34A}
.badge-rouge{background:#FEE2E2;color:#DC2626;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.badge-orange{background:#FFF7ED;color:#F59E0B;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.badge-vert{background:#DCFCE7;color:#16A34A;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.badge-hors{background:#FEE2E2;color:#DC2626;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.badge-contrat{background:#EFF6FF;color:#3B82F6;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.card-desc{font-size:12px;color:#6B7280;line-height:1.5}
.sparkline-wrap{border-radius:8px;padding:8px;height:60px}
.spark-bg-rouge{background:#FEE2E2}.spark-bg-orange{background:#FFF7ED}.spark-bg-vert{background:#DCFCE7}
.sparkline{width:100%;height:100%}
.btn-detail{background:white;border:1.5px solid #e2e6f0;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;color:#374151;width:100%}
.btn-back{background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:16px}
.detail-header{background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 6px rgba(0,0,0,.06)}
.detail-header-top{display:flex;align-items:center;gap:12px;margin-bottom:8px;font-size:22px;font-weight:800;color:#0d1340}
.detail-nom{font-size:22px;font-weight:800;color:#0d1340;flex:1}
.detail-date{font-size:12px;color:#9CA3AF}
.detail-sub{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.detail-loc{font-size:13px;color:#6B7280}
.detail-id{margin-left:auto;font-size:12px;color:#9CA3AF}
.badge-pct{background:#F3F4F6;color:#374151;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
.bloc{background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 6px rgba(0,0,0,.06)}
.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.info-label{font-size:11px;color:#9CA3AF;font-weight:600;margin-bottom:4px}
.info-val{font-size:14px;font-weight:700;color:#0d1340}
.badge-actif{background:#DCFCE7;color:#16A34A;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}
.badge-maint{background:#FFF7ED;color:#F59E0B;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}
.alerte-bloc{background:#FEE2E2;border-left:4px solid #DC2626;border-radius:12px;padding:16px 20px;margin-bottom:16px;display:flex;gap:12px;font-size:13px;color:#7F1D1D}
.alerte-text{line-height:1.6}
.reco-bloc{background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:12px;padding:16px 20px;margin-bottom:16px}
.reco-title{font-size:14px;font-weight:700;color:#92400E;margin-bottom:10px}
.reco-list{list-style:none;padding:0;margin:0}
.reco-list li{font-size:13px;color:#78350F;padding:4px 0 4px 16px;position:relative}
.reco-list li::before{content:"•";position:absolute;left:0;color:#F59E0B}
.date-bloc{background:white;border-radius:12px;padding:14px 20px;font-size:13px;color:#6B7280;box-shadow:0 1px 6px rgba(0,0,0,.06)}
  `]
})
export class AnalysePredictiveComponent implements OnInit {
  equipements: any[] = [];
  detail: any = null;
  detailMode = false;
  isLoading = true;
  today = new Date();
  periode = 3;
  periodes = [{val:1,label:'1M'},{val:3,label:'3M'},{val:6,label:'6M'}];

  get critiques() { return this.equipements.filter(e => e.probabilite >= 80).length; }
  get avertissements() { return this.equipements.filter(e => e.probabilite >= 50 && e.probabilite < 80).length; }
  get normaux() { return this.equipements.filter(e => e.probabilite < 50).length; }

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, private zone: NgZone, private cache: CacheService) {}

  ngOnInit(): void {
    this.detailMode = false;
    this.detail = null;
    this.isLoading = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.detailMode = true;
      this.http.get<any>(`${environment.apiUrl}/analyse-predictive/equipement/${id}`).subscribe({
        next: (data) => { this.detail = data; this.isLoading = false; this.cdr.detectChanges(); }
      });
    } else {
      this.loadData();
    }
  }

  loadData(): void {
    const cacheKey = 'analyse_scores_' + this.periode;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.equipements = cached;
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/analyse-predictive/scores?periode=${this.periode}`).subscribe({
      next: (data) => { this.cache.set('analyse_scores_' + this.periode, data); this.equipements = data; this.isLoading = false; this.cdr.markForCheck(); this.cdr.detectChanges(); },
      error: (err) => { console.error('ERREUR:', err); this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  setPeriode(p: number): void { this.periode = p; this.loadData(); }

  getDesc(eq: any): string {
    if (eq.couleur === 'rouge') return `Forte probabilité de défaillance (${eq.probabilite}%). L'équipement ${eq.nom} nécessite une attention immédiate.`;
    if (eq.couleur === 'orange') return `Probabilité de défaillance modérée (${eq.probabilite}%). Une inspection préventive est recommandée.`;
    return `Équipement en bon état. Maintenir le planning préventif.`;
  }

  getColor(couleur: string): string {
    if (couleur === 'rouge') return '#DC2626';
    if (couleur === 'orange') return '#F59E0B';
    return '#16A34A';
  }

  getSparkPoints(eq: any): string {
    if (!eq.pannesParMois) return '';
    const vals = Object.values(eq.pannesParMois) as number[];
    if (!vals.length) return '';
    const max = Math.max(...vals, 1);
    const w = 120, h = 50;
    return vals.map((v, i) => {
      const x = (i / Math.max(vals.length - 1, 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
  }

  voirDetail(id: number): void { this.router.navigate(['/analyse-predictive', id]); }
  retourListe(): void { this.router.navigate(['/analyse-predictive']); }
}
