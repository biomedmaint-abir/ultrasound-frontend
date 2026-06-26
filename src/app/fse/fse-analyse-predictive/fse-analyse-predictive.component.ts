import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-analyse-predictive',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
<ng-container *ngIf="!detailMode">
  <div class="list-page">
    <div class="list-header"><h1>🔮 Analyse Prédictive</h1><p>Score de fiabilité de vos équipements assignés</p></div>
    <div *ngIf="isLoading" class="loading">Chargement...</div>
    <div class="cards-grid" *ngIf="!isLoading">
      <div *ngFor="let eq of equipements" class="equip-card">
        <div class="card-top">
          <div style="flex:1"><div class="card-nom">{{ eq.nom }}</div><div class="card-site">📍 {{ eq.service }} — {{ eq.parc }}</div></div>
          <span [ngClass]="getBadgeClass(eq.couleur)">{{ eq.niveau }}</span>
          <span class="badge-pct">{{ eq.probabilite }}%</span>
        </div>
        <div class="card-desc">{{ getDesc(eq) }}</div>
        <button class="btn-detail" (click)="voirDetail(eq.id)">Voir les détails →</button>
      </div>
    </div>
  </div>
</ng-container>

<ng-container *ngIf="detailMode && detail">
  <div class="page">
    <button class="btn-back" (click)="retourListe()">← Retour</button>
    <div class="header">
      <div class="header-top">
        <span class="equip-icon">⚙️</span>
        <span class="equip-nom">{{ detail.nom }}</span>
        <span class="header-date">{{ today | date:'dd/MM/yyyy' }}</span>
      </div>
      <div class="header-sub">
        <span [ngClass]="getBadgeClass(detail.couleur)">{{ detail.niveau }}</span>
        <span class="badge-pct">{{ detail.probabilite }}%</span>
        <span style="font-size:13px;color:#6b7280">📍 {{ detail.service }}, {{ detail.parc }}</span>
        <span class="header-id">ID : {{ detail.id }}</span>
      </div>
    </div>
    <div class="bloc">
      <div class="info-grid">
        <div><div class="info-label">Marque & Modèle :</div><div class="info-val">Philips {{ detail.nom }}</div></div>
        <div><div class="info-label">Type :</div><div class="info-val">{{ detail.service || '—' }}</div></div>
        <div><div class="info-label">Statut :</div>
          <span *ngIf="detail.statut === 'EN_SERVICE'" class="badge-actif">EN SERVICE</span>
          <span *ngIf="detail.statut !== 'EN_SERVICE'" class="badge-maint">{{ detail.statut }}</span>
        </div>
      </div>
    </div>
    <div class="alerte-bloc">
      <span class="alerte-icon">⚠️</span>
      <div class="alerte-text">
        <strong>Analyse IA :</strong>
        <span *ngIf="detail.couleur === 'rouge'"> Forte probabilité de défaillance détectée ({{ detail.probabilite }}%). L'équipement {{ detail.nom }} nécessite une attention immédiate.</span>
        <span *ngIf="detail.couleur === 'orange'"> Probabilité de défaillance modérée ({{ detail.probabilite }}%). Une inspection préventive est recommandée pour {{ detail.nom }}.</span>
        <span *ngIf="detail.couleur === 'vert'"> Équipement {{ detail.nom }} en bon état de fonctionnement. Maintenir le planning préventif actuel.</span>
      </div>
    </div>
    <div class="reco-bloc">
      <div class="reco-header"><span>💡</span><span class="reco-title">Recommandations</span></div>
      <ul class="reco-list">
        <ng-container *ngIf="detail.couleur === 'rouge'">
          <li>Programmer une intervention corrective dans les 48h</li>
          <li>Effectuer une inspection complète des composants critiques</li>
          <li>Réduire temporairement la charge de travail si possible</li>
          <li>Préparer les pièces de rechange nécessaires</li>
        </ng-container>
        <ng-container *ngIf="detail.couleur === 'orange'">
          <li>Planifier une visite préventive dans les 15 jours</li>
          <li>Vérifier les composants les plus sollicités</li>
          <li>Contrôler l'état des sondes et connecteurs</li>
          <li>Signaler au Chef de pôle pour planification</li>
        </ng-container>
        <ng-container *ngIf="detail.couleur === 'vert'">
          <li>Maintenir le planning préventif actuel</li>
          <li>Continuer les visites périodiques selon le contrat</li>
          <li>Aucune action urgente requise</li>
        </ng-container>
      </ul>
    </div>
    <div class="contrat-bloc">
      <span>🛡️</span>
      <span *ngIf="detail.sousContrat" class="contrat-text-actif">Sous contrat de maintenance</span>
      <span *ngIf="!detail.sousContrat" class="contrat-text-non">Hors contrat</span>
    </div>
    <div class="date-bloc"><span>🕐</span><span>Analysé le {{ today | date:'dd/MM/yyyy' }} à {{ today | date:'HH:mm' }}</span></div>
    <div class="apropos">
      <div class="apropos-title">ℹ️ À propos de l'analyse prédictive</div>
      <div class="apropos-grid">
        <div>
          <div class="apropos-label">Indicateurs analysés :</div>
          <div class="apropos-item"><span class="check-vert">✓</span> Historique des interventions</div>
          <div class="apropos-item"><span class="check-vert">✓</span> Type et fréquence des maintenances</div>
          <div class="apropos-item"><span class="check-vert">✓</span> Âge et utilisation de l'équipement</div>
          <div class="apropos-item"><span class="check-vert">✓</span> Statut contractuel de maintenance</div>
        </div>
        <div>
          <div class="apropos-label">Niveaux d'alerte :</div>
          <div class="level-item"><span class="badge-normal">NORMAL</span> &lt; 50% — Fonctionnement optimal</div>
          <div class="level-item"><span class="badge-modere">MODÉRÉ</span> 50-79% — Surveillance recommandée</div>
          <div class="level-item"><span class="badge-critique">ÉLEVÉ</span> ≥ 80% — Intervention requise</div>
        </div>
      </div>
    </div>
  </div>
