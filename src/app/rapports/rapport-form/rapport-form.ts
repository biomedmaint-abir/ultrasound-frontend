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

  genererPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const navy: [number, number, number] = [26, 35, 126];
    const blue: [number, number, number] = [21, 101, 192];
    const gray: [number, number, number] = [245, 247, 250];
    const white: [number, number, number] = [255, 255, 255];
    const text: [number, number, number] = [51, 51, 51];

    // ── HEADER SCRIM ───────────────────────────────────────────────────────
    doc.setFillColor(...navy);
    doc.rect(0, 0, W, 30, 'F');
    doc.setFillColor(...blue);
    doc.roundedRect(10, 6, 35, 18, 2, 2, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 27, 16, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Maintenance Biomédicale', 27, 20.5, { align: 'center' });
    doc.text('Groupe Vicenne', 27, 24, { align: 'center' });
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text(this.rapport.titre, W / 2 + 15, 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('BiomédMaint — www.scrim.ma', W / 2 + 15, 22, { align: 'center' });

    doc.setFillColor(...blue);
    doc.rect(0, 30, W, 1.5, 'F');

    // ── INFOS RAPPORT ──────────────────────────────────────────────────────
    doc.setFillColor(...gray);
    doc.rect(10, 35, W - 20, 26, 'F');
    doc.setFillColor(...navy);
    doc.rect(10, 35, 3, 26, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('Informations générales', 16, 42);

    const infos = [
      ['Parc :', this.rapport.parc || 'Tous les parcs'],
      ['Période :', this.rapport.periode || '—'],
      ['Responsable :', this.rapport.responsable || '—'],
      ['Date :', new Date(this.rapport.dateRapport).toLocaleDateString('fr-FR')],
    ];
    infos.forEach((info, i) => {
      const col = i % 2; const row = Math.floor(i / 2);
      const x = col === 0 ? 16 : 110; const y = 49 + row * 7;
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...navy); doc.setFontSize(9);
      doc.text(info[0], x, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...text);
      doc.text(info[1], x + 28, y);
    });

    // ── STATISTIQUES ───────────────────────────────────────────────────────
    let y = 66;
    doc.setFillColor(...navy);
    doc.rect(10, y, W - 20, 7, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Indicateurs de performance', 14, y + 5);
    y += 9;

    const kpis = [
      { label: 'Total', val: String(this.stats.total) },
      { label: 'Terminées', val: String(this.stats.terminees) },
      { label: 'En cours', val: String(this.stats.enCours) },
      { label: 'MTTR', val: this.stats.mttrMoyen.toFixed(1) + 'h' },
      { label: 'Coût total', val: this.stats.coutTotal.toLocaleString('fr-FR') + ' DH' },
    ];
    const kpiW = (W - 20) / 5;
    kpis.forEach((kpi, i) => {
      const x = 10 + i * kpiW;
      doc.setFillColor(...gray); doc.rect(x, y, kpiW - 1, 14, 'F');
      doc.setFillColor(...navy); doc.rect(x, y, kpiW - 1, 3, 'F');
      doc.setTextColor(...white); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.text(kpi.label, x + (kpiW - 1) / 2, y + 2.5, { align: 'center' });
      doc.setTextColor(...navy); doc.setFontSize(11);
      doc.text(kpi.val, x + (kpiW - 1) / 2, y + 10, { align: 'center' });
    });
    y += 18;

    // ── TABLEAU ────────────────────────────────────────────────────────────
    doc.setFillColor(...navy); doc.rect(10, y, W - 20, 7, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Liste des interventions', 14, y + 5);
    doc.setFontSize(8);
    doc.text(`${this.filtered.length} intervention(s)`, W - 14, y + 5, { align: 'right' });
    y += 9;

    const headers = ['#', 'Date', 'Type', 'Statut', 'Équipement', 'Parc', 'FSE', 'Durée', 'Coût'];
    const colW = [8, 18, 20, 22, 26, 30, 22, 14, 18];
    let sx = 10;

    doc.setFillColor(...blue); doc.rect(10, y, W - 20, 6, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    headers.forEach((h, i) => {
      doc.text(h, sx + colW[i] / 2, y + 4, { align: 'center' });
      sx += colW[i];
    });
    y += 8;

    this.filtered.forEach((row, idx) => {
      if (y > 272) {
        doc.addPage();
        doc.setFillColor(...navy); doc.rect(0, 0, W, 10, 'F');
        doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text('SCRIM — BiomédMaint  |  ' + this.rapport.titre, W / 2, 7, { align: 'center' });
        doc.setFillColor(...blue); doc.rect(10, 12, W - 20, 6, 'F');
        doc.setTextColor(...white); sx = 10;
        headers.forEach((h, i) => { doc.text(h, sx + colW[i] / 2, 16, { align: 'center' }); sx += colW[i]; });
        y = 22;
      }

      if (idx % 2 === 0) { doc.setFillColor(255, 255, 255); } else { doc.setFillColor(248, 249, 252); }
      doc.rect(10, y - 3.5, W - 20, 6.5, 'F');
      doc.setTextColor(...text); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);

      const cells = [
        String(row.id),
        row.dateIntervention ? new Date(row.dateIntervention).toLocaleDateString('fr-FR') : '—',
        row.type || '—', row.statut || '—',
        (row.equipement?.nom || '—').substring(0, 13),
        (row.equipement?.parc || '—').substring(0, 15),
        (row.nomFse || '—').substring(0, 11),
        row.dureeHeures ? row.dureeHeures + 'h' : '—',
        row.coutTotal ? Number(row.coutTotal).toLocaleString('fr-FR') : '—',
      ];
      sx = 10;
      cells.forEach((cell, i) => {
        doc.text(cell, sx + colW[i] / 2, y, { align: 'center' });
        sx += colW[i];
      });
      doc.setDrawColor(230, 230, 230);
      doc.line(10, y + 3, W - 10, y + 3);
      y += 7;
    });

    // ── OBSERVATIONS ───────────────────────────────────────────────────────
    if (this.rapport.observations) {
      if (y > 250) { doc.addPage(); y = 20; }
      y += 6;
      doc.setFillColor(...navy); doc.rect(10, y, 3, 7, 'F');
      doc.setFillColor(...gray); doc.rect(13, y, W - 23, 7, 'F');
      doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Observations', 17, y + 5);
      y += 12;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...text);
      const lines = doc.splitTextToSize(this.rapport.observations, W - 24);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 5;
    }

    // ── SIGNATURES ─────────────────────────────────────────────────────────
    const sigY = Math.min(y + 8, 260);
    doc.setFillColor(...gray);
    doc.rect(10, sigY, 85, 22, 'F'); doc.rect(115, sigY, 85, 22, 'F');
    doc.setFillColor(...navy);
    doc.rect(10, sigY, 85, 6, 'F'); doc.rect(115, sigY, 85, 6, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Responsable FSE', 52, sigY + 4.5, { align: 'center' });
    doc.text('Responsable SCRIM', 157, sigY + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...text);
    doc.text(this.rapport.responsable || '______________________', 52, sigY + 16, { align: 'center' });
    doc.text('______________________', 157, sigY + 16, { align: 'center' });

    // ── FOOTER ─────────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...navy); doc.rect(0, 287, W, 10, 'F');
      doc.setTextColor(...white); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text('SCRIM — BiomédMaint  |  Confidentiel', 14, 293);
      doc.text(`Page ${p} / ${totalPages}`, W - 14, 293, { align: 'right' });
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, W / 2, 293, { align: 'center' });
    }

    doc.save(`Rapport_SCRIM_${this.rapport.parc || 'Tous'}_${this.rapport.dateRapport}.pdf`);
  }

  goBack(): void { this.router.navigate(['/rapports']); }
}