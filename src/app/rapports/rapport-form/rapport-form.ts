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
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './rapport-form.html',
  styleUrl: './rapport-form.scss'
})
export class RapportForm implements OnInit {
  equipements: any[] = [];
  piecesDisponibles: any[] = [];
  parcsList: string[] = [];
  isLoading = false;
  submitted = false;

  rapport: any = {
    type: '', numeroRapport: '', client: '', ville: '', salle: '',
    dateRapport: new Date().toISOString().slice(0, 10),
    equipementId: '', equipementNom: '', numeroSerie: '',
    utilisationConforme: true, interventionAchevee: true,
    ingenieur1Nom: '', ingenieur1Date: '', ingenieur1Arrivee: '', ingenieur1Depart: '',
    ingenieur2Nom: '', ingenieur2Date: '', ingenieur2Arrivee: '', ingenieur2Depart: '',
    rapportTechnique: '', codeErreur: '', pieces: [],
    typeInstallation: false, typeFormation: false, typeGarantie: false,
    typePreventif: false, typeCorrectif: false, typeFacturable: false,
    nomClient: '', nomServiceClient: '', fonctionServiceClient: '', etablissementClient: '',
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

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

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
    this.rapport.typePreventif = this.rapport.type === 'PREVENTIF';
    this.rapport.typeCorrectif = this.rapport.type === 'CORRECTIF';
    this.cdr.detectChanges();
  }

  onEquipementChange(): void {
    const equip = this.equipements.find(e => e.id === this.rapport.equipementId);
    if (equip) {
      this.rapport.equipementNom = equip.nom || '';
      this.rapport.numeroSerie = equip.numeroSerie || '';
      this.rapport.client = equip.parc || '';
      this.rapport.ville = '';
    }
    this.cdr.detectChanges();
  }

  ajouterPiece(): void {
    this.rapport.pieces.push({ reference: '', quantite: 1, numeroBs: '', designation: '' });
  }

  supprimerPiece(i: number): void { this.rapport.pieces.splice(i, 1); }

  onPieceSelectChange(p: any): void {
    const found = this.piecesDisponibles.find(pd => pd.nom === p.designation);
    if (found) { p.reference = found.reference || ''; }
    this.cdr.detectChanges();
  }

  get isFormValid(): boolean {
    return !!(this.rapport.client && this.rapport.equipementId && this.rapport.dateRapport);
  }

  isInvalid(field: any): boolean { return this.submitted && !field; }

