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
  <div class="profil-card">
    <div class="profil-header">
      <div class="avatar">{{ email.charAt(0).toUpperCase() }}</div>
      <h2>Mon Profil</h2>
      <p>{{ email }}</p>
      <span class="role-badge">{{ roleLabel }}</span>
    </div>

    <div class="section-title">Modifier mes informations</div>

    <div class="form-group">
      <label>Nouvel email</label>
      <input type="email" [(ngModel)]="newEmail" placeholder="nouveau@email.com">
    </div>

    <div class="form-group">
      <label>Nouveau mot de passe</label>
      <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="••••••••">
      <span class="toggle" (click)="showPass = !showPass">{{ showPass ? '👁️' : '👁️‍🗨️' }}</span>
    </div>

    <div class="form-group">
      <label>Confirmer le mot de passe</label>
      <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="••••••••">
    </div>

    <div *ngIf="successMsg" class="success-banner">✅ {{ successMsg }}</div>
    <div *ngIf="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

    <button class="save-btn" (click)="sauvegarder()" [disabled]="saving">
      {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
    </button>
  </div>
</div>
  `,
  styles: [`
.profil-container { display:flex; justify-content:center; padding:40px 24px; }
.profil-card { width:480px; background:white; border-radius:24px; padding:40px; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
.profil-header { text-align:center; margin-bottom:32px;
  .avatar { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,#1C2B5A,#2563EB); color:white; font-size:28px; font-weight:800; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
  h2 { margin:0 0 4px; font-size:22px; font-weight:700; color:#1C2B5A; }
  p { margin:0 0 8px; color:#666; font-size:14px; }
  .role-badge { display:inline-block; padding:4px 14px; border-radius:20px; background:#E3F2FD; color:#1565C0; font-size:12px; font-weight:600; }
}
.section-title { font-size:14px; font-weight:700; color:#1C2B5A; margin-bottom:20px; padding-bottom:8px; border-bottom:2px solid #E3F2FD; }
.form-group { margin-bottom:18px; position:relative;
  label { display:block; font-size:13px; font-weight:600; color:#333; margin-bottom:7px; }
  input { width:100%; padding:12px 14px; border:2px solid #E9ECEF; border-radius:12px; font-size:14px; outline:none; box-sizing:border-box; transition:border-color 0.2s;
    &:focus { border-color:#2563EB; } }
  .toggle { position:absolute; right:14px; bottom:12px; cursor:pointer; font-size:16px; }
}
.success-banner { background:#E8F5E9; color:#2E7D32; padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:16px; }
.error-banner { background:#FFEBEE; color:#C62828; padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:16px; }
.save-btn { width:100%; padding:14px; background:linear-gradient(135deg,#1C2B5A,#2563EB); color:white; border:none; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer;
  &:hover { opacity:0.9; }
  &:disabled { opacity:0.7; cursor:not-allowed; }
}
  `]
})
export class ProfilComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  role = localStorage.getItem('role') || '';
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
        if (me) this.userId = me.id;
      }
    });
  }

  sauvegarder(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.newEmail && !this.newPassword) {
      this.errorMsg = 'Veuillez remplir au moins un champ.';
      return;
    }

    if (!this.userId) return;

    this.saving = true;
    const payload: any = { email: this.newEmail || this.email };
    if (this.newPassword) payload.motDePasse = this.newPassword;

    this.http.patch(`${environment.apiUrl}/utilisateurs/${this.userId}`, payload).subscribe({
      next: () => {
        this.saving = false;
        if (this.newEmail) {
          localStorage.setItem('email', this.newEmail);
          this.email = this.newEmail;
          this.newEmail = '';
        }
        this.newPassword = '';
        this.confirmPassword = '';
        this.successMsg = 'Profil mis à jour avec succès !';
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'Erreur lors de la mise à jour.';
        this.cdr.detectChanges();
      }
    });
  }
}
