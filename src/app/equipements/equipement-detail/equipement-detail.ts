import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipementService } from '../../services/equipement';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-equipement-detail',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent],
  templateUrl: './equipement-detail.html',
  styleUrl: './equipement-detail.scss'
})
export class EquipementDetail implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer cet equipement';
  confirmMessage = 'Cette action est irreversible. L\'equipement sera definitivement supprime.';

  equipement: any = null;
  isLoading = true;
  hasError = false;

  constructor(private equipementService: EquipementService, private route: ActivatedRoute,
    private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.isLoading = true;
    this.equipementService.getById(id).subscribe({
      next: (data) => { this.equipement = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  delete(): void {
    this.pendingDeleteId = this.equipement.id;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.equipementService.delete(this.pendingDeleteId).subscribe({
        next: () => { this.showConfirm = false; this.router.navigate(['/equipements']); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }

  goBack(): void { this.router.navigate(['/equipements']); }
  goToEdit(): void { this.router.navigate(['/equipements', this.equipement.id, 'edit']); }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_SERVICE': return 'statut-service';
      case 'EN_MAINTENANCE': return 'statut-maintenance';
      case 'EN_PANNE': return 'statut-hors';
      default: return 'statut-default';
    }
  }
}
