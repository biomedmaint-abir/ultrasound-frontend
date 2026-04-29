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
    doc.rect(0, 0, W, 35, 'F');
    doc.setFillColor(...blue);
    doc.roundedRect(10, 7, 40, 20, 2, 2, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 30, 17, { align: 'center' });
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Société de Commercialisation et de', 30, 21.5, { align: 'center' });
    doc.text('Réparation des Instruments Médicaux', 30, 25, { align: 'center' });
    doc.text('Groupe Vicenne — www.scrim.ma', 30, 28.5, { align: 'center' });
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text(this.rapport.titre, W / 2 + 20, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('BiomédMaint — Application de Gestion de Maintenance Biomédicale', W / 2 + 20, 24, { align: 'center' });
    doc.setFillColor(...blue);
    doc.rect(0, 35, W, 1.5, 'F');

    // ── INFORMATIONS DU RAPPORT ────────────────────────────────────────────
    let y = 45;
    doc.setFillColor(...navy);
    doc.rect(10, y, W - 20, 8, 'F');
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Informations du rapport', 14, y + 5.5);
    y += 13;

    const champs = [
      { label: 'Titre du rapport', val: this.rapport.titre },
      { label: 'Parc / Établissement', val: this.rapport.parc || 'Tous les parcs' },
      { label: 'Période couverte', val: this.rapport.periode || '—' },
      { label: 'Responsable technique', val: this.rapport.responsable || '—' },
      { label: 'Date du rapport', val: new Date(this.rapport.dateRapport).toLocaleDateString('fr-FR') },
    ];

    champs.forEach((champ, i) => {
      if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { doc.setFillColor(...gray); }
      doc.rect(10, y - 4, W - 20, 10, 'F');
      doc.setFillColor(...navy);
      doc.rect(10, y - 4, 3, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.setFontSize(10);
      doc.text(champ.label + ' :', 16, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...text);
      doc.text(champ.val, 80, y + 2);
      y += 12;
    });

    y += 5;

    // ── OBSERVATIONS ───────────────────────────────────────────────────────
    doc.setFillColor(...navy);
    doc.rect(10, y, W - 20, 8, 'F');
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Observations', 14, y + 5.5);
    y += 13;

    if (this.rapport.observations) {
      doc.setFillColor(...gray);
      doc.rect(10, y, W - 20, 50, 'F');
      doc.setFillColor(...navy);
      doc.rect(10, y, 3, 50, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...text);
      const lines = doc.splitTextToSize(this.rapport.observations, W - 30);
      doc.text(lines, 16, y + 8);
      y += 58;
    } else {
      doc.setFillColor(...gray);
      doc.rect(10, y, W - 20, 35, 'F');
      doc.setFillColor(...navy);
      doc.rect(10, y, 3, 35, 'F');
      y += 42;
    }

    y += 10;

    // ── SIGNATURES ─────────────────────────────────────────────────────────
    const sigY = Math.min(y, 230);
    doc.setFillColor(...gray);
    doc.rect(10, sigY, 85, 30, 'F');
    doc.rect(115, sigY, 85, 30, 'F');
    doc.setFillColor(...navy);
    doc.rect(10, sigY, 85, 7, 'F');
    doc.rect(115, sigY, 85, 7, 'F');
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Responsable technique / FSE', 52, sigY + 5, { align: 'center' });
    doc.text('Responsable SCRIM', 157, sigY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...text);
    doc.text('Nom et prénom :', 15, sigY + 16);
    doc.text(this.rapport.responsable || '______________________', 52, sigY + 24, { align: 'center' });
    doc.text('______________________', 157, sigY + 24, { align: 'center' });
    doc.text('Signature :', 15, sigY + 28);

    // ── FOOTER ─────────────────────────────────────────────────────────────
    doc.setFillColor(...navy);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('SCRIM — BiomédMaint  |  Confidentiel', 14, 293);
    doc.text('Page 1 / 1', W - 14, 293, { align: 'right' });
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, W / 2, 293, { align: 'center' });

    doc.save(`Rapport_SCRIM_${this.rapport.parc || 'Tous'}_${this.rapport.dateRapport}.pdf`);
  }

  goBack(): void { this.router.navigate(['/rapports']); }
}