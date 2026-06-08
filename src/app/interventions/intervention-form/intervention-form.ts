import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InterventionService } from '../../services/intervention';
import { EquipementService } from '../../services/equipement';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-intervention-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intervention-form.html',
  styleUrl: './intervention-form.scss'
})
export class InterventionForm implements OnInit {
  isEditMode = false;
  interventionId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  submitted = false;
  equipements: any[] = [];
  piecesDisponibles: any[] = [];
  fseList: any[] = [];

  form = {
    date: '', type: '', description: '', fse: '', fseId: null as number | null,
    statut: '', duree: null as number | null, coutTotal: null as number | null,
    observations: '', equipementId: null as number | null
  };

  piecesUtilisees: { pieceId: number | null, quantite: number, nom: string }[] = [];
  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];
  statuts = ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'EN_ATTENTE_PIECE'];

  get isFormValid(): boolean {
    return !!(this.form.date && this.form.type && this.form.equipementId && this.form.statut);
  }

  isInvalid(field: any): boolean { return this.submitted && !field; }
  updateResume(): void {}

  getEquipementNom(): string {
    const e = this.equipements.find(eq => eq.id === this.form.equipementId);
    return e ? `${e.nom} — ${e.parc}` : '—';
  }

  getPieceRef(pieceId: number | null): string {
    const p = this.piecesDisponibles.find(pd => pd.id === pieceId);
    return p?.reference || '—';
  }

  getPiecePrix(pieceId: number | null): number {
    const p = this.piecesDisponibles.find(pd => pd.id === pieceId);
    return p?.prixUnitaire || 0;
  }

  onFseChange(): void {
    const fse = this.fseList.find(f => f.id === this.form.fseId);
    if (fse) this.form.fse = fse.prenom || fse.nom || fse.email;
  }

  constructor(
    private interventionService: InterventionService,
    private equipementService: EquipementService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.equipementService.getAll().subscribe({ next: (data) => this.equipements = data });
    this.http.get<any[]>(`${environment.apiUrl}/pieces`).subscribe({ next: (data) => this.piecesDisponibles = data, error: () => {} });
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({
      next: (data) => {
        this.fseList = data.filter(u => u.role?.nom === 'TECHNICIEN' || u.role?.nom === 'INGENIEUR');
      },
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
            type: data.type || '', description: data.descriptionPanne || '',
            fse: data.nomFse || '', fseId: data.technicien?.id || null,
            statut: data.statut || '', duree: data.dureeHeures || null,
            coutTotal: data.coutTotal || null, observations: data.actionsEffectuees || '',
            equipementId: data.equipement?.id || null
          };
          this.isLoading = false;
        },
        error: () => { this.errorMessage = 'Erreur chargement.'; this.isLoading = false; }
      });
    }
  }

  ajouterPiece(): void { this.piecesUtilisees.push({ pieceId: null, quantite: 1, nom: '' }); }
  supprimerPiece(index: number): void { this.piecesUtilisees.splice(index, 1); }
  onPieceChange(index: number): void {
    const piece = this.piecesDisponibles.find(p => p.id === this.piecesUtilisees[index].pieceId);
    if (piece) this.piecesUtilisees[index].nom = piece.nom;
  }

  save(): void {
    this.submitted = true;
    if (!this.isFormValid) return;
    this.isSaving = true;
    this.errorMessage = '';
    const payload: any = {
      dateIntervention: this.form.date, type: this.form.type,
      descriptionPanne: this.form.description, statut: this.form.statut,
      dureeHeures: this.form.duree, coutTotal: this.form.coutTotal,
      nomFse: this.form.fse, actionsEffectuees: this.form.observations,
      equipement: this.form.equipementId ? { id: this.form.equipementId } : null
    };
    if (this.form.fseId) payload.technicien = { id: this.form.fseId };

    const req$ = this.isEditMode && this.interventionId
      ? this.interventionService.update(this.interventionId, payload)
      : this.interventionService.create(payload);
    req$.subscribe({
      next: (data) => {
        const interventionId = data.id || this.interventionId;
        const piecesValides = this.piecesUtilisees.filter(p => p.pieceId && p.quantite > 0);
        if (piecesValides.length > 0) {
          const piecesPayload = piecesValides.map(p => ({
            intervention: { id: interventionId }, piece: { id: p.pieceId },
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