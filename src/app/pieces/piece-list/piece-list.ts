import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PieceService } from '../../services/piece';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-piece-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piece-list.html',
  styleUrl: './piece-list.scss'
})
export class PieceList implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer la pièce';
  confirmMessage = 'Cette action est irréversible. La pièce sera définitivement supprimée.';

  pieces: any[] = [];
  filtered: any[] = [];
  pagedData: any[] = [];
  total = 0;

  search = '';
  filterStatut = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  isLoading = true;
  hasError = false;

  showSuiviModal = false;
  selectedPiece: any = null;
  suiviForm: any = {
    statut: '', clientEchange: '', dateEchange: '',
    retourFournisseur: false, dateRetourPrevu: '', notesSuivi: ''
  };

  parcs = [
    'CHU Tanger', 'HCZ Rabat', 'CHU Mohamed VI Oujda',
    'Clinique Tarik Ibn Ziyad', 'HCK Casablanca',
    'Clinique Slaoui Rabat', 'ODM Fes', 'Clinique Ibn Sina Tanger',
    'Clinique Dar DMANA', 'Dr Lamhani Marrakech',
    'Dr SAFI Asfi', 'Dr Boudhar Safi', 'Dr ESSAKET Bani Mellal'
  ];

  constructor(
    private pieceService: PieceService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.pieceService.getAll().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.pieces = data;
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
    this.filtered = this.pieces.filter(p => {
      const matchSearch = p.nom?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q);
      const matchStatut = !this.filterStatut || p.statut === this.filterStatut;
      return matchSearch && matchStatut;
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

  getValeurTotale(): number {
    return this.pieces.reduce((sum, p) => sum + ((p.prixUnitaire || 0) * (p.quantite || 1)), 0);
  }

  getPct(statut: string): number {
    if (!this.pieces.length) return 0;
    return Math.round((this.countByStatut(statut) / this.pieces.length) * 100);
  }

  countByStatut(statut: string): number {
    return this.pieces.filter(p => (p.statut || 'EN_STOCK') === statut).length;
  }

  ouvrirSuivi(piece: any, event: Event): void {
    event.stopPropagation();
    this.selectedPiece = piece;
    this.suiviForm = {
      statut: piece.statut || 'EN_STOCK',
      clientEchange: piece.clientEchange || '',
      dateEchange: piece.dateEchange || '',
      retourFournisseur: piece.retourFournisseur || false,
      dateRetourPrevu: piece.dateRetourPrevu || '',
      notesSuivi: piece.notesSuivi || ''
    };
    this.showSuiviModal = true;
    this.cdr.detectChanges();
  }

  fermerSuivi(): void {
    this.showSuiviModal = false;
    this.selectedPiece = null;
    this.cdr.detectChanges();
  }

  sauvegarderSuivi(): void {
    if (!this.selectedPiece) return;
    const payload = {
      ...this.selectedPiece,
      statut: this.suiviForm.statut,
      clientEchange: this.suiviForm.clientEchange,
      dateEchange: this.suiviForm.dateEchange || null,
      retourFournisseur: this.suiviForm.retourFournisseur,
      dateRetourPrevu: this.suiviForm.dateRetourPrevu || null,
      notesSuivi: this.suiviForm.notesSuivi
    };
    this.http.put(`${environment.apiUrl}/pieces/${this.selectedPiece.id}`, payload).subscribe({
      next: () => { this.fermerSuivi(); this.load(); },
      error: () => {}
    });
  }

  changerStatutRapide(piece: any, statut: string, event: Event): void {
    event.stopPropagation();
    const payload = { ...piece, statut };
    this.http.put(`${environment.apiUrl}/pieces/${piece.id}`, payload).subscribe({
      next: () => this.load()
    });
  }

  goToDetail(id: number): void { this.router.navigate(['/pieces', id]); }
  goToEdit(id: number, e: Event): void { e.stopPropagation(); this.router.navigate(['/pieces', id, 'edit']); }
  goToNew(): void { this.router.navigate(['/pieces/new']); }
  goBack(): void { this.router.navigate(['/dashboard']); }

  delete(id: number, e: Event): void {
    e.stopPropagation();
    this.pendingDeleteId = id;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.pieceService.delete(this.pendingDeleteId).subscribe({
        next: () => { this.showConfirm = false; this.pendingDeleteId = null; this.load(); }
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }
}