import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-planning',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Mon Planning</h1>
    <p>{{ interventions.length }} intervention(s) planifiée(s)</p>
  </div>

  <div *ngIf="interventions.length === 0" class="empty-state">
    <p>📅 Aucune intervention planifiée pour le moment.</p>
  </div>

  <div class="interventions-list" *ngIf="interventions.length > 0">
    <div *ngFor="let inv of interventions" class="intervention-card">
      <div class="card-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ inv.dateIntervention | date:'MMM' | uppercase }}</span>
          <span class="date-day">{{ inv.dateIntervention | date:'dd' }}</span>
        </div>
      </div>
      <div class="card-center">
        <div class="card-title">{{ inv.equipement?.nom || '—' }}</div>
        <div class="card-sub">{{ inv.equipement?.parc || '—' }}</div>
        <div class="card-desc" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</div>
      </div>
      <div class="card-right">
        <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)">
          <span class="dot"></span>{{ inv.statut }}
        </span>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}
p{margin:4px 0 0;color:#6b7280;font-size:13px}
.interventions-list{display:flex;flex-direction:column;gap:12px}
.intervention-card{background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;align-items:center;gap:16px;transition:box-shadow .2s}
.intervention-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
.date-block{display:flex;flex-direction:column;align-items:center;padding:10px 14px;border-radius:10px;min-width:60px;text-align:center}
.date-month{font-size:10px;font-weight:700;text-transform:uppercase}
.date-day{font-size:22px;font-weight:800;line-height:1.1}
.type-correctif{background:#FEE2E2;color:#DC2626}
.type-preventif{background:#DCFCE7;color:#16A34A}
.type-maj{background:#DBEAFE;color:#1a2eff}
.card-center{flex:1}
.card-title{font-size:15px;font-weight:700;color:#0d1340}
.card-sub{font-size:12px;color:#6b7280;margin-top:2px}
.card-desc{font-size:12px;color:#9CA3AF;margin-top:4px}
.card-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.type-badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.statut-terminee{background:#DCFCE7;color:#16A34A}
.statut-en_cours{background:#DBEAFE;color:#1D4ED8}
.statut-en_attente{background:#FEF9C3;color:#CA8A04}
.statut-en_attente_validation{background:#F3E8FF;color:#7C3AED}
.statut-en_attente_piece{background:#FEE2E2;color:#DC2626}
.empty-state{text-align:center;padding:48px;color:#9CA3AF;font-size:14px;background:white;border-radius:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
  `]
})
export class FsePlanningComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  userId = Number(localStorage.getItem('userId')) || 0;
  interventions: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data.filter(i =>
          i.technicien?.id === this.userId ||
          i.nomFse === this.prenom ||
          i.nomFse === this.nom ||
          i.nomFse === this.email
        );
        this.cdr.detectChanges();
      }
    });
  }

  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : t === 'PREVENTIF' ? 'type-preventif' : 'type-maj'; }
  getStatutClass(s: string): string {
    switch(s) {
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_COURS': return 'statut-en_cours';
      case 'EN_ATTENTE': return 'statut-en_attente';
      case 'EN_ATTENTE_VALIDATION': return 'statut-en_attente_validation';
      case 'EN_ATTENTE_PIECE': return 'statut-en_attente_piece';
      default: return 'statut-en_attente';
    }
  }
}
