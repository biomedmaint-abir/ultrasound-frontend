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
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contrat-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './contrat-form.html',
  styleUrl: './contrat-form.scss'
})
export class ContratForm implements OnInit {
  isEditMode = false;
  contratId: number | null = null;
  isSaving = false;
  isLoading = false;
  errorMessage = '';

  form = { reference: '', type: '', statut: '', dateDebut: '', dateFin: '', montant: null as number | null };
  types = ['TOTAL', 'PREVENTIF', 'CORRECTIF'];
  statuts = ['ACTIF', 'EXPIRE', 'RESILIER'];

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