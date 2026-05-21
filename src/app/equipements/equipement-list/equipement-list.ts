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
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-equipement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatTooltipModule, MatProgressSpinnerModule, ConfirmDialogComponent],
  templateUrl: './equipement-list.html',
  styleUrl: './equipement-list.scss'
})
export class EquipementList implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer cet equipement';
  confirmMessage = 'Cette action est irreversible. L\'equipement sera definitivement supprime.';

  equipements: any[] = [];
  filtered: any[] = [];
  search = '';
  isLoading = true;
  hasError = false;
  displayedColumns = ['id', 'nom', 'numeroSerie', 'numInventaire', 'service', 'parc', 'dateInstallation', 'statut', 'actions'];

  constructor(private equipementService: EquipementService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.equipementService.getAll().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.equipements = data.map((e: any) => ({
          id: e.id, nom: e.nom, numeroSerie: e.numeroSerie, numInventaire: e.numInventaire,
          service: e.service, parc: e.parc, dateInstallation: e.dateInstallation, statut: e.statut
        }));
        this.filtered = [...this.equipements];
        this.cdr.detectChanges();
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.equipements.filter(e =>
      (e.nom?.toLowerCase().includes(q)) || (e.numeroSerie?.toLowerCase().includes(q)) ||
      (e.service?.toLowerCase().includes(q)) || (e.parc?.toLowerCase().includes(q)) ||
      (e.statut?.toLowerCase().includes(q))
    );
  }

  delete(id: number, ev: Event): void {
    ev.stopPropagation();
    this.pendingDeleteId = id;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.equipementService.delete(this.pendingDeleteId).subscribe({
        next: () => { this.showConfirm = false; this.pendingDeleteId = null; this.load(); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }

  goToDetail(id: number): void { this.router.navigate(['/equipements', id]); }
  goToEdit(id: number, ev: Event): void { ev.stopPropagation(); this.router.navigate(['/equipements', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/equipements/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_SERVICE': return 'statut-termine';
      case 'EN_MAINTENANCE': return 'statut-en-cours';
      case 'EN_PANNE': return 'statut-planifie';
      default: return 'statut-default';
    }
  }
}
