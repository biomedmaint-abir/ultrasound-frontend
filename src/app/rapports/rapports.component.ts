import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  statuts = ['EN_COURS', 'TERMINEE', 'EN_ATTENTE_PIECE'];
  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];

  stats = {
    total: 0,
    terminees: 0,
    enCours: 0,
    mttrMoyen: 0
  };

  displayedColumns = ['id', 'date', 'type', 'statut', 'equipement', 'technicien', 'duree', 'description'];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data;
        this.filtered = data;
        this.calculateStats();
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
  }

  applyFilter(): void {
    this.filtered = this.interventions.filter(i => {
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      const matchType = !this.filterType || i.type === this.filterType;
      return matchStatut && matchType;
    });
    this.calculateStats();
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterStatut = '';
    this.filterType = '';
    this.filtered = [...this.interventions];
    this.calculateStats();
    this.cdr.detectChanges();
  }

  exportCSV(): void {
    const headers = ['ID', 'Date', 'Type', 'Statut', 'Equipement', 'Technicien', 'Duree (h)', 'Description'];
    const rows = this.filtered.map(i => [
      i.id,
      i.dateIntervention || '',
      i.type || '',
      i.statut || '',
      i.equipement?.nom || '',
      i.technicien?.nom || '',
      i.dureeHeures || '',
      i.descriptionPanne || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapports_interventions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  imprimer(): void {
    window.print();
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'TERMINEE': return 'statut-termine';
      case 'EN_COURS': return 'statut-en-cours';
      case 'EN_ATTENTE_PIECE': return 'statut-attente';
      default: return '';
    }
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