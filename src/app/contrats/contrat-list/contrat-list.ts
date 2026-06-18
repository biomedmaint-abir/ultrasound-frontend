import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contrat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './contrat-list.html',
  styleUrl: './contrat-list.scss'
})
export class ContratList implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer le contrat';
  confirmMessage = 'Cette action est irréversible. Le contrat sera définitivement supprimé.';

  contrats: any[] = [];
  filtered: any[] = [];
  pagedData: any[] = [];
  total = 0;

  search = '';
  filterStatut = '';
  filterType = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  isLoading = true;
  hasError = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/contrats`).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.contrats = data;
        this.total = data.length;
        this.filtered = [...data];
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.contrats.filter(c => {
      const matchSearch = !q || c.reference?.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q);
      const matchStatut = !this.filterStatut || c.statut === this.filterStatut;
      const matchType = !this.filterType || c.type === this.filterType;
      return matchSearch && matchStatut && matchType;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filtered.length / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.filtered.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  onPageSizeChange(): void { this.currentPage = 1; this.updatePagination(); }
  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); } }
  min(a: number, b: number): number { return Math.min(a, b); }

  isExpire(dateFin: string): boolean {
    if (!dateFin) return false;
    return new Date(dateFin) < new Date();
  }

  expireBientot(dateFin: string): boolean {
    if (!dateFin) return false;
    const fin = new Date(dateFin);
    const now = new Date();
    const diff = (fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'statut-actif';
      case 'EXPIRE': return 'statut-expire';
      case 'RESILIE': return 'statut-resilie';
      default: return 'statut-default';
    }
  }

  delete(id: number, e: Event): void { e.stopPropagation(); this.pendingDeleteId = id; this.showConfirm = true; }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.http.delete(`${environment.apiUrl}/contrats/${this.pendingDeleteId}`).subscribe({
        next: () => { this.showConfirm = false; this.pendingDeleteId = null; this.load(); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }
  goToDetail(id: number): void { this.router.navigate(['/contrats', id]); }
  goToEdit(id: number, e: Event): void { e.stopPropagation(); this.router.navigate(['/contrats', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/contrats/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }
}