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
import { PieceService } from '../../services/piece';

@Component({
  selector: 'app-piece-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule,
    MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './piece-list.html',
  styleUrl: './piece-list.scss'
})
export class PieceList implements OnInit {
  pieces: any[] = [];
  filtered: any[] = [];
  search = '';
  isLoading = true;
  hasError = false;
  displayedColumns = ['id', 'nom', 'reference', 'quantiteStock', 'prixUnitaire', 'actions'];

  constructor(
    private pieceService: PieceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.pieceService.getAll().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.pieces = data;
        this.filtered = [...data];
        this.cdr.detectChanges();
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.pieces.filter(p =>
      p.nom?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q)
    );
  }

  goToDetail(id: number): void { this.router.navigate(['/pieces', id]); }
  goToEdit(id: number, e: Event): void { e.stopPropagation(); this.router.navigate(['/pieces', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/pieces/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  delete(id: number, e: Event): void {
    e.stopPropagation();
    if (confirm('Supprimer cette pièce ?')) {
      this.pieceService.delete(id).subscribe({ next: () => this.load() });
    }
  }

  getStockClass(qty: number): string {
    if (qty <= 2) return 'stock-faible';
    if (qty <= 5) return 'stock-moyen';
    return 'stock-ok';
  }
}