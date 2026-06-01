import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipementService } from '../../services/equipement';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-equipement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './equipement-list.html',
  styleUrl: './equipement-list.scss'
})
export class EquipementList implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer cet équipement';
  confirmMessage = 'Cette action est irréversible. L\'équipement sera définitivement supprimé.';

  equipements: any[] = [];
  filtered: any[] = [];
  pagedData: any[] = [];

  modeles: string[] = [];
  services: string[] = [];
  parcs: string[] = [];

  search = '';
  filterModele = '';
  filterService = '';
  filterParc = '';
  filterStatut = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  total = 0;

  isLoading = true;
  hasError = false;

  constructor(
    private equipementService: EquipementService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.equipementService.getAll().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.equipements = data.map((e: any) => ({
          id: e.id, nom: e.nom, numeroSerie: e.numeroSerie,
          numInventaire: e.numInventaire, service: e.service,
          parc: e.parc, dateInstallation: e.dateInstallation, statut: e.statut
        }));
        this.total = this.equipements.length;
        this.modeles = [...new Set(this.equipements.map(e => e.nom).filter(Boolean))] as string[];
        this.services = [...new Set(this.equipements.map(e => e.service).filter(Boolean))] as string[];
        this.parcs = [...new Set(this.equipements.map(e => e.parc).filter(Boolean))] as string[];
        this.filtered = [...this.equipements];
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.equipements.filter(e => {
      const matchSearch = !q ||
        e.nom?.toLowerCase().includes(q) ||
        e.numeroSerie?.toLowerCase().includes(q) ||
        e.service?.toLowerCase().includes(q) ||
        e.parc?.toLowerCase().includes(q);
      const matchModele = !this.filterModele || e.nom === this.filterModele;
      const matchService = !this.filterService || e.service === this.filterService;
      const matchParc = !this.filterParc || e.parc === this.filterParc;
      const matchStatut = !this.filterStatut || e.statut === this.filterStatut;
      return matchSearch && matchModele && matchService && matchParc && matchStatut;
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

  prevPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); }
  }

  goToPage(p: number): void {
    this.currentPage = p;
    this.updatePagination();
  }

  getPages(): number[] {
    const pages: number[] = [];
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push(-1);
      for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(this.totalPages - 1, this.currentPage + 1); i++) pages.push(i);
      if (this.currentPage < this.totalPages - 2) pages.push(-1);
      pages.push(this.totalPages);
    }
    return pages;
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  delete(id: number, ev: Event): void {
    ev.stopPropagation();
    this.pendingDeleteId = id;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.equipementService.delete(this.pendingDeleteId).subscribe({
        next: () => { this.showConfirm = false; this.pendingDeleteId = null; this.load(); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }

  goToDetail(id: number): void { this.router.navigate(['/equipements', id]); }
  goToEdit(id: number, ev: Event): void { ev.stopPropagation(); this.router.navigate(['/equipements', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/equipements/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_SERVICE': return 'statut-service';
      case 'EN_MAINTENANCE': return 'statut-maintenance';
      case 'HORS_SERVICE': return 'statut-hors';
      default: return 'statut-default';
    }
  }
}