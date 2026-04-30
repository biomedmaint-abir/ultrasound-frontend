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

  equipements: any[] = [];
  piecesDisponibles: any[] = [];
  parcsList: string[] = [];
  isLoading = true;

  rapport: any = {
    type: '',
    titre: 'Rapport de Maintenance Biomédicale',
    parc: '',
    periode: '',
    responsable: '',
    observations: '',
    dateRapport: new Date().toISOString().slice(0, 10),
    equipementId: '',
    equipementNom: '',
    duree: null,
    cout: null,
    descriptionPanne: '',
    causes: '',
    actions: '',
    codeErreur: '',
    pieces: [],
    operationsEffectuees: '',
    etatEquipement: '',
    prochaineMaintenance: '',
    referenceFCO: '',
    versionAvant: '',
    versionApres: '',
  };

  checklistItems = [
    { label: 'Nettoyage des sondes ultrasonores', fait: false },
    { label: 'Verification des connecteurs', fait: false },
    { label: 'Test de l alimentation electrique', fait: false },
    { label: 'Verification des cables et connections', fait: false },
    { label: 'Test fonctionnel des modes B, M, Doppler', fait: false },
    { label: 'Verification de la qualite image', fait: false },
    { label: 'Nettoyage du panneau de controle', fait: false },
    { label: 'Test de l imprimante integree', fait: false },
    { label: 'Verification des mises a jour logicielles', fait: false },
    { label: 'Test de l archivage et connectivite reseau', fait: false },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => {
        this.equipements = data;
        this.parcsList = [...new Set(data.map((e: any) => e.parc).filter((p: any) => p))];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
    this.http.get<any[]>(`${environment.apiUrl}/pieces`).subscribe({
      next: (data) => { this.piecesDisponibles = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  onTypeChange(): void {
    const titres: any = {
      'CORRECTIF': 'Rapport de Maintenance Corrective',
      'PREVENTIF': 'Rapport de Maintenance Preventive',
      'MISE_A_JOUR': 'Rapport de Mise a Jour Philips',
    };
    this.rapport.titre = titres[this.rapport.type] || 'Rapport de Maintenance Biomedicale';
    this.cdr.detectChanges();
  }

  onEquipementChange(): void {
    const equip = this.equipements.find(e => e.id === this.rapport.equipementId);
    if (equip) {
      this.rapport.equipementNom = equip.nom + ' - ' + (equip.numeroSerie || '');
      this.rapport.parc = equip.parc || '';
    }
    this.cdr.detectChanges();
  }

  ajouterPiece(): void {
    this.rapport.pieces.push({ nom: '', reference: '', quantite: 1, cout: 0 });
  }

  supprimerPiece(i: number): void {
    this.rapport.pieces.splice(i, 1);
  }

  onPieceSelectChange(p: any): void {
    const found = this.piecesDisponibles.find(pd => pd.nom === p.nom);
    if (found) {
      p.reference = found.reference || '';
      p.cout = found.prixUnitaire || 0;
    }
    this.cdr.detectChanges();
  }

  addPageHeader(doc: jsPDF, navy: number[], white: number[], titre: string): void {
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 10, 'F');
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SCRIM - BiomédMaint  |  ' + titre, 105, 7, { align: 'center' });
  }

  genererPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const navy = [26, 35, 126];
    const blue = [21, 101, 192];
    const gray = [245, 247, 250];
    const white = [255, 255, 255];
    const text = [51, 51, 51];
    const typeColors: any = {
      'CORRECTIF': [21, 101, 192],
      'PREVENTIF': [27, 94, 32],
      'MISE_A_JOUR': [21, 101, 192],
    };
    const typeColor = typeColors[this.rapport.type] || navy;
    const fc = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);
    const tc = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);

    fc(navy); doc.rect(0, 0, W, 35, 'F');
    fc(blue); doc.roundedRect(10, 7, 40, 20, 2, 2, 'F');
    tc(white);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 30, 20, { align: 'center' });
    doc.setFontSize(17); doc.setFont('helvetica', 'bold'); tc(white);
    doc.text(this.rapport.titre, W / 2 + 20, 16, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Rapport genere par BiomédMaint', W / 2 + 20, 26, { align: 'center' });
    fc(typeColor); doc.rect(0, 35, W, 2, 'F');

    let y = 43;

    fc(typeColor); doc.rect(10, y, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Informations generales', 14, y + 5);
    y += 10;

    const infosGen = [
      ['Equipement :', this.rapport.equipementNom || '-'],
      ['Parc :', this.rapport.parc || '-'],
      ['Responsable FSE :', this.rapport.responsable || '-'],
      ['Periode :', this.rapport.periode || '-'],
      ['Date :', new Date(this.rapport.dateRapport).toLocaleDateString('fr-FR')],
      ['Duree :', this.rapport.duree ? this.rapport.duree + ' heures' : '-'],
    ];

    infosGen.forEach((info, i) => {
      if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { fc(gray); }
      doc.rect(10, y - 3, W - 20, 8, 'F');
      fc(typeColor); doc.rect(10, y - 3, 2.5, 8, 'F');
      doc.setFont('helvetica', 'bold'); tc(typeColor); doc.setFontSize(9);
      doc.text(info[0], 15, y + 2);
      doc.setFont('helvetica', 'normal'); tc(text);
      doc.text(info[1], 70, y + 2);
      y += 9;
    });
    y += 5;

    if (this.rapport.type === 'CORRECTIF') {
      const sections = [
        { title: 'Code erreur Philips', val: this.rapport.codeErreur || '-' },
        { title: 'Description de la panne', val: this.rapport.descriptionPanne || '-' },
        { title: 'Causes identifiees', val: this.rapport.causes || '-' },
        { title: 'Actions correctives effectuees', val: this.rapport.actions || '-' },
        { title: 'Observations finales', val: this.rapport.observations || '-' },
      ];

      sections.forEach((sec) => {
        if (y > 240) { doc.addPage(); this.addPageHeader(doc, navy, white, this.rapport.titre); y = 25; }
        fc(typeColor); doc.rect(10, y, W - 20, 7, 'F');
        tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text(sec.title, 14, y + 5);
        y += 10;
        fc(gray); doc.rect(10, y, W - 20, 20, 'F');
        fc(typeColor); doc.rect(10, y, 2.5, 20, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(text);
        const lines = doc.splitTextToSize(sec.val, W - 28);
        doc.text(lines, 15, y + 6);
        y += 24;
      });

      if (this.rapport.pieces.length > 0) {
        if (y > 220) { doc.addPage(); this.addPageHeader(doc, navy, white, this.rapport.titre); y = 25; }
        fc(typeColor); doc.rect(10, y, W - 20, 7, 'F');
        tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text('Pieces de rechange utilisees', 14, y + 5);
        y += 10;
        fc(navy); doc.rect(10, y, W - 20, 6, 'F');
        tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text('Designation', 20, y + 4);
        doc.text('Reference', 75, y + 4);
        doc.text('Quantite', 120, y + 4);
        doc.text('Cout unitaire (DH)', 145, y + 4);
        doc.text('Total (DH)', 180, y + 4);
        y += 8;

        this.rapport.pieces.forEach((p: any, i: number) => {
          if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { fc(gray); }
          doc.rect(10, y - 3, W - 20, 7, 'F');
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); tc(text);
          doc.text(p.nom || '-', 14, y + 1);
          doc.text(p.reference || '-', 75, y + 1);
          doc.text(String(p.quantite || 0), 128, y + 1, { align: 'center' });
          doc.text(String(p.cout || 0), 165, y + 1, { align: 'center' });
          doc.text(String((p.quantite || 0) * (p.cout || 0)), 193, y + 1, { align: 'right' });
          y += 7;
        });

        const totalPieces = this.rapport.pieces.reduce((a: number, p: any) => a + (p.quantite || 0) * (p.cout || 0), 0);
        fc(navy); doc.rect(10, y, W - 20, 7, 'F');
        tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('TOTAL PIECES :', 140, y + 5);
        doc.text(totalPieces.toLocaleString('fr-FR') + ' DH', 193, y + 5, { align: 'right' });
        y += 12;
      }

      if (this.rapport.cout) {
        fc(gray); doc.rect(10, y, W - 20, 8, 'F');
        fc(typeColor); doc.rect(10, y, 2.5, 8, 'F');
        doc.setFont('helvetica', 'bold'); tc(typeColor); doc.setFontSize(10);
        doc.text("Cout total de l'intervention :", 15, y + 5.5);
        doc.text(Number(this.rapport.cout).toLocaleString('fr-FR') + ' DH', W - 14, y + 5.5, { align: 'right' });
        y += 12;
      }
    }

    if (this.rapport.type === 'PREVENTIF') {
      fc(typeColor); doc.rect(10, y, W - 20, 7, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Operations preventives effectuees', 14, y + 5);
      y += 10;
      fc(gray); doc.rect(10, y, W - 20, 25, 'F');
      fc(typeColor); doc.rect(10, y, 2.5, 25, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(text);
      const linesOp = doc.splitTextToSize(this.rapport.operationsEffectuees || '-', W - 28);
      doc.text(linesOp, 15, y + 6);
      y += 30;

      fc(typeColor); doc.rect(10, y, W - 20, 7, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Checklist des operations', 14, y + 5);
      y += 10;

      this.checklistItems.forEach((item, i) => {
        if (y > 270) { doc.addPage(); this.addPageHeader(doc, navy, white, this.rapport.titre); y = 25; }
        if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { fc(gray); }
        doc.rect(10, y - 3, W - 20, 7, 'F');
        if (item.fait) { doc.setTextColor(46, 125, 50); } else { doc.setTextColor(189, 189, 189); }
        doc.setFontSize(11);
        doc.text(item.fait ? 'v' : 'o', 16, y + 2);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); tc(text);
        doc.text(item.label, 24, y + 2);
        y += 7;
      });
      y += 5;

      const etats: any = {
        'BON': 'Bon etat - Equipement operationnel',
        'ACCEPTABLE': 'Etat acceptable - Surveillance recommandee',
        'DEGRADÉ': 'Etat degrade - Intervention corrective necessaire',
      };
      fc(gray); doc.rect(10, y, W - 20, 8, 'F');
      fc(typeColor); doc.rect(10, y, 2.5, 8, 'F');
      doc.setFont('helvetica', 'bold'); tc(typeColor); doc.setFontSize(10);
      doc.text('Etat general :', 15, y + 5.5);
      doc.setFont('helvetica', 'normal'); tc(text);
      doc.text(etats[this.rapport.etatEquipement] || this.rapport.etatEquipement || '-', 55, y + 5.5);
      y += 12;

      if (this.rapport.prochaineMaintenance) {
        fc(gray); doc.rect(10, y, W - 20, 8, 'F');
        fc(typeColor); doc.rect(10, y, 2.5, 8, 'F');
        doc.setFont('helvetica', 'bold'); tc(typeColor); doc.setFontSize(10);
        doc.text('Prochaine maintenance :', 15, y + 5.5);
        doc.setFont('helvetica', 'normal'); tc(text);
        doc.text(new Date(this.rapport.prochaineMaintenance).toLocaleDateString('fr-FR'), 80, y + 5.5);
        y += 12;
      }

      if (this.rapport.observations) {
        fc(typeColor); doc.rect(10, y, W - 20, 7, 'F');
        tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text('Recommandations', 14, y + 5);
        y += 10;
        fc(gray); doc.rect(10, y, W - 20, 20, 'F');
        fc(typeColor); doc.rect(10, y, 2.5, 20, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(text);
        const linesObs = doc.splitTextToSize(this.rapport.observations, W - 28);
        doc.text(linesObs, 15, y + 6);
        y += 24;
      }
    }

    if (this.rapport.type === 'MISE_A_JOUR') {
      const secMAJ = [
        { title: 'Reference FCO Philips', val: this.rapport.referenceFCO || '-' },
        { title: 'Version avant mise a jour', val: this.rapport.versionAvant || '-' },
        { title: 'Version apres mise a jour', val: this.rapport.versionApres || '-' },
        { title: 'Description de la mise a jour', val: this.rapport.actions || '-' },
        { title: 'Tests de validation effectues', val: this.rapport.observations || '-' },
      ];

      secMAJ.forEach((sec) => {
        if (y > 240) { doc.addPage(); this.addPageHeader(doc, navy, white, this.rapport.titre); y = 25; }
        fc(gray); doc.rect(10, y - 3, W - 20, 8, 'F');
        fc(typeColor); doc.rect(10, y - 3, 2.5, 8, 'F');
        doc.setFont('helvetica', 'bold'); tc(typeColor); doc.setFontSize(9);
        doc.text(sec.title + ' :', 15, y + 2);
        doc.setFont('helvetica', 'normal'); tc(text);
        const linesMAJ = doc.splitTextToSize(sec.val, W - 80);
        doc.text(linesMAJ, 80, y + 2);
        y += 12;
      });

      if (this.rapport.cout) {
        y += 5;
        fc(gray); doc.rect(10, y, W - 20, 8, 'F');
        fc(typeColor); doc.rect(10, y, 2.5, 8, 'F');
        doc.setFont('helvetica', 'bold'); tc(typeColor); doc.setFontSize(10);
        doc.text("Cout total de l'intervention :", 15, y + 5.5);
        doc.text(Number(this.rapport.cout).toLocaleString('fr-FR') + ' DH', W - 14, y + 5.5, { align: 'right' });
        y += 12;
      }
    }

    y += 10;
    const sigY = Math.min(y, 248);
    fc(gray);
    doc.rect(10, sigY, 85, 28, 'F'); doc.rect(115, sigY, 85, 28, 'F');
    fc(typeColor);
    doc.rect(10, sigY, 85, 6, 'F'); doc.rect(115, sigY, 85, 6, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text('Responsable technique / FSE', 52, sigY + 4.5, { align: 'center' });
    doc.text('Responsable SCRIM', 157, sigY + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); tc(text);
    doc.text('Nom :', 14, sigY + 14);
    doc.text(this.rapport.responsable || '______________________', 52, sigY + 22, { align: 'center' });
    doc.text('______________________', 157, sigY + 22, { align: 'center' });
    doc.text('Signature :', 14, sigY + 24);

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      fc(navy); doc.rect(0, 287, W, 10, 'F');
      tc(white); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text('SCRIM - BiomédMaint  |  Confidentiel', 14, 293);
      doc.text('Page ' + p + ' / ' + totalPages, W - 14, 293, { align: 'right' });
      doc.text('Genere le ' + new Date().toLocaleDateString('fr-FR'), W / 2, 293, { align: 'center' });
    }

    doc.save('Rapport_' + this.rapport.type + '_SCRIM_' + this.rapport.dateRapport + '.pdf');
  }

  goBack(): void { this.router.navigate(['/rapports']); }
}
