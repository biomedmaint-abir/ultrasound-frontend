import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-fse-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Mes Rapports</h1>
    <p>{{ rapports.length }} rapport(s) — interventions clôturées</p>
  </div>

  <div class="filter-card">
    <div class="search-wrap">
      <span>🔍</span>
      <input type="text" [(ngModel)]="search" (input)="applyFilter()"
        placeholder="Rechercher par équipement ou date..." class="search-input">
    </div>
  </div>

  <div *ngIf="isLoading" class="center-state"><p>Chargement...</p></div>

  <div *ngIf="filtered.length === 0 && !isLoading" class="empty-state">
    <p>📋 Aucun rapport disponible. Vos rapports apparaîtront ici après clôture d'une intervention.</p>
  </div>

  <div class="rapports-list" *ngIf="!isLoading && filtered.length > 0">
    <div *ngFor="let inv of filtered" class="rapport-card">
      <div class="rapport-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ inv.dateIntervention | date:'MMM' | uppercase }}</span>
          <span class="date-day">{{ inv.dateIntervention | date:'dd' }}</span>
          <span class="date-year">{{ inv.dateIntervention | date:'yyyy' }}</span>
        </div>
      </div>
      <div class="rapport-center">
        <div class="rapport-title">{{ inv.equipement?.nom || '—' }}</div>
        <div class="rapport-site">🏥 {{ inv.equipement?.parc || '—' }}</div>
        <div class="rapport-type">
          <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        </div>
        <div class="rapport-actions" *ngIf="inv.actionsEffectuees">
          <span class="actions-label">✅ Actions :</span>
          <span class="actions-text">{{ inv.actionsEffectuees }}</span>
        </div>
      </div>
      <div class="rapport-right">
        <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)">
          <span class="dot"></span>
          {{ inv.statut === 'TERMINEE' ? 'Résolu' : inv.statut === 'EN_ATTENTE_VALIDATION' ? 'En attente validation' : inv.statut === 'EN_ATTENTE_PIECE' ? 'En attente pièce' : inv.statut }}
        </span>
        <button class="btn-pdf" (click)="telechargerPDF(inv)">📄 Télécharger PDF</button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px}