</ng-container>
  `,
  styles: [`
.page,.list-page{max-width:900px;margin:0 auto;padding:24px 28px;font-family:'Plus Jakarta Sans',sans-serif}
.list-header{margin-bottom:24px} .list-header h1{font-size:26px;font-weight:800;color:#0d1340;margin:0} .list-header p{font-size:13px;color:#6b7280;margin:4px 0 0}
.cards-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.equip-card{background:white;border-radius:16px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:12px}
.card-top{display:flex;align-items:flex-start;gap:10px} .card-nom{font-size:15px;font-weight:700;color:#0d1340} .card-site{font-size:12px;color:#6b7280;margin-top:2px}
.card-desc{font-size:12px;color:#6b7280;line-height:1.5}
.btn-detail{background:#1C2B5A;color:white;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;align-self:flex-start}
.loading{text-align:center;padding:40px;color:#6b7280}
.header{background:white;border-radius:16px;padding:20px 24px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.header-top{display:flex;align-items:center;gap:12px;margin-bottom:8px} .equip-icon{font-size:28px} .equip-nom{font-size:22px;font-weight:800;color:#0d1340;flex:1} .header-date{font-size:12px;color:#9CA3AF}
.header-sub{display:flex;align-items:center;gap:10px;flex-wrap:wrap} .header-id{margin-left:auto;font-size:12px;color:#9CA3AF}
.badge-critique{background:#FEE2E2;color:#DC2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
.badge-modere{background:#FFF7ED;color:#F59E0B;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
.badge-normal{background:#DCFCE7;color:#16A34A;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
.badge-pct{background:#F3F4F6;color:#374151;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
.bloc{background:white;border-radius:16px;padding:20px 24px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px} .info-label{font-size:11px;color:#9CA3AF;font-weight:600;margin-bottom:4px} .info-val{font-size:14px;font-weight:700;color:#0d1340}
.badge-actif{background:#DCFCE7;color:#16A34A;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}
.badge-maint{background:#FFF7ED;color:#F59E0B;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}
.alerte-bloc{background:#FEE2E2;border-left:4px solid #DC2626;border-radius:12px;padding:16px 20px;margin-bottom:16px;display:flex;gap:12px;align-items:flex-start}
.alerte-icon{font-size:24px;flex-shrink:0} .alerte-text{font-size:13px;color:#7F1D1D;line-height:1.6}
.reco-bloc{background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:12px;padding:16px 20px;margin-bottom:16px}
.reco-header{display:flex;align-items:center;gap:8px;margin-bottom:10px} .reco-title{font-size:14px;font-weight:700;color:#92400E}
.reco-list{list-style:none;padding:0;margin:0} .reco-list li{font-size:13px;color:#78350F;padding:4px 0 4px 16px;position:relative} .reco-list li::before{content:"•";position:absolute;left:0;color:#F59E0B}
.contrat-bloc{display:flex;align-items:center;gap:8px;background:white;border-radius:12px;padding:14px 20px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.contrat-text-actif{color:#16A34A;font-size:13px;font-weight:600} .contrat-text-non{color:#9CA3AF;font-size:13px;font-weight:600}
.date-bloc{display:flex;align-items:center;gap:8px;background:white;border-radius:12px;padding:14px 20px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.06);font-size:13px;color:#6b7280}
.apropos{background:#F9FAFB;border:1px solid #e2e6f0;border-radius:12px;padding:20px 24px;margin-bottom:16px}
.apropos-title{font-size:14px;font-weight:700;color:#0d1340;margin-bottom:14px}
.apropos-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px} .apropos-label{font-size:12px;font-weight:700;color:#6b7280;margin-bottom:8px}
.apropos-item{font-size:12px;color:#374151;padding:3px 0} .check-vert{color:#16A34A;margin-right:6px}
.level-item{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12px;color:#374151}
.btn-back{background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;color:#0d1340;cursor:pointer;margin-bottom:16px}
  `]
})
export class FseAnalysePredictiveComponent implements OnInit {
  equipements: any[] = [];
  detail: any = null;
  detailMode = false;
  isLoading = true;
  today = new Date();
  private userId = 0;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('userId')) || 0;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.detailMode = true;
      this.http.get<any>(`${environment.apiUrl}/analyse-predictive/equipement/${id}`).subscribe({
        next: (data) => { this.detail = data; this.isLoading = false; }
      });
    } else {
      this.http.get<any[]>(`${environment.apiUrl}/analyse-predictive/fse/${this.userId}`).subscribe({
        next: (data) => { this.equipements = data; this.isLoading = false; }
      });
    }
  }

  getBadgeClass(couleur: string): string {
    if (couleur === 'rouge') return 'badge-critique';
    if (couleur === 'orange') return 'badge-modere';
    return 'badge-normal';
  }

  getDesc(eq: any): string {
    if (eq.couleur === 'rouge') return 'Forte probabilité de défaillance (' + eq.probabilite + '%). Attention immédiate requise.';
    if (eq.couleur === 'orange') return 'Probabilité modérée (' + eq.probabilite + '%). Inspection préventive recommandée.';
    return 'Équipement en bon état (' + eq.probabilite + '%). Maintenir le planning actuel.';
  }

  voirDetail(id: number): void { this.router.navigate(['/fse/analyse-predictive', id]); }
  retourListe(): void { this.router.navigate(['/fse/analyse-predictive']); }
}
