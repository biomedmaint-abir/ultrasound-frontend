import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historique.component.html',
  styleUrl: './historique.component.scss'
})
export class HistoriqueComponent implements OnInit {
  interventions: any[] = [];
  filtered: any[] = [];
  isLoading = true;
  searchText = '';
  filterType = '';
  filterStatut = '';

  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];
  statuts = ['TERMINEE', 'EN_COURS', 'EN_ATTENTE_PIECE'];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data.sort((a, b) =>
          new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime()
        );
        this.filtered = [...this.interventions];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    this.filtered = this.interventions.filter(i => {
      const matchSearch = !this.searchText ||
        i.descriptionPanne?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        i.equipement?.nom?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchType = !this.filterType || i.type === this.filterType;
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      return matchSearch && matchType && matchStatut;
    });
    this.cdr.detectChanges();
  }

  reset(): void {
    this.searchText = '';
    this.filterType = '';
    this.filterStatut = '';
    this.filtered = [...this.interventions];
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

  getTypeIcon(type: string): string {
    switch (type) {
      case 'CORRECTIF': return '🔧';
      case 'PREVENTIF': return '🛡️';
      case 'MISE_A_JOUR': return '🔄';
      default: return '📋';
    }
  }
}