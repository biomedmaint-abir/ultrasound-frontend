import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { PieceService } from '../../services/piece';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-piece-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './piece-form.html',
  styleUrl: './piece-form.scss'
})
export class PieceForm implements OnInit {
  isEditMode = false;
  pieceId: number | null = null;
  isSaving = false;
  isLoading = false;
  errorMessage = '';
  parcs: string[] = [];

  form = {
    nom: '',
    reference: '',
    client: '',
    prixUnitaire: null as number | null
  };

  constructor(
    private pieceService: PieceService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Charger les parcs depuis les équipements
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => {
        this.parcs = [...new Set(data.map((e: any) => e.parc).filter((p: any) => p))];
        this.cdr.detectChanges();
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pieceId = +id;
      this.isLoading = true;
      this.pieceService.getById(+id).subscribe({
        next: (data) => {
          this.form = {
            nom: data.nom,
            reference: data.reference,
            client: data.client || '',
            prixUnitaire: data.prixUnitaire
          };
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.isLoading = false; }
      });
    }
  }

  save(): void {
    this.isSaving = true;
    const req$ = this.isEditMode && this.pieceId
      ? this.pieceService.update(this.pieceId, this.form)
      : this.pieceService.create(this.form);
    req$.subscribe({
      next: (data) => { this.isSaving = false; this.router.navigate(['/pieces', data.id || this.pieceId]); },
      error: () => { this.errorMessage = 'Erreur sauvegarde.'; this.isSaving = false; }
    });
  }

  cancel(): void { this.router.navigate(['/pieces']); }
}