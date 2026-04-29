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
  filterDateDebut = '';
  filterDateFin = '';
  parcsList: string[] = [];

  statuts = ['EN_COURS', 'TERMINEE', 'EN_ATTENTE_PIECE'];
  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];

  stats = { total: 0, terminees: 0, enCours: 0, mttrMoyen: 0, coutTotal: 0 };

  displayedColumns = ['id', 'date', 'type', 'statut', 'equipement', 'parc', 'technicien', 'duree', 'cout', 'description'];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public router: Router
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

  applyFilter(): void {
    this.filtered = this.interventions.filter(i => {
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      const matchType = !this.filterType || i.type === this.filterType;
      const matchParc = !this.filterParc || i.equipement?.parc === this.filterParc;
      const matchDateDebut = !this.filterDateDebut || (i.dateIntervention && i.dateIntervention >= this.filterDateDebut);
      const matchDateFin = !this.filterDateFin || (i.dateIntervention && i.dateIntervention <= this.filterDateFin);
      return matchStatut && matchType && matchParc && matchDateDebut && matchDateFin;
    });
    this.calculateStats();
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterStatut = ''; this.filterType = ''; this.filterParc = '';
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

  getTypeClass(type: string): string {
    switch (type) {
      case 'CORRECTIF': return 'type-correctif';
      case 'PREVENTIF': return 'type-preventif';
      case 'MISE_A_JOUR': return 'type-maj';
      default: return '';
    }
  }
}