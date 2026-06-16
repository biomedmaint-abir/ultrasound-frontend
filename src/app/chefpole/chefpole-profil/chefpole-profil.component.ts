import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chefpole-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container">
  <div class="profil-header">
    <div class="avatar">{{ email.charAt(0).toUpperCase() }}</div>
    <div><h1>Mon Profil</h1><p>{{ email }}</p><span class="role-badge">Chef de pôle</span></div>
  </div>
  <div class="profil-card">
    <div *ngIf="successMsg" class="success-banner">✅ {{ successMsg }}</div>
    <div class="form-grid">
      <div class="form-group"><label>Nom</label><input type="text" [(ngModel)]="newNom" [placeholder]="nom||'Nom'" class="form-input"></div>
      <div class="form-group"><label>Prénom</label><input type="text" [(ngModel)]="newPrenom" [placeholder]="prenom||'Prénom'" class="form-input"></div>
      <div class="form-group"><label>Email</label><input type="email" [(ngModel)]="newEmail" [placeholder]="email" class="form-input"></div>
      <div class="form-group"><label>Mot de passe</label><input type="password" [(ngModel)]="newPassword" placeholder="Laisser vide" class="form-input"></div>
    </div>
    <button class="btn-save" (click)="sauvegarder()" [disabled]="saving">💾 {{ saving ? 'Enregistrement...' : 'Mettre à jour' }}</button>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.profil-header{display:flex;align-items:center;gap:16px;margin-bottom:28px;.avatar{width:64px;height:64px;border-radius:50%;background:#16A34A;color:white;font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:center}h1{margin:0;font-size:26px;font-weight:800;color:#0d1340}p{margin:4px 0;font-size:13px;color:#6b7280}.role-badge{display:inline-block;padding:4px 12px;border-radius:20px;background:#F0FDF4;color:#16A34A;font-size:12px;font-weight:600}}
.profil-card{background:white;border-radius:16px;padding:28px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
.form-group{display:flex;flex-direction:column;gap:8px}label{font-size:13px;font-weight:600;color:#0d1340}
.form-input{padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none}
.btn-save{background:#16A34A;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer}
.success-banner{background:#DCFCE7;color:#16A34A;padding:12px 16px;border-radius:10px;margin-bottom:16px}
  `]
})
export class ChefPoleProfilComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  newNom=''; newPrenom=''; newEmail=''; newPassword='';
  saving=false; successMsg=''; userId: number|null=null;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({ next: (users) => { const me = users.find(u => u.email === this.email); if (me) this.userId = me.id; } }); }
  sauvegarder(): void {
    if (!this.userId) return;
    this.saving = true;
    const payload: any = { nom: this.newNom || this.nom, prenom: this.newPrenom || this.prenom, email: this.newEmail || this.email };
    if (this.newPassword) payload.motDePasse = this.newPassword;
    this.http.put(`${environment.apiUrl}/utilisateurs/${this.userId}`, payload).subscribe({
      next: () => { this.saving=false; this.successMsg='Profil mis à jour !'; },
      error: () => { this.saving=false; }
    });
  }
}
