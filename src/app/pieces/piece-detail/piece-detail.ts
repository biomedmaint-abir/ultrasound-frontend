import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PieceService } from '../../services/piece';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-piece-detail',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent],
  templateUrl: './piece-detail.html',
  styleUrl: './piece-detail.scss'
})
export class PieceDetail implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer la pièce';
  confirmMessage = 'Cette action est irréversible. La pièce sera définitivement supprimée.';
  piece: any = null;
  isLoading = true;
  hasError = false;
  interventionLiee: any = null;

  constructor(
    private pieceService: PieceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.pieceService.getById(id).subscribe({
      next: (data) => {
        this.piece = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        if (data.statut === 'EN_ATTENTE_RETOUR' || data.statut === 'RETOURNEE' || data.statut === 'DEFECTUEUSE') {
          this.http.get<any[]>(`${environment.apiUrl}/intervention-pieces`).subscribe({
            next: (ips) => {
              const ip = ips.find((p: any) => p.piece?.id === data.id);
              if (ip?.intervention?.id) {
                this.http.get<any>(`${environment.apiUrl}/interventions/${ip.intervention.id}`).subscribe({
                  next: (inv) => { this.interventionLiee = inv; this.cdr.detectChanges(); }
                });
              }
            }
          });
        }
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  voirIntervention(): void {
    if (this.interventionLiee) {
      this.router.navigate(['/interventions', this.interventionLiee.id]);
    }
  }

  getStatutClass(statut: string): string {
    switch(statut) {
      case 'EN_STOCK': return 'statut-ok';
      case 'DEFECTUEUSE': return 'statut-danger';
      case 'EN_ATTENTE_RETOUR': return 'statut-warning';
      case 'RETOURNEE': return 'statut-info';
      default: return 'statut-ok';
    }
  }

  getStatutLabel(statut: string): string {
    switch(statut) {
      case 'EN_STOCK': return 'En stock';
      case 'DEFECTUEUSE': return 'Défectueuse';
      case 'EN_ATTENTE_RETOUR': return 'Attente retour';
      case 'RETOURNEE': return 'Retournée';
      default: return 'En stock';
    }
  }

  delete(): void { this.pendingDeleteId = this.piece.id; this.showConfirm = true; }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.pieceService.delete(this.pendingDeleteId).subscribe({
        next: () => { this.showConfirm = false; const base = this.router.url.startsWith('/backoffice') ? '/backoffice/pieces' : '/pieces'; this.router.navigate([base]); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }
  goBack(): void { const base = this.router.url.startsWith('/backoffice') ? '/backoffice/pieces' : '/pieces'; this.router.navigate([base]); }
  goToEdit(): void { const base = this.router.url.startsWith('/backoffice') ? '/backoffice/pieces' : '/pieces'; this.router.navigate([base, this.piece.id, 'edit']); }
}