  genererPDF(): void {
    this.submitted = true;
    if (!this.isFormValid) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const navy = [26, 35, 126];
    const blue = [21, 101, 192];
    const white = [255, 255, 255];
    const text = [30, 30, 30];
    const lightBlue = [227, 242, 253];
    const fc = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);
    const tc = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);
    const border = (x: number, y: number, w: number, h: number) => {
      doc.setDrawColor(150, 150, 150); doc.rect(x, y, w, h);
    };
    const dateFormatted = this.rapport.dateRapport
      ? new Date(this.rapport.dateRapport).toLocaleDateString('fr-FR') : '';

    fc(navy); doc.rect(0, 0, W, 22, 'F');
    fc(blue); doc.roundedRect(8, 4, 38, 14, 1, 1, 'F');
    tc(white); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 27, 13, { align: 'center' });
    tc(white); doc.setFontSize(9);
    doc.text('SCRIM - Fiche 34 - Version 01', W / 2 + 15, 9, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('N Eco : 0802 000 089  |  sav@scrim.ma', W / 2 + 15, 15, { align: 'center' });

    fc(blue); doc.rect(0, 22, W, 10, 'F');
    tc(white); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT D INTERVENTION  -  N ' + (this.rapport.numeroRapport || '______'), W / 2, 29, { align: 'center' });

    let y = 36;
    const colW = (W - 20) / 2;

    border(10, y, colW, 30);
    doc.setFont('helvetica', 'bold'); tc(navy); doc.setFontSize(8.5);
    doc.text('Client :', 13, y + 7);
    doc.text('Ville :', 13, y + 14);
    doc.text('Materiel :', 13, y + 21);
    doc.text('N serie :', 13, y + 28);
    doc.setFont('helvetica', 'normal'); tc(text);
    doc.text(this.rapport.client || '', 40, y + 7);
    doc.text(this.rapport.ville || '', 40, y + 14);
    doc.text(this.rapport.equipementNom || '', 40, y + 21);
    doc.text(this.rapport.numeroSerie || '', 40, y + 28);

    border(10 + colW, y, colW, 30);
    doc.setFont('helvetica', 'bold'); tc(navy);
    doc.text('Date :', 13 + colW, y + 7);
    doc.text('Salle :', 13 + colW, y + 14);
    doc.setFont('helvetica', 'normal'); tc(text);
    doc.text(dateFormatted, 50 + colW, y + 7);
    doc.text(this.rapport.salle || '', 50 + colW, y + 14);
    y += 34;

    fc(navy); doc.rect(10, y, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('INGENIEURS INTERVENANTS', W / 2, y + 5, { align: 'center' });
    y += 7;

    fc(lightBlue); doc.rect(10, y, W - 20, 6, 'F');
    border(10, y, W - 20, 6);
    tc(navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Nom', 30, y + 4);
    doc.text('Date', 90, y + 4);
    doc.text('H. Arrivee', 130, y + 4);
    doc.text('H. Depart', 165, y + 4);
    y += 6;

    [
      [this.rapport.ingenieur1Nom, this.rapport.ingenieur1Date, this.rapport.ingenieur1Arrivee, this.rapport.ingenieur1Depart],
      [this.rapport.ingenieur2Nom, this.rapport.ingenieur2Date, this.rapport.ingenieur2Arrivee, this.rapport.ingenieur2Depart],
    ].forEach(ing => {
      border(10, y, W - 20, 8);
      tc(text); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.text(ing[0] || '', 15, y + 5.5);
      doc.text(ing[1] ? new Date(ing[1]).toLocaleDateString('fr-FR') : '', 85, y + 5.5);
      doc.text(ing[2] || '', 130, y + 5.5);
      doc.text(ing[3] || '', 165, y + 5.5);
      y += 8;
    });
    y += 4;

    fc(navy); doc.rect(10, y, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('RAPPORT TECHNIQUE', W / 2, y + 5, { align: 'center' });
    y += 7;
    border(10, y, W - 20, 30);
    doc.setFont('helvetica', 'normal'); tc(text); doc.setFontSize(8.5);
    const techLines = doc.splitTextToSize(this.rapport.rapportTechnique || '', W - 26);
    doc.text(techLines, 14, y + 7);
    y += 34;

    fc(navy); doc.rect(10, y, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PIECES FOURNIES', W / 2, y + 5, { align: 'center' });
    y += 7;
    fc(lightBlue); doc.rect(10, y, W - 20, 6, 'F');
    border(10, y, W - 20, 6);
    tc(navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Ref', 20, y + 4); doc.text('Qte', 72, y + 4);
    doc.text('N BS', 95, y + 4); doc.text('Designation', 130, y + 4);
    y += 6;

    const pieces = this.rapport.pieces.length > 0 ? this.rapport.pieces : [{ reference: '', quantite: '', numeroBs: '', designation: '' }];
    pieces.forEach((p: any) => {
      border(10, y, W - 20, 8);
      tc(text); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.text(p.reference || '', 15, y + 5.5);
      doc.text(String(p.quantite || ''), 72, y + 5.5);
      doc.text(p.numeroBs || '', 95, y + 5.5);
      doc.text(p.designation || '', 130, y + 5.5);
      y += 8;
    });
    y += 6;

    fc(navy); doc.rect(0, 287, W, 10, 'F');
    tc(white); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('Avenue Mohamed Elyazidi, Hay Riad - Rabat  |  Tel : +212 (5) 37 56 64 84  |  www.scrim.ma', W / 2, 293, { align: 'center' });

    doc.save('Rapport_SCRIM_' + (this.rapport.numeroRapport || 'N') + '_' + this.rapport.dateRapport + '.pdf');
  }

  goBack(): void { this.router.navigate(['/rapports']); }
}
