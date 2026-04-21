import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contrat-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule,
    MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './contrat-list.html',
  styleUrl: './contrat-list.scss'
})
export class ContratList implements OnInit {
  contrats: any[] = [];
  filtered: any[] = [];
  search = '';
  isLoading = true;
  hasError = false;
  displayedColumns = ['id', 'reference', 'type', 'dateDebut', 'dateFin', 'montant', 'statut', 'actions'];

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/contrats`).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.contrats = data;
        this.filtered = [...data];
        this.cdr.detectChanges();
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.contrats.filter(c =>
      c.reference?.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q) || c.statut?.toLowerCase().includes(q)
    );
  }

  goToDetail(id: number): void { this.router.navigate(['/contrats', id]); }
  goToEdit(id: number, e: Event): void { e.stopPropagation(); this.router.navigate(['/contrats', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/contrats/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  delete(id: number, e: Event): void {
    e.stopPropagation();
    if (confirm('Supprimer ce contrat ?')) {
      this.http.delete(`${environment.apiUrl}/contrats/${id}`).subscribe({ next: () => this.load() });
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