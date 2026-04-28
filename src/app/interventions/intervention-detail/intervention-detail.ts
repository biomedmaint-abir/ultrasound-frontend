import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { InterventionService } from '../../services/intervention';
import { environment } from '../../../environments/environment';

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
  pieces: any[] = [];
  isLoading = true;
  hasError = false;

  constructor(
    private interventionService: InterventionService,
    private http: HttpClient,
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
        this.intervention = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        this.loadPieces(id);
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPieces(interventionId: number): void {
    this.http.get<any[]>(`${environment.apiUrl}/intervention-pieces`).subscribe({
      next: (data) => {
        this.pieces = data.filter(p => p.intervention?.id === interventionId);
        this.cdr.detectChanges();
      },
      error: () => {}
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