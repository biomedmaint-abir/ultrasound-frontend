import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PieceService } from '../../services/piece';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-piece-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piece-form.html',
  styleUrl: './piece-form.scss'
})
export class PieceForm implements OnInit {
  isEditMode = false;
  pieceId: number | null = null;
  isSaving = false;
  submitted = false;
  isLoading = false;
  errorMessage = '';
  parcs: string[] = [];

  form: any = {
    nom: '',
    reference: '',
    client: '',
    prixUnitaire: null,
    statut: 'EN_STOCK',
    clientEchange: '',
    dateEchange: '',
    retourFournisseur: false,
    dateRetourPrevu: '',
    notesSuivi: ''
  };

  constructor(
    private pieceService: PieceService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
            nom: data.nom || '',
            reference: data.reference || '',
            client: data.client || '',
            prixUnitaire: data.prixUnitaire || null,
            statut: data.statut || 'EN_STOCK',
            clientEchange: data.clientEchange || '',
            dateEchange: data.dateEchange || '',
            retourFournisseur: data.retourFournisseur || false,
            dateRetourPrevu: data.dateRetourPrevu || '',
            notesSuivi: data.notesSuivi || ''
          };
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.isLoading = false; }
      });
    }
  }

  get isFormValid(): boolean { return !!(this.form.nom && this.form.reference); }
  isInvalid(field: any): boolean { return this.submitted && !field; }

  save(): void {
    this.submitted = true;
    if (!this.isFormValid) return;
    this.isSaving = true;
    const payload = {
      ...this.form,
      dateEchange: this.form.dateEchange || null,
      dateRetourPrevu: this.form.dateRetourPrevu || null,
    };
    const req$ = this.isEditMode && this.pieceId
      ? this.pieceService.update(this.pieceId, payload)
      : this.pieceService.create(payload);
    req$.subscribe({
      next: (data) => {
        this.isSaving = false;
        this.router.navigate(['/pieces', data.id || this.pieceId]);
      },
      error: () => { this.errorMessage = 'Erreur sauvegarde.'; this.isSaving = false; }
    });
  }

  cancel(): void { this.router.navigate(['/pieces']); }
}
