import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-equipements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Équipements</h1>
    <p>Parc SCRIM — Consultation uniquement — {{ filtered.length }} équipement(s)</p>
  </div>

  <div class="filter-card">
    <div class="search-wrap">
      <span>🔍</span>
      <input type="text" [(ngModel)]="search" (input)="applyFilter()"
        placeholder="Rechercher un équipement..." class="search-input">
    </div>
    <select [(ngModel)]="filterParc" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les parcs</option>
      <option *ngFor="let p of parcs" [value]="p">{{ p }}</option>
    </select>
    <select [(ngModel)]="filterStatut" (change)="applyFilter()" class="filter-select">
      <option value="">Tous les statuts</option>
      <option value="EN_SERVICE">Opérationnel</option>
      <option value="EN_MAINTENANCE">En maintenance</option>
      <option value="EN_PANNE">En panne</option>
    </select>
  </div>

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>
  <div *ngIf="filtered.length === 0 && !isLoading" class="empty-state"><p>Aucun équipement trouvé.</p></div>

  <div class="equipements-list" *ngIf="!isLoading && filtered.length > 0">
    <div *ngFor="let e of filtered" class="equip-card">
      <div class="equip-icon">🔬</div>
      <div class="equip-center">
        <div class="equip-name">{{ e.nom }}</div>
        <div class="equip-meta">
          <span *ngIf="e.numeroSerie">🔢 {{ e.numeroSerie }}</span>
          <span *ngIf="e.service">🏢 {{ e.service }}</span>
          <span *ngIf="e.parc">🏥 {{ e.parc }}</span>
        </div>
      </div>
      <div class="equip-right">
        <span class="statut-badge" [ngClass]="getStatutClass(e.statut)">
          <span class="dot"></span>{{ getStatutLabel(e.statut) }}
        </span>
        <button class="btn-fiche" (click)="router.navigate(['/equipements', e.id])">
          Voir fiche →
        </button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:1100px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}
p{margin:4px 0 0;font-size:13px;color:#6b7280}
.filter-card{display:flex;gap:12px;flex-wrap:wrap;background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.search-wrap{display:flex;align-items:center;gap:8px;flex:1;min-width:200px;background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:10px;padding:0 14px;height:44px}
.search-input{flex:1;border:none;outline:none;font-size:14px;background:transparent}
.filter-select{padding:10px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:13px;color:#0d1340;background:white;outline:none;min-width:140px}
.equipements-list{display:flex;flex-direction:column;gap:10px}
.equip-card{background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;align-items:center;gap:16px;transition:box-shadow .2s}
.equip-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
.equip-icon{width:44px;height:44px;background:#EFF6FF;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.equip-center{flex:1}
.equip-name{font-size:15px;font-weight:700;color:#0d1340;margin-bottom:6px}
.equip-meta{display:flex;gap:16px;font-size:12px;color:#6b7280;flex-wrap:wrap}
.equip-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600}
.dot{width:7px;height:7px;border-radius:50%;background:currentColor}
.statut-service{background:#DCFCE7;color:#16A34A}
.statut-maintenance{background:#FEF9C3;color:#CA8A04}
.statut-panne{background:#FEE2E2;color:#DC2626}
.statut-default{background:#F3F4F6;color:#6B7280}
.btn-fiche{background:#EFF6FF;color:#1a2eff;border:1.5px solid #1a2eff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
.btn-fiche:hover{background:#1a2eff;color:white}
.empty-state,.center-state{text-align:center;padding:48px;color:#9CA3AF;font-size:14px;background:white;border-radius:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
  `]
})
export class FseEquipementsComponent implements OnInit {
  equipements: any[] = [];
  filtered: any[] = [];
  parcs: string[] = [];
  search = ''; filterParc = ''; filterStatut = '';
  isLoading = true;

  constructor(private http: HttpClient, public router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => {
        this.equipements = data;
        this.filtered = [...data];
        this.parcs = [...new Set(data.map((e: any) => e.parc).filter(Boolean))];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    this.filtered = this.equipements.filter(e =>
      (!this.search ||
        e.nom?.toLowerCase().includes(this.search.toLowerCase()) ||
        e.numeroSerie?.toLowerCase().includes(this.search.toLowerCase()) ||
        e.service?.toLowerCase().includes(this.search.toLowerCase())) &&
      (!this.filterParc || e.parc === this.filterParc) &&
      (!this.filterStatut || e.statut === this.filterStatut)
    );
  }

  getStatutClass(s: string): string {
    switch(s) {
      case 'EN_SERVICE': return 'statut-service';
      case 'EN_MAINTENANCE': return 'statut-maintenance';
      case 'EN_PANNE': return 'statut-panne';
      default: return 'statut-default';
    }
  }

  getStatutLabel(s: string): string {
    switch(s) {
      case 'EN_SERVICE': return '🟢 Opérationnel';
      case 'EN_MAINTENANCE': return '🟡 En maintenance';
      case 'EN_PANNE': return '🔴 En panne';
      default: return '⚪ Inconnu';
    }
  }
}
