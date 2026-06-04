import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="profil-container">
  <div class="profil-header">
    <div class="avatar">{{ email.charAt(0).toUpperCase() }}</div>
    <div>
      <h1>Mon Profil</h1>
      <p>{{ email }}</p>
      <span class="role-badge">{{ roleLabel }}</span>
    </div>
  </div>

  <div class="profil-card">
    <div class="section-header">
      <div class="section-icon">👤</div>
      <h2>Modifier l'utilisateur</h2>
    </div>

    <div *ngIf="successMsg" class="success-banner">✅ {{ successMsg }}</div>
    <div *ngIf="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

    <div class="form-grid">
      <div class="form-group">
        <label>Nom *</label>
        <input type="text" [(ngModel)]="newNom" [placeholder]="nom || 'Nom'" class="form-input">
      </div>
      <div class="form-group">
        <label>Prénom</label>
        <input type="text" [(ngModel)]="newPrenom" [placeholder]="prenom || 'Prénom'" class="form-input">
      </div>
      <div class="form-group">
        <label>Email *</label>
        <input type="email" [(ngModel)]="newEmail" [placeholder]="email" class="form-input">
      </div>
      <div class="form-group">
        <label>Mot de passe (laisser vide pour ne pas changer)</label>
        <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="Mot de passe" class="form-input">
      </div>
      <div class="form-group">
        <label>Confirmer le mot de passe</label>
        <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="Confirmer" class="form-input">
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-save" (click)="sauvegarder()" [disabled]="saving">
        💾 {{ saving ? 'Enregistrement...' : 'Mettre à jour' }}
      </button>
      <button class="btn-cancel" (click)="reset()">Annuler</button>
    </div>
  </div>
</div>
  `,
  styles: [`
.profil-container {
  max-width: 1000px; margin: 0 auto; padding: 28px 32px;
  font-family: 'Plus Jakarta Sans', sans-serif; background: #f8f9fc; min-height: 100vh;
}

.profil-header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 28px;
  .avatar {
    width: 64px; height: 64px; border-radius: 50%;
    background: #1a2eff; color: white; font-size: 24px; font-weight: 800;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  h1 { margin: 0; font-size: 26px; font-weight: 800; color: #0d1340; }
  p  { margin: 4px 0; font-size: 13px; color: #6b7280; }
  .role-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #EFF6FF; color: #1a2eff; font-size: 12px; font-weight: 600; }
}

.profil-card {
  background: white; border-radius: 16px; padding: 28px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}

.section-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
  .section-icon {
    width: 36px; height: 36px; background: #EFF6FF; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  h2 { margin: 0; font-size: 16px; font-weight: 700; color: #0d1340; }
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 24px; }

.form-group {
  display: flex; flex-direction: column; gap: 8px;
  label { font-size: 13px; font-weight: 600; color: #0d1340; }
}

.form-input {
  padding: 12px 14px; border: 1.5px solid #e2e6f0; border-radius: 10px;
  font-size: 14px; color: #0d1340; outline: none; background: white; box-sizing: border-box; width: 100%;
  &:focus { border-color: #1a2eff; }
  &::placeholder { color: #b0b8cc; }
}

.form-actions { display: flex; gap: 12px; }

.btn-save {
  background: #1a2eff; color: white; border: none; border-radius: 10px;
  padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
  &:hover { background: #0d1bb5; } &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.btn-cancel {
  background: white; border: 1.5px solid #e2e6f0; border-radius: 10px;
  padding: 12px 24px; font-size: 14px; font-weight: 600; color: #0d1340; cursor: pointer;
  &:hover { background: #f8f9fc; }
}

.success-banner { background: #DCFCE7; color: #16A34A; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid #16A34A; font-size: 13px; }
.error-banner   { background: #FEE2E2; color: #DC2626; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid #DC2626; font-size: 13px; }
  `]
})
export class ProfilComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  role = localStorage.getItem('role') || '';
  nom = '';
  prenom = '';
  newNom = '';
  newPrenom = '';
  newEmail = '';
  newPassword = '';
  confirmPassword = '';
  showPass = false;
  saving = false;
  successMsg = '';
  errorMsg = '';
  userId: number | null = null;

  get roleLabel(): string {
    switch(this.role) {
      case 'ADMIN': return 'Administrateur';
      case 'INGENIEUR': return 'Ingénieur Biomédical';
      case 'TECHNICIEN': return 'FSE';
      default: return this.role;
    }
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({
      next: (users) => {
        const me = users.find(u => u.email === this.email);
        if (me) {
          this.userId = me.id;
          this.nom = me.nom || '';
          this.prenom = me.prenom || '';
        }
      }
    });
  }

  reset(): void {
    this.newNom = ''; this.newPrenom = ''; this.newEmail = '';
    this.newPassword = ''; this.confirmPassword = '';
    this.successMsg = ''; this.errorMsg = '';
  }

  sauvegarder(): void {
    this.errorMsg = ''; this.successMsg = '';
    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.'; return;
    }
    if (!this.userId) return;
    this.saving = true;
    const payload: any = {
      nom: this.newNom || this.nom,
      prenom: this.newPrenom || this.prenom,
      email: this.newEmail || this.email
    };
    if (this.newPassword) payload.motDePasse = this.newPassword;
    this.http.patch(`${environment.apiUrl}/utilisateurs/${this.userId}`, payload).subscribe({
      next: () => {
        this.saving = false;
        if (this.newNom) this.nom = this.newNom;
        if (this.newPrenom) this.prenom = this.newPrenom;
        if (this.newEmail) { localStorage.setItem('email', this.newEmail); this.email = this.newEmail; }
        this.reset();
        this.successMsg = 'Profil mis à jour avec succès !';
        this.cdr.detectChanges();
      },
      error: () => { this.saving = false; this.errorMsg = 'Erreur lors de la mise à jour.'; this.cdr.detectChanges(); }
    });
  }
}