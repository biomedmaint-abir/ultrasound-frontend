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
  isLoading = true;
  showForm = false;
  isEditMode = false;
  editUserId: number | null = null;
  successMessage = '';
  errorMessage = '';

  form = {
    nom: '', prenom: '', email: '', motDePasse: '', role: { id: 1 }
  };

  roles = [
    { id: 1, nom: 'ADMIN', label: 'Administrateur' },
    { id: 2, nom: 'INGENIEUR', label: 'Ingenieur' },
    { id: 3, nom: 'TECHNICIEN', label: 'FSE' },
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({
      next: (data) => { this.utilisateurs = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  getRoleLabel(user: any): string {
    switch (user.role?.nom) {
      case 'ADMIN': return 'Administrateur';
      case 'INGENIEUR': return 'Ingenieur';
      case 'TECHNICIEN': return 'FSE';
      default: return user.role?.nom || 'Admin';
    }
  }

  getRoleClass(user: any): string {
    switch (user.role?.nom) {
      case 'ADMIN': return 'role-admin';
      case 'INGENIEUR': return 'role-ingenieur';
      case 'TECHNICIEN': return 'role-technicien';
      default: return 'role-admin';
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
    this.form = {
      nom: u.nom || '',
      prenom: u.prenom || '',
      email: u.email || '',
      motDePasse: '',
      role: { id: u.role?.id || 1 }
    };
    this.errorMessage = '';
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  enregistrer(): void {
    if (!this.form.nom || !this.form.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    if (!this.isEditMode && !this.form.motDePasse) {
      this.errorMessage = 'Le mot de passe est obligatoire.';
      return;
    }

    const payload: any = {
      nom: this.form.nom,
      prenom: this.form.prenom,
      email: this.form.email,
      role: { id: Number(this.form.role.id) }
    };
    if (this.form.motDePasse) {
      payload.motDePasse = this.form.motDePasse;
    }

    if (this.isEditMode && this.editUserId) {
      this.http.put(`${environment.apiUrl}/utilisateurs/${this.editUserId}`, payload).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur modifié avec succès !';
          this.showForm = false;
          this.isEditMode = false;
          this.editUserId = null;
          this.form = { nom: '', prenom: '', email: '', motDePasse: '', role: { id: 1 } };
          this.loadData();
          setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: () => { this.errorMessage = 'Erreur lors de la modification.'; this.cdr.detectChanges(); }
      });
    } else {
      this.http.post(`${environment.apiUrl}/utilisateurs`, payload).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur ajouté avec succès !';
          this.showForm = false;
          this.form = { nom: '', prenom: '', email: '', motDePasse: '', role: { id: 1 } };
          this.loadData();
          setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: () => { this.errorMessage = 'Erreur lors de l\'ajout.'; this.cdr.detectChanges(); }
      });
    }
  }

  supprimerUtilisateur(id: number): void {
    this.pendingDeleteId = id;
    this.showConfirm = true;
  }

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