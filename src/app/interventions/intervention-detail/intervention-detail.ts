import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InterventionService } from '../../services/intervention';

@Component({
  selector: 'app-intervention-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './intervention-detail.html',
  styleUrl: './intervention-detail.scss'
})
export class InterventionDetail implements OnInit {
  intervention: any = null;
  isLoading = true;
  hasError = false;

  constructor(
    private interventionService: InterventionService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.isLoading = true;
    this.interventionService.getById(id).subscribe({
      next: (data) => {
        this.intervention = {
          id: data.id,
          date: data.dateIntervention,
          type: data.type,
          technicien: data.technicien?.nom || data.technicien?.prenom || '—',
          statut: data.statut,
          description: data.descriptionPanne,
          observations: data.actionsEffectuees,
          duree: data.dureeHeures,
          equipement: data.equipement
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void { this.router.navigate(['/interventions']); }
  goToEdit(): void { this.router.navigate(['/interventions', this.intervention.id, 'edit']); }

  delete(): void {
    if (confirm('Supprimer cette intervention ?')) {
      this.interventionService.delete(this.intervention.id).subscribe({
        next: () => this.router.navigate(['/interventions'])
      });
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'TERMINEE': return 'statut-termine';
      case 'EN_COURS': return 'statut-en-cours';
      case 'EN_ATTENTE_PIECE': return 'statut-planifie';
      default: return 'statut-default';
    }
  }
}