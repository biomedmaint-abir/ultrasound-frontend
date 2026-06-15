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
import { MatTableModule } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule
  ],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.scss'
})
export class RapportsComponent implements OnInit {

  interventions: any[] = [];
  filtered: any[] = [];
  isLoading = true;

  filterStatut = '';
  filterType = '';
  filterParc = '';
  filterFse = '';
  fseList: string[] = [];
  selectedRapport: any = null;
  filterDateDebut = '';
  filterDateFin = '';
  parcsList: string[] = [];

  statuts = ['EN_COURS', 'TERMINEE', 'EN_ATTENTE_PIECE'];
  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];

  stats = { total: 0, terminees: 0, enCours: 0, mttrMoyen: 0, coutTotal: 0 };

  displayedColumns = ['id', 'date', 'type', 'statut', 'equipement', 'technicien', 'cout'];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadFseList();
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data;
        this.filtered = data;
        this.calculateStats();
        this.parcsList = [...new Set(data.map((i: any) => i.equipement?.parc).filter((p: any) => p))];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
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

  loadFseList(): void {
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({
      next: (users) => {
        this.fseList = users.filter(u => u.role?.nom === 'TECHNICIEN').map(u => u.prenom || u.nom);
      }
    });
  }

  applyFilter(): void {
    this.filtered = this.interventions.filter(i => {
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      const matchType = !this.filterType || i.type === this.filterType;
      const matchParc = !this.filterParc || i.equipement?.parc === this.filterParc;
      const matchFse = !this.filterFse || i.nomFse === this.filterFse;
      const matchDateDebut = !this.filterDateDebut || (i.dateIntervention && i.dateIntervention >= this.filterDateDebut);
      const matchDateFin = !this.filterDateFin || (i.dateIntervention && i.dateIntervention <= this.filterDateFin);
      return matchStatut && matchType && matchParc && matchFse && matchDateDebut && matchDateFin;
    });
    this.calculateStats();
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterStatut = ''; this.filterType = ''; this.filterParc = ''; this.filterFse = '';
    this.filterDateDebut = ''; this.filterDateFin = '';
    this.filtered = [...this.interventions];
    this.calculateStats();
    this.cdr.detectChanges();
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'TERMINEE': return 'statut-termine';
      case 'EN_COURS': return 'statut-en-cours';
      case 'EN_ATTENTE_PIECE': return 'statut-attente';
      default: return '';
    }
  }

  getCoutTotal(): number {
    return this.filtered.reduce((sum, i) => sum + (i.coutTotal || 0), 0);
  }

  ouvrirDetail(row: any): void {
    this.selectedRapport = row;
  }

  telechargerPDF(inv: any): void {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      doc.setFillColor(28, 43, 90); doc.rect(0, 0, W, 35, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('SCRIM', 20, 20);
      doc.setFontSize(14); doc.text('Rapport d\'Intervention — Fiche 34', W/2, 18, { align: 'center' });
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Format officiel SCRIM', W/2, 27, { align: 'center' });
      let y = 45;
      const infos = [
        ['Equipement', inv.equipement?.nom || '—'],
        ['Site / Parc', inv.equipement?.parc || '—'],
        ['Type', inv.type || '—'],
        ['Date', new Date(inv.dateIntervention).toLocaleDateString('fr-FR')],
        ['FSE', inv.nomFse || '—'],
        ['Duree', inv.dureeHeures ? inv.dureeHeures + 'h' : '—'],
        ['Cout total', inv.coutTotal ? inv.coutTotal + ' DH' : '—'],
        ['Statut', inv.statut || '—'],
      ];
      doc.setTextColor(0,0,0);
      infos.forEach((info, idx) => {
        if (idx % 2 === 0) doc.setFillColor(245,247,250); else doc.setFillColor(255,255,255);
        doc.rect(10, y-3, W-20, 8, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(28,43,90);
        doc.text(info[0] + ' :', 14, y+2);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(51,51,51);
        doc.text(info[1], 70, y+2);
        y += 9;
      });
      if (inv.descriptionPanne) {
        y += 6;
        doc.setFillColor(28,43,90); doc.rect(10, y, W-20, 7, 'F');
        doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.text('Description', 14, y+5);
        y += 10;
        doc.setFillColor(245,247,250); doc.rect(10, y, W-20, 20, 'F');
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(51,51,51);
        const lines = doc.splitTextToSize(inv.descriptionPanne, W-28);
        doc.text(lines, 14, y+6);
      }
      doc.setFillColor(28,43,90); doc.rect(0, 287, W, 10, 'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      doc.text('SCRIM | Confidentiel', 14, 293);
      doc.text('Genere le ' + new Date().toLocaleDateString('fr-FR'), W/2, 293, { align: 'center' });
      doc.save('Rapport_' + (inv.equipement?.nom || 'Equipement') + '_' + inv.dateIntervention + '.pdf');
    });
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'CORRECTIF': return 'type-correctif';
      case 'PREVENTIF': return 'type-preventif';
      case 'MISE_A_JOUR': return 'type-maj';
      default: return '';
    }
  }
}