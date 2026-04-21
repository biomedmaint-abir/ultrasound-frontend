import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EquipementService } from '../../services/equipement';

@Component({
  selector: 'app-equipement-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './equipement-detail.html',
  styleUrl: './equipement-detail.scss'
})
export class EquipementDetail implements OnInit {
  equipement: any = null;
  isLoading = true;
  hasError = false;

  constructor(
    private equipementService: EquipementService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.isLoading = true;
    this.equipementService.getById(id).subscribe({
      next: (data) => {
        this.equipement = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.hasError = true; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  goBack(): void { this.router.navigate(['/equipements']); }
  goToEdit(): void { this.router.navigate(['/equipements', this.equipement.id, 'edit']); }

  delete(): void {
    if (confirm('Supprimer cet équipement ?')) {
      this.equipementService.delete(this.equipement.id).subscribe({
        next: () => this.router.navigate(['/equipements'])
      });
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_SERVICE': return 'statut-termine';
      case 'EN_MAINTENANCE': return 'statut-en-cours';
      case 'EN_PANNE': return 'statut-planifie';
      default: return 'statut-default';
    }
  }
}