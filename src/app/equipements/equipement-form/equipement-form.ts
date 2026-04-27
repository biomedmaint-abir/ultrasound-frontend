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
import { EquipementService } from '../../services/equipement';

@Component({
  selector: 'app-equipement-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './equipement-form.html',
  styleUrl: './equipement-form.scss'
})
export class EquipementForm implements OnInit {
  isEditMode = false;
  equipementId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  form = {
    nom: '',
    numeroSerie: '',
    numInventaire: '',
    service: '',
    parc: '',
    dateInstallation: '',
    statut: ''
  };

  statuts = ['EN_SERVICE', 'EN_MAINTENANCE', 'EN_PANNE', 'HORS_SERVICE'];

  constructor(
    private equipementService: EquipementService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.equipementId = +id;
      this.isLoading = true;
      this.equipementService.getById(+id).subscribe({
        next: (data) => {
          this.form = {
            nom: data.nom || '',
            numeroSerie: data.numeroSerie || '',
            numInventaire: data.numInventaire || '',
            service: data.service || '',
            parc: data.parc || '',
            dateInstallation: data.dateInstallation?.substring(0, 10) || '',
            statut: data.statut || ''
          };
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.errorMessage = 'Erreur chargement.'; this.isLoading = false; }
      });
    }
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';
    const req$ = this.isEditMode && this.equipementId
      ? this.equipementService.update(this.equipementId, this.form)
      : this.equipementService.create(this.form);
    req$.subscribe({
      next: (data) => {
        this.isSaving = false;
        this.router.navigate(['/equipements', data.id || this.equipementId]);
      },
      error: () => { this.errorMessage = 'Erreur sauvegarde.'; this.isSaving = false; }
    });
  }

  cancel(): void {
    this.isEditMode && this.equipementId
      ? this.router.navigate(['/equipements', this.equipementId])
      : this.router.navigate(['/equipements']);
  }
}