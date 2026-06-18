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
          .filter(u => u.role?.nom === 'TECHNICIEN')
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

  async telechargerFiche34(row: any, event: Event): Promise<void> {
    event.stopPropagation();
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210; const margin = 15;
    doc.setFillColor(28,43,90); doc.rect(0,0,W,30,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(20);
    doc.text('SCRIM', margin, 18);
    doc.setFontSize(14); doc.text('Fiche 34 — Rapport d\'Intervention', W/2, 18, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text('N° Éco 0802 000 089 | sav@scrim.ma', W-margin, 20, {align:'right'});
    let y = 36;
    doc.setTextColor(0,0,0); doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.rect(margin, y, W-margin*2, 10);
    doc.text('Rapport d\'intervention', margin+4, y+7);
    doc.setTextColor(200,0,0);
    doc.text('N°  ' + String(row.id).padStart(6,'0'), W-margin-35, y+7);
    y += 14;
    const infos = [
      ['Client', row.equipement?.parc || '—'],
      ['Date', row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '—'],
      ['Équipement', row.equipement?.nom || '—'],
      ['Type', row.type || '—'],
      ['FSE', row.technicien || '—'],
      ['Statut', row.statut || '—'],
    ];
    doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); doc.setFontSize(9);
    infos.forEach((info, idx) => {
      if (idx % 2 === 0) doc.setFillColor(245,247,250); else doc.setFillColor(255,255,255);
      doc.rect(10, y-3, W-20, 8, 'F');
      doc.setFont('helvetica','bold'); doc.setTextColor(28,43,90);
      doc.text(info[0] + ' :', 14, y+2);
      doc.setFont('helvetica','normal'); doc.setTextColor(51,51,51);
      doc.text(info[1], 70, y+2);
      y += 9;
    });
    doc.setFillColor(28,43,90); doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(7.5);
    doc.text('Avenue Mohamed Elyazidi, Villa N° 7, Bloc D, Secteur 9, Hay Riad - RABAT | www.scrim.ma', W/2, 293, {align:'center'});
    doc.save('Fiche34_N' + String(row.id).padStart(6,'0') + '.pdf');
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