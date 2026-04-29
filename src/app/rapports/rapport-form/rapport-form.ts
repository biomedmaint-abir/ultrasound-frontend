import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-rapport-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './rapport-form.html',
  styleUrl: './rapport-form.scss'
})
export class RapportForm implements OnInit {

  interventions: any[] = [];
  filtered: any[] = [];
  parcsList: string[] = [];
  isLoading = true;

  filterParc = '';
  filterDateDebut = '';
  filterDateFin = '';
  filterType = '';
  filterStatut = '';

  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];
  statuts = ['EN_COURS', 'TERMINEE', 'EN_ATTENTE_PIECE'];

  stats = { total: 0, terminees: 0, enCours: 0, mttrMoyen: 0, coutTotal: 0 };

  rapport = {
    titre: 'Rapport de Maintenance Biomédicale',
    parc: '',
    periode: '',
    responsable: '',
    observations: '',
    dateRapport: new Date().toISOString().slice(0, 10)
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data;
        this.filtered = data;
        this.calculateStats();
        this.parcsList = [...new Set(data.map((i: any) => i.equipement?.parc).filter((p: any) => p))];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  calculateStats(): void {
    this.stats.total = this.filtered.length;
    this.stats.terminees = this.filtered.filter(i => i.statut === 'TERMINEE').length;
    this.stats.enCours = this.filtered.filter(i => i.statut === 'EN_COURS').length;
    const durees = this.filtered.filter(i => i.dureeHeures).map(i => i.dureeHeures);
    this.stats.mttrMoyen = durees.length ? durees.reduce((a, b) => a + b, 0) / durees.length : 0;
    this.stats.coutTotal = this.filtered.filter(i => i.coutTotal).reduce((a, b) => a + Number(b.coutTotal), 0);
  }

  applyFilter(): void {
    this.filtered = this.interventions.filter(i => {
      const matchParc = !this.filterParc || i.equipement?.parc === this.filterParc;
      const matchType = !this.filterType || i.type === this.filterType;
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      const matchDateDebut = !this.filterDateDebut || (i.dateIntervention && i.dateIntervention >= this.filterDateDebut);
      const matchDateFin = !this.filterDateFin || (i.dateIntervention && i.dateIntervention <= this.filterDateFin);
      return matchParc && matchType && matchStatut && matchDateDebut && matchDateFin;
    });
    if (this.filterParc) this.rapport.parc = this.filterParc;
    this.calculateStats();
    this.cdr.detectChanges();
  }

  genererPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const navy: [number, number, number] = [26, 35, 126];
    const blue: [number, number, number] = [21, 101, 192];
    const green: [number, number, number] = [27, 94, 32];
    const gray: [number, number, number] = [245, 247, 250];
    const white: [number, number, number] = [255, 255, 255];
    const text: [number, number, number] = [51, 51, 51];

    // HEADER SCRIM
    doc.setFillColor(...navy);
    doc.rect(0, 0, W, 35, 'F');
    doc.setFillColor(...blue);
    doc.roundedRect(12, 7, 40, 20, 3, 3, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 32, 19, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Société de Commercialisation et de', 32, 23.5, { align: 'center' });
    doc.text('Réparation des Instruments Médicaux', 32, 27, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text(this.rapport.titre, W / 2 + 15, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('BiomédMaint — Application de Gestion de Maintenance Biomédicale', W / 2 + 15, 22, { align: 'center' });
    doc.setFontSize(9);
    doc.text('www.scrim.ma  |  Groupe Vicenne', W / 2 + 15, 29, { align: 'center' });

    // INFOS RAPPORT
    doc.setFillColor(...gray);
    doc.rect(10, 38, W - 20, 28, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('Informations du rapport', 14, 45);

    const infos = [
      ['Parc / Établissement :', this.rapport.parc || 'Tous les parcs'],
      ['Période :', this.rapport.periode || 'Toutes périodes'],
      ['Responsable :', this.rapport.responsable || '—'],
      ['Date du rapport :', new Date(this.rapport.dateRapport).toLocaleDateString('fr-FR')],
    ];
    infos.forEach((info, i) => {
      const col = i % 2; const row = Math.floor(i / 2);
      const x = col === 0 ? 14 : 115; const y = 51 + row * 7;
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...navy); doc.text(info[0], x, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...text); doc.text(info[1], x + 45, y);
    });

    // KPIs
    doc.setFillColor(...navy); doc.rect(10, 69, W - 20, 8, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Indicateurs de performance', 14, 75);

    const kpis = [
      { label: 'Total interventions', val: String(this.stats.total), color: blue },
      { label: 'Terminées', val: String(this.stats.terminees), color: green },
      { label: 'En cours', val: String(this.stats.enCours), color: [230, 81, 0] as [number, number, number] },
      { label: 'MTTR moyen', val: this.stats.mttrMoyen.toFixed(1) + 'h', color: [123, 31, 162] as [number, number, number] },
      { label: 'Coût total', val: this.stats.coutTotal.toLocaleString('fr-FR') + ' DH', color: navy },
    ];
    kpis.forEach((kpi, i) => {
      const x = 10 + i * 38;
      doc.setFillColor(...gray); doc.rect(x, 79, 36, 20, 'F');
      doc.setFillColor(...kpi.color); doc.rect(x, 79, 36, 5, 'F');
      doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(kpi.label, x + 18, 83, { align: 'center' });
      doc.setTextColor(...kpi.color); doc.setFontSize(13);
      doc.text(kpi.val, x + 18, 93, { align: 'center' });
    });

    // TABLEAU
    doc.setFillColor(...navy); doc.rect(10, 102, W - 20, 8, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Détail des interventions', 14, 108);
    doc.setFontSize(8);
    doc.text(`(${this.filtered.length} intervention(s))`, W - 14, 108, { align: 'right' });

    const headers = ['#', 'Date', 'Type', 'Statut', 'Équipement', 'Parc', 'FSE', 'Durée', 'Coût (DH)'];
    const colWidths = [8, 20, 22, 22, 28, 32, 22, 15, 18];
    let startX = 10;

    doc.setFillColor(...blue); doc.rect(10, 112, W - 20, 7, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    headers.forEach((h, i) => {
      doc.text(h, startX + colWidths[i] / 2, 117, { align: 'center' });
      startX += colWidths[i];
    });

    let y = 122;
    this.filtered.forEach((row, idx) => {
      if (y > 280) {
        doc.addPage();
        doc.setFillColor(...navy); doc.rect(0, 0, W, 12, 'F');
        doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('BiomédMaint — SCRIM', W / 2, 8, { align: 'center' });
        doc.setFillColor(...blue); doc.rect(10, 15, W - 20, 7, 'F');
        doc.setTextColor(...white); startX = 10;
        headers.forEach((h, i) => { doc.text(h, startX + colWidths[i] / 2, 20, { align: 'center' }); startX += colWidths[i]; });
        y = 30;
      }
      if (idx % 2 === 0) { doc.setFillColor(255, 255, 255); } else { doc.setFillColor(245, 247, 250); }
      doc.rect(10, y - 4, W - 20, 7, 'F');
      doc.setTextColor(...text); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      const cells = [
        String(row.id),
        row.dateIntervention ? new Date(row.dateIntervention).toLocaleDateString('fr-FR') : '—',
        row.type || '—', row.statut || '—',
        (row.equipement?.nom || '—').substring(0, 14),
        (row.equipement?.parc || '—').substring(0, 16),
        (row.nomFse || '—').substring(0, 12),
        row.dureeHeures ? row.dureeHeures + 'h' : '—',
        row.coutTotal ? Number(row.coutTotal).toLocaleString('fr-FR') : '—',
      ];
      startX = 10;
      cells.forEach((cell, i) => { doc.text(cell, startX + colWidths[i] / 2, y, { align: 'center' }); startX += colWidths[i]; });
      doc.setDrawColor(220, 220, 220); doc.line(10, y + 3, W - 10, y + 3);
      y += 7;
    });

    // OBSERVATIONS
    if (this.rapport.observations) {
      if (y > 250) { doc.addPage(); y = 20; }
      y += 5;
      doc.setFillColor(...gray); doc.rect(10, y, W - 20, 6, 'F');
      doc.setFillColor(...navy); doc.rect(10, y, 3, 6, 'F');
      doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Observations', 16, y + 4);
      y += 10;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...text);
      const lines = doc.splitTextToSize(this.rapport.observations, W - 24);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 5;
    }

    // SIGNATURES
    const sigY = Math.min(y + 10, 265);
    doc.setFillColor(...gray);
    doc.rect(10, sigY, 85, 20, 'F'); doc.rect(115, sigY, 85, 20, 'F');
    doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('Responsable technique FSE', 52, sigY + 6, { align: 'center' });
    doc.text('Responsable SCRIM', 157, sigY + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...text);
    doc.text(this.rapport.responsable || '___________________________', 52, sigY + 14, { align: 'center' });
    doc.text('___________________________', 157, sigY + 14, { align: 'center' });

    // FOOTER
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...navy); doc.rect(0, 287, W, 10, 'F');
      doc.setTextColor(...white); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text('SCRIM — BiomédMaint  |  Confidentiel', 14, 293);
      doc.text(`Page ${p} / ${totalPages}`, W - 14, 293, { align: 'right' });
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, W / 2, 293, { align: 'center' });
    }

    doc.save(`Rapport_SCRIM_${this.rapport.parc || 'Tous'}_${this.rapport.dateRapport}.pdf`);
  }

  goBack(): void { this.router.navigate(['/rapports']); }
}