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

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './contrat-detail.html',
  styleUrl: './contrat-detail.scss'
})
export class ContratDetail implements OnInit {
  contrat: any = null;
  isLoading = true;
  hasError = false;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

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

  goBack(): void { this.router.navigate(['/contrats']); }
  goToEdit(): void { this.router.navigate(['/contrats', this.contrat.id, 'edit']); }

  delete(): void {
    if (confirm('Supprimer ce contrat ?')) {
      this.http.delete(`${environment.apiUrl}/contrats/${this.contrat.id}`).subscribe({
        next: () => this.router.navigate(['/contrats'])
      });
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'statut-termine';
      case 'EXPIRE': return 'statut-default';
      case 'RESILIER': return 'statut-planifie';
      default: return 'statut-default';
    }
  }
}