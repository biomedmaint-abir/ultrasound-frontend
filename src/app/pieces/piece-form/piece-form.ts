import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PieceService } from '../../services/piece';

@Component({
  selector: 'app-piece-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './piece-form.html',
  styleUrl: './piece-form.scss'
})
export class PieceForm implements OnInit {
  isEditMode = false;
  pieceId: number | null = null;
  isSaving = false;
  isLoading = false;
  errorMessage = '';

  form = { nom: '', reference: '', quantiteStock: null as number | null, prixUnitaire: null as number | null };

  constructor(private pieceService: PieceService, private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true; this.pieceId = +id; this.isLoading = true;
      this.pieceService.getById(+id).subscribe({
        next: (data) => { this.form = { nom: data.nom, reference: data.reference, quantiteStock: data.quantiteStock, prixUnitaire: data.prixUnitaire }; this.isLoading = false; this.cdr.detectChanges(); },
        error: () => { this.isLoading = false; }
      });
    }
  }

  save(): void {
    this.isSaving = true;
    const req$ = this.isEditMode && this.pieceId ? this.pieceService.update(this.pieceId, this.form) : this.pieceService.create(this.form);
    req$.subscribe({
      next: (data) => { this.isSaving = false; this.router.navigate(['/pieces', data.id || this.pieceId]); },
      error: () => { this.errorMessage = 'Erreur sauvegarde.'; this.isSaving = false; }
    });
  }

  cancel(): void { this.router.navigate(['/pieces']); }
}