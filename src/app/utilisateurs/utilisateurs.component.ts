import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs.component.html',
  styleUrl: './utilisateurs.component.scss'
})
export class UtilisateursComponent implements OnInit {
  utilisateurs: any[] = [];
  isLoading = true;
  showForm = false;
  successMessage = '';
  errorMessage = '';

  form = {
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    role: { id: 1 }
  };

  roles = [
    { id: 1, nom: 'ADMIN', label: 'Administrateur' },
    { id: 2, nom: 'INGENIEUR', label: 'Ingénieur' },
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
    const roleNom = user.role?.nom || '';
    switch (roleNom) {
      case 'ADMIN': return 'Administrateur';
      case 'INGENIEUR': return 'Ingénieur';
      case 'TECHNICIEN': return 'FSE';
      default: return roleNom || 'Admin';
    }
  }

  getRoleClass(user: any): string {
    const roleNom = user.role?.nom || '';
    switch (roleNom) {
      case 'ADMIN': return 'role-admin';
      case 'INGENIEUR': return 'role-ingenieur';
      case 'TECHNICIEN': return 'role-technicien';
      default: return 'role-admin';
    }
  }

  ajouterUtilisateur(): void {
    if (!this.form.nom || !this.form.email || !this.form.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    const payload = {
      nom: this.form.nom,
      prenom: this.form.prenom,
      email: this.form.email,
      motDePasse: this.form.motDePasse,
      role: { id: Number(this.form.role.id) }
    };
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

  supprimerUtilisateur(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.http.delete(`${environment.apiUrl}/utilisateurs/${id}`).subscribe({
      next: () => { this.loadData(); },
      error: () => {}
    });
  }
}