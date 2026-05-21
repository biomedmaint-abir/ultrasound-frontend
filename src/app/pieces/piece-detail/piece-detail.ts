import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PieceService } from '../../services/piece';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-piece-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, ConfirmDialogComponent],
  templateUrl: './piece-detail.html',
  styleUrl: './piece-detail.scss'
})
export class PieceDetail implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer la piece';
  confirmMessage = 'Cette action est irreversible. La piece sera definitivement supprimee.';
  piece: any = null;
  isLoading = true;
  hasError = false;

  constructor(private pieceService: PieceService, private route: ActivatedRoute,
    private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.pieceService.getById(id).subscribe({
      next: (data) => { this.piece = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  delete(): void { this.pendingDeleteId = this.piece.id; this.showConfirm = true; }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.pieceService.delete(this.pendingDeleteId).subscribe({
        next: () => { this.showConfirm = false; this.router.navigate(['/pieces']); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }
  goBack(): void { this.router.navigate(['/pieces']); }
  goToEdit(): void { this.router.navigate(['/pieces', this.piece.id, 'edit']); }
}
