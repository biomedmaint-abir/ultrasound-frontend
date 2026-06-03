import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-planning-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning-form.html',
  styleUrl: './planning-form.scss'
})
export class PlanningForm implements OnInit {

  equipements: any[] = [];
  parcsList: string[] = [];
  villesList: string[] = [];
  isLoading = true;
  submitted = false;

  planning: any = {
    annee: new Date().getFullYear().toString(),
    client: '', ville: '', appareil: '',
    marque: 'PHILIPS MEDICAL SYSTEMS',
    numeroSerie: '', responsable: '',
    frequence: 'trimestrielles',
    dateCreation: new Date().toISOString().slice(0, 10),
  };

  visites: { dateDebut: string, dateFin: string }[] = [
    { dateDebut: '', dateFin: '' },
    { dateDebut: '', dateFin: '' },
    { dateDebut: '', dateFin: '' },
    { dateDebut: '', dateFin: '' },
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
        this.parcsList = [...new Set(data.map((e: any) => e.parc).filter((p: any) => p))] as string[];
        this.villesList = [...new Set(this.parcsList.map(p => p.split(' ').slice(-1)[0]).filter((v: string) => v))];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  onClientChange(): void {
    const mapping: {[key: string]: string} = {
      'CHU Tanger': 'Tanger', 'HCZ Rabat': 'Rabat',
      'CHU Mohamed VI Oujda': 'Oujda', 'Clinique Tarik Ibn Ziyad': 'Tanger',
      'HCK Casablanca': 'Casablanca', 'Clinique Slaoui Rabat': 'Rabat',
      'Hopital Militaire Avicenne Marrakech': 'Marrakech',
    };
    this.planning.ville = mapping[this.planning.client] || '';
  }

  onEquipementChange(): void {
    const equip = this.equipements.find(e => e.nom === this.planning.appareil);
    if (equip) {
      this.planning.numeroSerie = equip.numeroSerie || '';
      this.planning.client = equip.parc || '';
    }
    this.cdr.detectChanges();
  }

  get isFormValid(): boolean {
    return !!(this.planning.client && this.planning.ville && this.planning.appareil &&
      this.planning.annee && this.planning.marque && this.planning.numeroSerie &&
      this.planning.responsable && this.planning.frequence);
  }

  isInvalid(field: any): boolean { return this.submitted && !field; }

  genererPDF(): void {
    this.submitted = true;
    if (!this.isFormValid) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const navy = [26, 35, 126]; const blue = [21, 101, 192];
    const white = [255, 255, 255]; const text = [30, 30, 30];

    const fc = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);
    const tc = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);

    fc(navy); doc.rect(0, 0, W, 40, 'F');
    fc(blue); doc.roundedRect(10, 8, 45, 22, 2, 2, 'F');
    tc(white); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('SCRIM', 32, 21, { align: 'center' });
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    doc.text('Societe de Commercialisation et de', 32, 26, { align: 'center' });
    doc.text('Reparation des Instruments Medicaux', 32, 30, { align: 'center' });

    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); tc(white);
    doc.text('Planning Maintenances Preventives ' + this.planning.annee, W / 2 + 18, 20, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('sav@scrim.ma  |  N Eco Scrim: 0802 000 089', W / 2 + 18, 30, { align: 'center' });

    fc(blue); doc.rect(0, 40, W, 1.5, 'F');
    let y = 55;

    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); tc(navy);
    doc.text('Informations client', 15, y);
    y += 3;
    doc.setDrawColor(navy[0], navy[1], navy[2]);
    doc.line(15, y, W - 15, y);
    y += 8;

    const infos = [
      ['Client', this.planning.client || '—'],
      ['Ville', this.planning.ville || '—'],
      ['Appareil', this.planning.appareil || '—'],
      ['Marque', this.planning.marque || 'PHILIPS MEDICAL SYSTEMS'],
      ['Numero de Serie', this.planning.numeroSerie || '—'],
    ];

    infos.forEach((info, i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 249, 252); } else { doc.setFillColor(255, 255, 255); }
      doc.rect(15, y - 4, W - 30, 9, 'F');
      doc.setFont('helvetica', 'bold'); tc(navy); doc.setFontSize(10);
      doc.text(info[0] + ' :', 18, y + 1);
      doc.setFont('helvetica', 'normal'); tc(text);
      doc.text(info[1], 75, y + 1);
      y += 10;
    });

    y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); tc(text);
    const texteOfficiel = `Nous vous saurions gre de trouver ci-apres, les dates retenues au titre des maintenances preventives ${this.planning.frequence} assignees a l appareil precite :`;
    const lines = doc.splitTextToSize(texteOfficiel, W - 30);
    doc.text(lines, 15, y);
    y += lines.length * 7 + 5;

    const ordinals = ['1ere', '2eme', '3eme', '4eme'];
    this.visites.forEach((visite, i) => {
      if (visite.dateDebut && visite.dateFin) {
        const d1 = new Date(visite.dateDebut);
        const d2 = new Date(visite.dateFin);
        const jour1 = d1.getDate().toString().padStart(2, '0');
        const jour2 = d2.getDate().toString().padStart(2, '0');
        const mois = d2.toLocaleDateString('fr-FR', { month: '2-digit' });
        const annee = d2.getFullYear();
        doc.setFont('helvetica', 'bold'); tc(navy); doc.setFontSize(11);
        doc.text('•', 18, y);
        doc.setFont('helvetica', 'normal'); tc(text);
        doc.text(`${ordinals[i]} Visite : Entre le ${jour1} et le ${jour2}/${mois}/${annee}.`, 25, y);
        y += 10;
      }
    });

    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, W - 15, y);
    y += 15;

    fc([245, 247, 250]); doc.rect(10, y, W - 20, 35, 'F');
    fc(navy); doc.rect(10, y, 90, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Direction Technique SCRIM', 55, y + 5, { align: 'center' });
    fc(blue); doc.rect(110, y, 90, 7, 'F');
    tc(white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    const clientShort = this.planning.client.length > 20 ? this.planning.client.substring(0, 18) + '...' : this.planning.client;
    doc.text(clientShort || 'Client', 155, y + 5, { align: 'center' });
    tc(text); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Nom et Signature :', 15, y + 18);
    doc.text('Nom et Signature :', 115, y + 18);
    doc.setDrawColor(150, 150, 150);
    doc.line(15, y + 30, 95, y + 30);
    doc.line(115, y + 30, 195, y + 30);

    fc(navy); doc.rect(0, 287, W, 10, 'F');
    tc(white); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('SCRIM  |  sav@scrim.ma  |  N Eco: 0802 000 089', 14, 293);
    doc.text('Document confidentiel', W - 14, 293, { align: 'right' });
    doc.text('Genere le ' + new Date().toLocaleDateString('fr-FR'), W / 2, 293, { align: 'center' });

    doc.save('Planning_Maintenance_SCRIM_' + (this.planning.client || 'Client') + '_' + this.planning.annee + '.pdf');
  }

  goBack(): void { this.router.navigate(['/planning']); }
}