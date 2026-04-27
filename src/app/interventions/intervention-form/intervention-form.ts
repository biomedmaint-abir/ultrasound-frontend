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
import { HttpClient } from '@angular/common/http';
import { InterventionService } from '../../services/intervention';
import { EquipementService } from '../../services/equipement';
import { environment } from '../../../environments/environment';

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
  piecesDisponibles: any[] = [];

  form = {
    date: '',
    type: '',
    description: '',
    fse: '',
    statut: '',
    duree: null as number | null,
    observations: '',
    equipementId: null as number | null
  };

  piecesUtilisees: { pieceId: number | null, quantite: number, nom: string }[] = [];

  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];
  statuts = ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'EN_ATTENTE_PIECE'];

  constructor(
    private interventionService: InterventionService,
    private equipementService: EquipementService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.equipementService.getAll().subscribe({
      next: (data) => this.equipements = data,
      error: (err) => console.error(err)
    });

    this.http.get<any[]>(`${environment.apiUrl}/pieces`).subscribe({
      next: (data) => this.piecesDisponibles = data,
      error: () => {}
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.interventionId = +id;
      this.isLoading = true;
      this.interventionService.getById(+id).subscribe({
        next: (data) => {
          this.form = {
            date: data.dateIntervention?.substring(0, 10) || '',
            type: data.type || '',
            description: data.descriptionPanne || '',
            fse: data.technicien?.nom || '',
            statut: data.statut || '',
            duree: data.dureeHeures || null,
            observations: data.actionsEffectuees || '',
            equipementId: data.equipement?.id || null
          };
          this.isLoading = false;
        },
        error: () => { this.errorMessage = 'Erreur chargement.'; this.isLoading = false; }
      });
    }
  }

  ajouterPiece(): void {
    this.piecesUtilisees.push({ pieceId: null, quantite: 1, nom: '' });
  }

  supprimerPiece(index: number): void {
    this.piecesUtilisees.splice(index, 1);
  }

  onPieceChange(index: number): void {
    const pieceId = this.piecesUtilisees[index].pieceId;
    const piece = this.piecesDisponibles.find(p => p.id === pieceId);
    if (piece) this.piecesUtilisees[index].nom = piece.nom;
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';
    const payload = {
      dateIntervention: this.form.date,
      type: this.form.type,
      descriptionPanne: this.form.description,
      statut: this.form.statut,
      dureeHeures: this.form.duree,
      actionsEffectuees: this.form.observations,
      equipement: this.form.equipementId ? { id: this.form.equipementId } : null
    };

    const req$ = this.isEditMode && this.interventionId
      ? this.interventionService.update(this.interventionId, payload)
      : this.interventionService.create(payload);

    req$.subscribe({
      next: (data) => {
        const interventionId = data.id || this.interventionId;
        // Sauvegarder les pièces utilisées
        const piecesValides = this.piecesUtilisees.filter(p => p.pieceId && p.quantite > 0);
        if (piecesValides.length > 0) {
          const piecesPayload = piecesValides.map(p => ({
            intervention: { id: interventionId },
            piece: { id: p.pieceId },
            quantite: p.quantite,
            coutUnitaire: this.piecesDisponibles.find(pd => pd.id === p.pieceId)?.prixUnitaire || 0
          }));
          this.http.post(`${environment.apiUrl}/intervention-pieces/bulk`, piecesPayload).subscribe({
            next: () => { this.isSaving = false; this.router.navigate(['/interventions', interventionId]); },
            error: () => { this.isSaving = false; this.router.navigate(['/interventions', interventionId]); }
          });
        } else {
          this.isSaving = false;
          this.router.navigate(['/interventions', interventionId]);
        }
      },
      error: () => { this.errorMessage = 'Erreur sauvegarde.'; this.isSaving = false; }
    });
  }

  cancel(): void {
    this.isEditMode && this.interventionId
      ? this.router.navigate(['/interventions', this.interventionId])
      : this.router.navigate(['/interventions']);
  }
}