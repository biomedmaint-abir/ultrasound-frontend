import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chefpole-disponibilite',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-container">
  <div class="page-header"><h1>Disponibilité équipe</h1><p>Planning de la semaine — lecture seule</p></div>
  <div class="fse-list">
    <div *ngFor="let fse of fseList" class="fse-card">
      <div class="fse-header">
        <div class="fse-avatar">{{ fse.prenom?.charAt(0) || fse.nom?.charAt(0) }}</div>
        <div>
          <div class="fse-name">{{ fse.prenom }} {{ fse.nom }}</div>
          <div class="fse-email">{{ fse.email }}</div>
        </div>
        <div class="fse-count">
          <div class="count-value">{{ getFseInterventions(fse.id).length }}</div>
          <div class="count-label">intervention(s)</div>
        </div>
      </div>
      <div class="fse-interventions" *ngIf="getFseInterventions(fse.id).length > 0">
        <div *ngFor="let inv of getFseInterventions(fse.id)" class="fse-inv-row">
          <span class="type-badge" [ngClass]="inv.type === 'CORRECTIF' ? 'type-correctif' : 'type-preventif'">{{ inv.type }}</span>
          <span class="inv-equip">{{ inv.equipement?.nom || '—' }}</span>
          <span class="inv-date">{{ inv.dateIntervention | date:'dd/MM' }}</span>
          <span class="inv-statut">{{ inv.statut }}</span>
        </div>
      </div>
      <div class="fse-empty" *ngIf="getFseInterventions(fse.id).length === 0">
        <span>✅ Disponible — aucune intervention assignée</span>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px;h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:0;font-size:13px;color:#6b7280}}
.fse-list{display:flex;flex-direction:column;gap:16px}
.fse-card{background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.fse-header{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid #f1f3f5}
.fse-avatar{width:44px;height:44px;border-radius:50%;background:#16A34A;color:white;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.fse-name{font-size:15px;font-weight:700;color:#0d1340}.fse-email{font-size:12px;color:#6b7280}
.fse-count{margin-left:auto;text-align:center;.count-value{font-size:24px;font-weight:800;color:#1a2eff}.count-label{font-size:11px;color:#6b7280}}
.fse-interventions{padding:8px 20px}
.fse-inv-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1f3f5;&:last-child{border-bottom:none}}
.type-badge{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.type-correctif{background:#FEE2E2;color:#DC2626}.type-preventif{background:#DCFCE7;color:#16A34A}
.inv-equip{flex:1;font-size:13px;color:#0d1340;font-weight:500}.inv-date{font-size:12px;color:#6b7280}.inv-statut{font-size:11px;color:#9CA3AF}
.fse-empty{padding:12px 20px;font-size:13px;color:#16A34A}
  `]
})
export class ChefPoleDisponibiliteComponent implements OnInit {
  fseList: any[] = [];
  interventions: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs/fse-disponibles`).subscribe({
      next: (data) => { this.fseList = data; this.cdr.detectChanges(); }
    });
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => { this.interventions = data; this.cdr.detectChanges(); }
    });
  }

  getFseInterventions(fseId: number): any[] {
    return this.interventions.filter(i => i.technicien?.id === fseId);
  }
}
