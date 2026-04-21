import { Component, OnInit } from '@angular/core';
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
import { InterventionService } from '../../services/intervention';
import { EquipementService } from '../../services/equipement';

@Component({
  selector: 'app-intervention-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './intervention-form.html',
  styleUrl: './intervention-form.scss'
})
export class InterventionForm implements OnInit {
  isEditMode = false;
  interventionId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  equipements: any[] = [];

  form = {
    date: '',
    type: '',
    description: '',
    technicien: '',
    statut: '',
    duree: null as number | null,
    observations: '',
    equipementId: null as number | null
  };

  types = ['Préventive', 'Corrective', 'Prédictive'];
  statuts = ['Planifiée', 'En cours', 'Terminée'];

  constructor(
    private interventionService: InterventionService,
    private equipementService: EquipementService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.equipementService.getAll().subscribe({
      next: (data) => this.equipements = data,
      error: (err) => console.error(err)
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.interventionId = +id;
      this.isLoading = true;
      this.interventionService.getById(+id).subscribe({
        next: (data) => {
          this.form = {
            date: data.date?.substring(0, 10) || '',
            type: data.type || '',
            description: data.description || '',
            technicien: data.technicien || '',
            statut: data.statut || '',
            duree: data.duree || null,
            observations: data.observations || '',
            equipementId: data.equipement?.id || null
          };
          this.isLoading = false;
        },
        error: () => { this.errorMessage = 'Erreur chargement.'; this.isLoading = false; }
      });
    }
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';
    const payload = { ...this.form, equipement: this.form.equipementId ? { id: this.form.equipementId } : null };
    const req$ = this.isEditMode && this.interventionId
      ? this.interventionService.update(this.interventionId, payload)
      : this.interventionService.create(payload);
    req$.subscribe({
      next: (data) => { this.isSaving = false; this.router.navigate(['/interventions', data.id || this.interventionId]); },
      error: () => { this.errorMessage = 'Erreur sauvegarde.'; this.isSaving = false; }
    });
  }

  cancel(): void {
    this.isEditMode && this.interventionId
      ? this.router.navigate(['/interventions', this.interventionId])
      : this.router.navigate(['/interventions']);
  }
}