h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}
p{margin:4px 0 0;color:#6b7280;font-size:13px}
.filter-card{display:flex;gap:12px;background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.search-wrap{display:flex;align-items:center;gap:8px;flex:1;background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:10px;padding:0 14px;height:44px}
.search-input{flex:1;border:none;outline:none;font-size:14px;background:transparent}
.rapports-list{display:flex;flex-direction:column;gap:12px}
.rapport-card{background:white;border-radius:14px;padding:20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;align-items:flex-start;gap:16px;transition:box-shadow .2s}
.rapport-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
.date-block{display:flex;flex-direction:column;align-items:center;padding:10px 14px;border-radius:10px;min-width:60px;text-align:center;flex-shrink:0}
.date-month{font-size:10px;font-weight:700;text-transform:uppercase}
.date-day{font-size:22px;font-weight:800;line-height:1.1}
.date-year{font-size:10px;font-weight:500;opacity:.8}
.type-correctif{background:#FEE2E2;color:#DC2626}
.type-preventif{background:#DCFCE7;color:#16A34A}
.type-maj{background:#DBEAFE;color:#1a2eff}
.rapport-center{flex:1}
.rapport-title{font-size:15px;font-weight:700;color:#0d1340;margin-bottom:4px}
.rapport-site{font-size:12px;color:#6b7280;margin-bottom:8px}
.rapport-type{margin-bottom:8px}
.type-badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.rapport-actions{display:flex;gap:6px;font-size:12px;color:#374151;margin-top:4px}
.actions-label{font-weight:600;color:#16A34A;flex-shrink:0}
.actions-text{color:#374151}
.rapport-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.statut-terminee{background:#DCFCE7;color:#16A34A}
.statut-en_attente_validation{background:#F3E8FF;color:#7C3AED}
.statut-en_attente_piece{background:#FEF9C3;color:#CA8A04}
.btn-pdf{background:#1a2eff;color:white;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
.btn-pdf:hover{background:#0d1bb5}
.empty-state,.center-state{text-align:center;padding:48px;color:#9CA3AF;font-size:14px;background:white;border-radius:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
  `]
})
export class FseRapportsComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  userId = Number(localStorage.getItem('userId')) || 0;
  rapports: any[] = [];
  filtered: any[] = [];
  search = '';
  isLoading = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        const mes = data.filter(i =>
          i.technicien?.id === this.userId ||
          i.nomFse === this.prenom ||
          i.nomFse === this.nom ||
          i.nomFse === this.email ||
          i.nomFse === (this.prenom + ' ' + this.nom).trim() ||
          i.nomFse === (this.nom + ' ' + this.prenom).trim()
        );
        this.rapports = mes
          .filter(i => i.statut === 'TERMINEE' || i.statut === 'EN_ATTENTE_VALIDATION' || i.statut === 'EN_ATTENTE_PIECE')
          .sort((a, b) => new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime());
        this.filtered = [...this.rapports];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.rapports.filter(i =>
      !q ||
      i.equipement?.nom?.toLowerCase().includes(q) ||
      i.dateIntervention?.includes(q)
    );
  }

  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : t === 'PREVENTIF' ? 'type-preventif' : 'type-maj'; }
  getStatutClass(s: string): string {
    return s === 'TERMINEE' ? 'statut-terminee' : s === 'EN_ATTENTE_VALIDATION' ? 'statut-en_attente_validation' : 'statut-en_attente_piece';
  }

  telechargerPDF(inv: any): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const navy = [26, 35, 126]; const blue = [21, 101, 192];
    const white = [255, 255, 255]; const text = [51, 51, 51];

    const fc = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);
    const tc = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);

    fc(navy); doc.rect(0, 0, W, 35, 'F');
    fc(blue); doc.roundedRect(10, 7, 40, 20, 2, 2, 'F');
    tc(white); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 30, 20, { align: 'center' });
    doc.setFontSize(14); doc.text('Rapport d\'Intervention', W / 2 + 20, 18, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Fiche 34 — Format officiel SCRIM', W / 2 + 20, 27, { align: 'center' });
    fc(blue); doc.rect(0, 35, W, 2, 'F');

    let y = 45;
    const infos = [
      ['Equipement', inv.equipement?.nom || '—'],
      ['Site / Parc', inv.equipement?.parc || '—'],
      ['Service', inv.equipement?.service || '—'],
      ['Type intervention', inv.type || '—'],
      ['Date', new Date(inv.dateIntervention).toLocaleDateString('fr-FR')],
      ['FSE', this.nom + ' ' + this.prenom],
      ['Duree', inv.dureeHeures ? inv.dureeHeures + ' heures' : '—'],
      ['Statut', inv.statut || '—'],
    ];

    fc(navy); doc.rect(10, y, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Informations generales', 14, y + 5);
    y += 10;

    infos.forEach((info, i) => {
      if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { doc.setFillColor(245, 247, 250); }
      doc.rect(10, y - 3, W - 20, 8, 'F');
      fc(navy); doc.rect(10, y - 3, 2.5, 8, 'F');
      doc.setFont('helvetica', 'bold'); tc(navy); doc.setFontSize(9);
      doc.text(info[0] + ' :', 15, y + 2);
      doc.setFont('helvetica', 'normal'); tc(text);
      doc.text(info[1], 70, y + 2);
      y += 9;
    });

    y += 8;
    if (inv.descriptionPanne) {
      fc(navy); doc.rect(10, y, W - 20, 7, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Description de la panne', 14, y + 5);
      y += 10;
      doc.setFillColor(245, 247, 250); doc.rect(10, y, W - 20, 20, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(text);
      const lines = doc.splitTextToSize(inv.descriptionPanne, W - 28);
      doc.text(lines, 15, y + 6);
      y += 25;
    }

    if (inv.actionsEffectuees) {
      fc(navy); doc.rect(10, y, W - 20, 7, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Actions effectuees', 14, y + 5);
      y += 10;
      doc.setFillColor(245, 247, 250); doc.rect(10, y, W - 20, 20, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(text);
      const linesA = doc.splitTextToSize(inv.actionsEffectuees, W - 28);
      doc.text(linesA, 15, y + 6);
      y += 25;
    }

    y += 10;
    doc.setFillColor(245, 247, 250);
    doc.rect(10, y, 85, 28, 'F'); doc.rect(115, y, 85, 28, 'F');
    fc(navy); doc.rect(10, y, 85, 6, 'F'); doc.rect(115, y, 85, 6, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text('FSE', 52, y + 4.5, { align: 'center' });
    doc.text('Responsable SCRIM', 157, y + 4.5, { align: 'center' });
    tc(text); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('Signature :', 14, y + 22);
    doc.setDrawColor(150, 150, 150);
    doc.line(15, y + 26, 90, y + 26);
    doc.line(115, y + 26, 195, y + 26);

    fc(navy); doc.rect(0, 287, W, 10, 'F');
    tc(white); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('SCRIM | Confidentiel', 14, 293);
    doc.text('Genere le ' + new Date().toLocaleDateString('fr-FR'), W / 2, 293, { align: 'center' });
    doc.text('Page 1/1', W - 14, 293, { align: 'right' });

    doc.save(`Rapport_${inv.type}_${inv.equipement?.nom || 'Equipement'}_${inv.dateIntervention}.pdf`);
  }
}
