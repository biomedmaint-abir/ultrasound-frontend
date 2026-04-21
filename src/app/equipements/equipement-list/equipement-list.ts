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
import { EquipementService } from '../../services/equipement';

@Component({
  selector: 'app-equipement-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule,
    MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './equipement-list.html',
  styleUrl: './equipement-list.scss'
})
export class EquipementList implements OnInit {
  equipements: any[] = [];
  filtered: any[] = [];
  search = '';
  isLoading = true;
  hasError = false;
  displayedColumns = ['id', 'nom', 'numeroSerie', 'localisation', 'dateInstallation', 'statut', 'actions'];

  constructor(
    private equipementService: EquipementService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.equipementService.getAll().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.equipements = data.map((e: any) => ({
          id: e.id,
          nom: e.nom,
          numeroSerie: e.numeroSerie,
          localisation: e.localisation,
          dateInstallation: e.dateInstallation,
          statut: e.statut,
          modele: e.modele,
          fournisseur: e.fournisseur
        }));
        this.filtered = [...this.equipements];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.equipements.filter(e =>
      (e.nom?.toLowerCase().includes(q)) ||
      (e.numeroSerie?.toLowerCase().includes(q)) ||
      (e.localisation?.toLowerCase().includes(q)) ||
      (e.statut?.toLowerCase().includes(q))
    );
  }

  goToDetail(id: number): void { this.router.navigate(['/equipements', id]); }
  goToEdit(id: number, ev: Event): void { ev.stopPropagation(); this.router.navigate(['/equipements', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/equipements/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  delete(id: number, ev: Event): void {
    ev.stopPropagation();
    if (confirm('Supprimer cet équipement ?')) {
      this.equipementService.delete(id).subscribe({ next: () => this.load() });
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_SERVICE': return 'statut-termine';
      case 'EN_MAINTENANCE': return 'statut-en-cours';
      case 'EN_PANNE': return 'statut-planifie';
      case 'HORS_SERVICE': return 'statut-default';
      default: return 'statut-default';
    }
  }
}