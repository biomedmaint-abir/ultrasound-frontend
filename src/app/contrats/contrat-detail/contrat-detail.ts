import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, ConfirmDialogComponent],
  templateUrl: './contrat-detail.html',
  styleUrl: './contrat-detail.scss'
})
export class ContratDetail implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer le contrat';
  confirmMessage = 'Cette action est irreversible. Le contrat sera definitivement supprime.';
  contrat: any = null;
  isLoading = true;
  hasError = false;

  constructor(private http: HttpClient, private route: ActivatedRoute,
    private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.http.get(`${environment.apiUrl}/contrats/${id}`).subscribe({
      next: (data) => { this.contrat = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  delete(): void { this.pendingDeleteId = this.contrat.id; this.showConfirm = true; }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.http.delete(`${environment.apiUrl}/contrats/${this.pendingDeleteId}`).subscribe({
        next: () => { this.showConfirm = false; this.router.navigate(['/contrats']); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }
  goBack(): void { this.router.navigate(['/contrats']); }
  goToEdit(): void { this.router.navigate(['/contrats', this.contrat.id, 'edit']); }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'statut-termine';
      case 'EXPIRE': return 'statut-default';
      case 'RESILIER': return 'statut-planifie';
      default: return 'statut-default';
    }
  }
}
