import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InterventionService } from '../../services/intervention';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-intervention-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './intervention-list.html',
  styleUrl: './intervention-list.scss'
})
export class InterventionList implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer l\'intervention';
  confirmMessage = 'Cette action est irréversible. L\'intervention sera définitivement supprimée.';

  interventions: any[] = [];
  filtered: any[] = [];
  pagedData: any[] = [];
  equipements: string[] = [];

  search = '';
  filterType = '';
  filterStatut = '';
  filterEquipement = '';
  filterFse = '';
  fseList: string[] = [];
  dateFrom = '';
  dateTo = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  isLoading = true;
  hasError = false;

  constructor(
    private interventionService: InterventionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.load();
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({
      next: (users) => {
        this.fseList = users
          .filter(u => u.role?.nom === 'TECHNICIEN' || u.role?.nom === 'INGENIEUR')
          .map(u => u.prenom || u.nom);
      }
    });
  }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.interventionService.getAll().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.interventions = data.map((i: any) => ({
          id: i.id, date: i.dateIntervention, type: i.type,
          technicien: i.nomFse || '-', nomFse: i.nomFse, statut: i.statut,
          description: i.descriptionPanne, observations: i.actionsEffectuees,
          duree: i.dureeHeures, equipement: i.equipement
        }));
        this.equipements = [...new Set(this.interventions
          .map(i => i.equipement?.nom)
          .filter(Boolean))] as string[];
        this.filtered = [...this.interventions];
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.interventions.filter(i => {
      const matchSearch = !q ||
        i.type?.toLowerCase().includes(q) ||
        i.technicien?.toLowerCase().includes(q) ||
        i.statut?.toLowerCase().includes(q) ||
        i.equipement?.nom?.toLowerCase().includes(q);
      const matchType = !this.filterType || i.type === this.filterType;
      const matchStatut = !this.filterStatut || i.statut === this.filterStatut;
      const matchEquipement = !this.filterEquipement || i.equipement?.nom === this.filterEquipement;
      const matchFse = !this.filterFse || i.nomFse === this.filterFse || i.technicien === this.filterFse;
      const matchDateFrom = !this.dateFrom || new Date(i.date) >= new Date(this.dateFrom);
      const matchDateTo = !this.dateTo || new Date(i.date) <= new Date(this.dateTo);
      return matchSearch && matchType && matchStatut && matchEquipement && matchFse && matchDateFrom && matchDateTo;
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

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  prevPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); }
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  delete(id: number, e: Event): void {
    e.stopPropagation();
    this.pendingDeleteId = id;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.interventionService.delete(this.pendingDeleteId).subscribe({
        next: () => { this.showConfirm = false; this.pendingDeleteId = null; this.load(); }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirm = false;
    this.pendingDeleteId = null;
  }

  goToDetail(id: number): void { this.router.navigate(['/interventions', id]); }
  goToEdit(id: number, e: Event): void { e.stopPropagation(); this.router.navigate(['/interventions', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/interventions/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'TERMINEE': return 'statut-termine';
      case 'EN_COURS': return 'statut-en-cours';
      case 'EN_ATTENTE_PIECE': return 'statut-planifie';
      default: return 'statut-default';
    }
  }
}