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
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { StatutFilterPipe } from '../../shared/statut-filter.pipe';
import { PieceService } from '../../services/piece';
import { environment } from '../../../environments/environment';
// confirm dialog handled inline

@Component({
  selector: 'app-piece-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule,
    MatTooltipModule, MatProgressSpinnerModule,
    MatSelectModule, MatDialogModule,
    StatutFilterPipe
  ],
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
  search = '';
  filterStatut = '';
  isLoading = true;
  hasError = false;

  displayedColumns = ['id', 'nom', 'reference', 'client', 'prixUnitaire', 'statut', 'clientEchange', 'retourFournisseur', 'actions'];

  // Modale suivi
  showSuiviModal = false;
  selectedPiece: any = null;
  suiviForm: any = {
    statut: '',
    clientEchange: '',
    dateEchange: '',
    retourFournisseur: false,
    dateRetourPrevu: '',
    notesSuivi: ''
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
        this.filtered = [...data];
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
  }

  getStatutClass(statut: string): string {
    switch(statut) {
      case 'EN_STOCK': return 'statut-stock';
      case 'DEFECTUEUSE': return 'statut-defect';
      case 'EN_ATTENTE_RETOUR': return 'statut-attente';
      case 'RETOURNEE': return 'statut-retour';
      default: return 'statut-stock';
    }
  }

  getStatutLabel(statut: string): string {
    switch(statut) {
      case 'EN_STOCK': return '✅ En stock';
      case 'DEFECTUEUSE': return '❌ Défectueuse';
      case 'EN_ATTENTE_RETOUR': return '⏳ Attente retour';
      case 'RETOURNEE': return '🔄 Retournée';
      default: return '✅ En stock';
    }
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
      next: () => {
        this.fermerSuivi();
        this.load();
      },
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

  countByStatut(statut: string): number {
    return this.pieces.filter(p => (p.statut || "EN_STOCK") === statut).length;
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
