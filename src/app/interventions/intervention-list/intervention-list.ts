import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InterventionService } from '../../services/intervention';

@Component({
  selector: 'app-intervention-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule,
    MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './intervention-list.html',
  styleUrl: './intervention-list.scss'
})
export class InterventionList implements OnInit {
  interventions: any[] = [];
  filtered: any[] = [];
  search = '';
  isLoading = true;
  hasError = false;
  displayedColumns = ['id', 'date', 'type', 'equipement', 'FSE', 'statut', 'actions'];

  constructor(
    private interventionService: InterventionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.interventionService.getAll().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.interventions = data.map((i: any) => ({
          id: i.id,
          date: i.dateIntervention,
          type: i.type,
          technicien: i.technicien?.nom || i.technicien?.prenom || '-',
          statut: i.statut,
          description: i.descriptionPanne,
          observations: i.actionsEffectuees,
          duree: i.dureeHeures,
          equipement: i.equipement
        }));
        this.filtered = [...this.interventions];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('ERREUR', err.status);
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.interventions.filter(i =>
      (i.type?.toLowerCase().includes(q)) ||
      (i.technicien?.toLowerCase().includes(q)) ||
      (i.statut?.toLowerCase().includes(q)) ||
      (i.equipement?.nom?.toLowerCase().includes(q))
    );
  }

  goToDetail(id: number): void { this.router.navigate(['/interventions', id]); }
  goToEdit(id: number, e: Event): void { e.stopPropagation(); this.router.navigate(['/interventions', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/interventions/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  delete(id: number, e: Event): void {
    e.stopPropagation();
    if (confirm('Supprimer cette intervention ?')) {
      this.interventionService.delete(id).subscribe({ next: () => this.load() });
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'TERMINEE': return 'statut-termine';
      case 'EN_COURS': return 'statut-en-cours';
      case 'EN_ATTENTE_PIECE': return 'statut-planifie';
      default: return 'statut-default';
    }
  }
}