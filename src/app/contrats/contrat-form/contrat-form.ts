import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contrat-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contrat-form.html',
  styleUrl: './contrat-form.scss'
})
export class ContratForm implements OnInit {
  isEditMode = false;
  contratId: number | null = null;
  isSaving = false;
  isLoading = false;
  errorMessage = '';
  submitted = false;

  form = { reference: '', type: '', statut: '', dateDebut: '', dateFin: '', montant: null as number | null };
  types = ['TOTAL', 'PREVENTIF', 'CORRECTIF'];
  statuts = ['ACTIF', 'EXPIRE', 'RESILIER'];

  get isFormValid(): boolean {
    return !!(this.form.reference && this.form.type && this.form.statut && this.form.dateDebut && this.form.dateFin && this.form.montant);
  }

  isInvalid(field: any): boolean { return this.submitted && !field; }

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true; this.contratId = +id; this.isLoading = true;
      this.http.get<any>(`${environment.apiUrl}/contrats/${id}`).subscribe({
        next: (data) => {
          this.form = { reference: data.reference, type: data.type, statut: data.statut, dateDebut: data.dateDebut?.substring(0,10) || '', dateFin: data.dateFin?.substring(0,10) || '', montant: data.montant };
          this.isLoading = false; this.cdr.detectChanges();
        },
        error: () => { this.isLoading = false; }
      });
    }
  }

  save(): void {
    this.submitted = true;
    if (!this.isFormValid) return;
    this.isSaving = true;
    const req$ = this.isEditMode && this.contratId
      ? this.http.put<any>(`${environment.apiUrl}/contrats/${this.contratId}`, this.form)
      : this.http.post<any>(`${environment.apiUrl}/contrats`, this.form);
    req$.subscribe({
      next: (data) => { this.isSaving = false; this.router.navigate(['/contrats', data.id || this.contratId]); },
      error: () => { this.errorMessage = 'Erreur sauvegarde.'; this.isSaving = false; }
    });
  }

  cancel(): void { this.router.navigate(['/contrats']); }
}
