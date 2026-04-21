import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PieceService } from '../../services/piece';

@Component({
  selector: 'app-piece-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './piece-detail.html',
  styleUrl: './piece-detail.scss'
})
export class PieceDetail implements OnInit {
  piece: any = null;
  isLoading = true;
  hasError = false;

  constructor(
    private pieceService: PieceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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

  goBack(): void { this.router.navigate(['/pieces']); }
  goToEdit(): void { this.router.navigate(['/pieces', this.piece.id, 'edit']); }
  delete(): void {
    if (confirm('Supprimer cette pièce ?')) {
      this.pieceService.delete(this.piece.id).subscribe({ next: () => this.router.navigate(['/pieces']) });
    }
  }
}