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
  selector: 'app-planning-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './planning-form.html',
  styleUrl: './planning-form.scss'
})
export class PlanningForm implements OnInit {

  equipements: any[] = [];
  parcsList: string[] = [];
  isLoading = true;

  planning: any = {
    titre: 'Planning de Maintenance Préventive',
    client: '',
    parc: '',
    equipementId: '',
    equipementNom: '',
    responsable: '',
    dateCreation: new Date().toISOString().slice(0, 10),
    dateDebut: '',
    dateFin: '',
    typeMaintenance: 'PREVENTIF',
    dureeEstimee: null,
    frequence: '',
    objectifs: '',
    operations: [],
    observations: '',
    contactClient: '',
    emailClient: '',
    telephoneClient: '',
  };

  operationsDisponibles = [
    'Nettoyage des sondes ultrasonores',
    'Verification et nettoyage des connecteurs',
    'Test de l alimentation electrique',
    'Verification des cables et connections',
    'Test fonctionnel des modes B, M, Doppler',
    'Verification de la qualite image',
    'Nettoyage du panneau de controle',
    'Test de l imprimante integree',
    'Verification et mise a jour logiciels',
    'Test de l archivage et connectivite reseau',
    'Calibration des parametres acoustiques',
    'Inspection mecanique generale',
  ];

