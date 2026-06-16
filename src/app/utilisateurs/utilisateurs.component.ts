import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './utilisateurs.component.html',
  styleUrl: './utilisateurs.component.scss'
})
export class UtilisateursComponent implements OnInit {
  showConfirm = false;
  pendingDeleteId: number | null = null;
  confirmTitle = 'Supprimer cet utilisateur';
  confirmMessage = 'Cette action est irreversible.';
  utilisateurs: any[] = [];
  filtered: any[] = [];
  searchQuery = '';
  isLoading = true;
  showForm = false;
  isEditMode = false;
  editUserId: number | null = null;
  successMessage = '';
  errorMessage = '';

  form = { nom: '', prenom: '', email: '', motDePasse: '', role: { id: 1 } };

  roles = [
    { id: 1, nom: 'ADMIN', label: 'Administrateur' },
    { id: 2, nom: 'FSE', label: 'FSE / Ingénieur biomédical' },
    { id: 4, nom: 'BACK_OFFICE', label: 'Back-office' },
    { id: 5, nom: 'CHEF_POLE', label: 'Chef de pôle imagerie' },
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({
      next: (data) => {
        this.utilisateurs = data;
        this.filtered = [...data];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.utilisateurs.filter(u =>
      u.nom?.toLowerCase().includes(q) ||
      u.prenom?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
    this.cdr.detectChanges();
  }

  getCountByRole(role: string): number {
    return this.utilisateurs.filter(u => u.role?.nom === role).length;
  }

  getRoleLabel(user: any): string {
    switch (user.role?.nom) {
      case 'ADMIN': return 'Administrateur';
      case 'FSE': return 'FSE / Ingénieur biomédical';
      case 'BACK_OFFICE': return 'Back-office';
      case 'CHEF_POLE': return 'Chef de pôle imagerie';
      default: return user.role?.nom || 'Admin';
    }
  }

  getRoleClass(user: any): string {
    switch (user.role?.nom) {
      case 'ADMIN': return 'role-admin';
      case 'FSE': return 'role-ingenieur';
      case 'BACK_OFFICE': return 'role-technicien';
      case 'CHEF_POLE': return 'role-technicien';
      default: return 'role-admin';
    }
  }

  getAvatarClass(user: any): string {
    switch (user.role?.nom) {
      case 'ADMIN': return 'avatar-blue';
      case 'FSE': return 'avatar-green';
      case 'BACK_OFFICE': return 'avatar-orange';
      case 'CHEF_POLE': return 'avatar-orange';
      default: return 'avatar-blue';
    }
  }

  ouvrirFormulaire(): void {
    this.isEditMode = false;
    this.editUserId = null;
    this.form = { nom: '', prenom: '', email: '', motDePasse: '', role: { id: 1 } };
    this.errorMessage = '';
    this.showForm = true;
  }

  modifierUtilisateur(u: any): void {
    this.isEditMode = true;
    this.editUserId = u.id;
    this.form = { nom: u.nom || '', prenom: u.prenom || '', email: u.email || '', motDePasse: '', role: { id: u.role?.id || 1 } };
    this.errorMessage = '';
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  enregistrer(): void {
    if (!this.form.nom || !this.form.email) { this.errorMessage = 'Veuillez remplir tous les champs obligatoires.'; return; }
    if (!this.isEditMode && !this.form.motDePasse) { this.errorMessage = 'Le mot de passe est obligatoire.'; return; }
    const payload: any = { nom: this.form.nom, prenom: this.form.prenom, email: this.form.email, role: { id: Number(this.form.role.id) } };
    if (this.form.motDePasse) payload.motDePasse = this.form.motDePasse;

    const req$ = this.isEditMode && this.editUserId
      ? this.http.put(`${environment.apiUrl}/utilisateurs/${this.editUserId}`, payload)
      : this.http.post(`${environment.apiUrl}/utilisateurs`, payload);

    req$.subscribe({
      next: () => {
        this.successMessage = this.isEditMode ? 'Utilisateur modifié avec succès !' : 'Utilisateur ajouté avec succès !';
        this.showForm = false; this.isEditMode = false; this.editUserId = null;
        this.form = { nom: '', prenom: '', email: '', motDePasse: '', role: { id: 1 } };
        this.loadData();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.errorMessage = 'Erreur lors de l\'opération.'; this.cdr.detectChanges(); }
    });
  }

  supprimerUtilisateur(id: number): void { this.pendingDeleteId = id; this.showConfirm = true; }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.http.delete(`${environment.apiUrl}/utilisateurs/${this.pendingDeleteId}`).subscribe({
        next: () => { this.showConfirm = false; this.pendingDeleteId = null; this.loadData(); },
        error: () => {}
      });
    }
  }

  cancelDelete(): void { this.showConfirm = false; this.pendingDeleteId = null; }
}