  operationsSelectionnees: { operation: string, duree: string, responsable: string }[] = [];

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
  }

  onEquipementChange(): void {
    const equip = this.equipements.find(e => e.id === this.planning.equipementId);
    if (equip) {
      this.planning.equipementNom = equip.nom + ' - ' + (equip.numeroSerie || '');
      this.planning.parc = equip.parc || '';
      this.planning.client = equip.parc || '';
    }
    this.cdr.detectChanges();
  }

  ajouterOperation(): void {
    this.operationsSelectionnees.push({ operation: '', duree: '', responsable: '' });
  }

  supprimerOperation(i: number): void {
    this.operationsSelectionnees.splice(i, 1);
  }

  genererPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const navy = [26, 35, 126];
    const blue = [21, 101, 192];
    const gray = [245, 247, 250];
    const white = [255, 255, 255];
    const text = [51, 51, 51];
    const green = [27, 94, 32];

    const fc = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);
    const tc = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);

    // HEADER
    fc(navy); doc.rect(0, 0, W, 35, 'F');
    fc(blue); doc.roundedRect(10, 7, 40, 20, 2, 2, 'F');
    tc(white);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 30, 20, { align: 'center' });
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(this.planning.titre, W / 2 + 20, 15, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Soumis pour accord client', W / 2 + 20, 25, { align: 'center' });
    fc(green); doc.rect(0, 35, W, 2, 'F');

    let y = 43;

    // INFOS CLIENT
    fc(green); doc.rect(10, y, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Informations client', 14, y + 5);
    y += 10;

    const infosClient = [
      ['Client / Etablissement :', this.planning.client || '-'],
      ['Parc :', this.planning.parc || '-'],
      ['Contact client :', this.planning.contactClient || '-'],
      ['Email :', this.planning.emailClient || '-'],
      ['Telephone :', this.planning.telephoneClient || '-'],
    ];

    infosClient.forEach((info, i) => {
      if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { fc(gray); }
      doc.rect(10, y - 3, W - 20, 8, 'F');
      fc(green); doc.rect(10, y - 3, 2.5, 8, 'F');
      doc.setFont('helvetica', 'bold'); tc(green); doc.setFontSize(9);
      doc.text(info[0], 15, y + 2);
      doc.setFont('helvetica', 'normal'); tc(text);
      doc.text(info[1], 75, y + 2);
      y += 9;
    });
    y += 5;

    // INFOS PLANNING
    fc(navy); doc.rect(10, y, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Informations du planning', 14, y + 5);
    y += 10;

    const infosPlanning = [
      ['Equipement :', this.planning.equipementNom || '-'],
      ['Type de maintenance :', this.planning.typeMaintenance || '-'],
      ['Responsable SCRIM :', this.planning.responsable || '-'],
      ['Date de debut :', this.planning.dateDebut ? new Date(this.planning.dateDebut).toLocaleDateString('fr-FR') : '-'],
      ['Date de fin :', this.planning.dateFin ? new Date(this.planning.dateFin).toLocaleDateString('fr-FR') : '-'],
      ['Duree estimee :', this.planning.dureeEstimee ? this.planning.dureeEstimee + ' heures' : '-'],
      ['Frequence :', this.planning.frequence || '-'],
      ['Date creation :', new Date(this.planning.dateCreation).toLocaleDateString('fr-FR')],
    ];

    infosPlanning.forEach((info, i) => {
      if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { fc(gray); }
      doc.rect(10, y - 3, W - 20, 8, 'F');
      fc(navy); doc.rect(10, y - 3, 2.5, 8, 'F');
      doc.setFont('helvetica', 'bold'); tc(navy); doc.setFontSize(9);
      doc.text(info[0], 15, y + 2);
      doc.setFont('helvetica', 'normal'); tc(text);
      doc.text(info[1], 75, y + 2);
      y += 9;
    });
    y += 5;

    // OBJECTIFS
    if (this.planning.objectifs) {
      fc(navy); doc.rect(10, y, W - 20, 7, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Objectifs de la maintenance', 14, y + 5);
      y += 10;
      fc(gray); doc.rect(10, y, W - 20, 20, 'F');
      fc(navy); doc.rect(10, y, 2.5, 20, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(text);
      const linesObj = doc.splitTextToSize(this.planning.objectifs, W - 28);
      doc.text(linesObj, 15, y + 6);
      y += 25;
    }

    // OPERATIONS PLANIFIEES
    if (this.operationsSelectionnees.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      fc(green); doc.rect(10, y, W - 20, 7, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Operations planifiees', 14, y + 5);
      y += 10;

      fc(navy); doc.rect(10, y, W - 20, 6, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('Operation', 14, y + 4);
      doc.text('Duree estimee', 120, y + 4);
      doc.text('Responsable', 160, y + 4);
      y += 8;

      this.operationsSelectionnees.forEach((op, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(255, 255, 255); } else { fc(gray); }
        doc.rect(10, y - 3, W - 20, 7, 'F');
        fc(green); doc.rect(10, y - 3, 2.5, 7, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); tc(text);
        doc.text(op.operation || '-', 15, y + 1);
        doc.text(op.duree || '-', 120, y + 1);
        doc.text(op.responsable || '-', 160, y + 1);
        doc.setDrawColor(220, 220, 220);
        doc.line(10, y + 4, W - 10, y + 4);
        y += 7;
      });
      y += 5;
    }

    // OBSERVATIONS
    if (this.planning.observations) {
      if (y > 240) { doc.addPage(); y = 20; }
      fc(navy); doc.rect(10, y, W - 20, 7, 'F');
      tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Observations', 14, y + 5);
      y += 10;
      fc(gray); doc.rect(10, y, W - 20, 20, 'F');
      fc(navy); doc.rect(10, y, 2.5, 20, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(text);
      const linesObs = doc.splitTextToSize(this.planning.observations, W - 28);
      doc.text(linesObs, 15, y + 6);
      y += 25;
    }

    // ACCORD CLIENT
    y += 10;
    const sigY = Math.min(y, 240);
    fc(gray); doc.rect(10, sigY, W - 20, 35, 'F');
    fc(green); doc.rect(10, sigY, W - 20, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Accord et signatures', 14, sigY + 5);

    fc(gray);
    doc.rect(10, sigY + 10, 85, 22, 'F');
    doc.rect(115, sigY + 10, 85, 22, 'F');
    fc(navy);
    doc.rect(10, sigY + 10, 85, 6, 'F');
    doc.rect(115, sigY + 10, 85, 6, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text('Representant Client', 52, sigY + 14.5, { align: 'center' });
    doc.text('Responsable SCRIM', 157, sigY + 14.5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); tc(text);
    doc.text('Nom :', 14, sigY + 22);
    doc.text(this.planning.contactClient || '______________________', 52, sigY + 28, { align: 'center' });
    doc.text(this.planning.responsable || '______________________', 157, sigY + 28, { align: 'center' });
    doc.text('Signature :', 14, sigY + 31);

    // FOOTER
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      fc(navy); doc.rect(0, 287, W, 10, 'F');
      tc(white); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text('SCRIM  |  Document soumis pour accord client', 14, 293);
      doc.text('Page ' + p + ' / ' + totalPages, W - 14, 293, { align: 'right' });
      doc.text('Genere le ' + new Date().toLocaleDateString('fr-FR'), W / 2, 293, { align: 'center' });
    }

    doc.save('Planning_Maintenance_SCRIM_' + this.planning.client + '_' + this.planning.dateCreation + '.pdf');
  }

  goBack(): void { this.router.navigate(['/planning']); }
}
