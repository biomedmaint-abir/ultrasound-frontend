import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
@Component({ selector: "app-fse-profil", standalone: true, imports: [CommonModule, FormsModule],
template: `<div style="padding:28px;background:#f8f9fc;min-height:100vh"><h1 style="color:#0d1340;font-size:26px;font-weight:800;margin:0 0 8px">Mon Profil</h1><p style="color:#6b7280;margin:0 0 24px">{{email}}</p><div style="background:white;border-radius:16px;padding:28px;box-shadow:0 1px 8px rgba(0,0,0,.06)"><div *ngIf="successMsg" style="background:#DCFCE7;color:#16A34A;padding:12px 16px;border-radius:10px;margin-bottom:16px">✅ {{successMsg}}</div><div *ngIf="errorMsg" style="background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:10px;margin-bottom:16px">⚠️ {{errorMsg}}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:24px"><div style="display:flex;flex-direction:column;gap:8px"><label style="font-size:13px;font-weight:600;color:#0d1340">Nom</label><input type="text" [(ngModel)]="newNom" [placeholder]="nom||'Nom'" style="padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none"></div><div style="display:flex;flex-direction:column;gap:8px"><label style="font-size:13px;font-weight:600;color:#0d1340">Prénom</label><input type="text" [(ngModel)]="newPrenom" [placeholder]="prenom||'Prénom'" style="padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none"></div><div style="display:flex;flex-direction:column;gap:8px"><label style="font-size:13px;font-weight:600;color:#0d1340">Email</label><input type="email" [(ngModel)]="newEmail" [placeholder]="email" style="padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none"></div><div style="display:flex;flex-direction:column;gap:8px"><label style="font-size:13px;font-weight:600;color:#0d1340">Nouveau mot de passe</label><input type="password" [(ngModel)]="newPassword" placeholder="Laisser vide pour ne pas changer" style="padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none"></div><div style="display:flex;flex-direction:column;gap:8px"><label style="font-size:13px;font-weight:600;color:#0d1340">Confirmer</label><input type="password" [(ngModel)]="confirmPassword" placeholder="Confirmer" style="padding:12px 14px;border:1.5px solid #e2e6f0;border-radius:10px;font-size:14px;outline:none"></div></div><button (click)="sauvegarder()" [disabled]="saving" style="background:#16A34A;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer">💾 {{saving ? "Enregistrement..." : "Mettre à jour"}}</button></div></div>`
})
export class FseProfilComponent implements OnInit {
  email = localStorage.getItem("email") || "";
  nom = localStorage.getItem("nom") || "";
  prenom = localStorage.getItem("prenom") || "";
  newNom=""; newPrenom=""; newEmail=""; newPassword=""; confirmPassword="";
  saving=false; successMsg=""; errorMsg=""; userId: number|null=null;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.http.get<any[]>(`${environment.apiUrl}/utilisateurs`).subscribe({ next: (users) => { const me = users.find(u => u.email === this.email); if (me) this.userId = me.id; } }); }
  sauvegarder(): void {
    if (this.newPassword && this.newPassword !== this.confirmPassword) { this.errorMsg = "Les mots de passe ne correspondent pas."; return; }
    if (!this.userId) return;
    this.saving = true;
    const payload: any = { nom: this.newNom || this.nom, prenom: this.newPrenom || this.prenom, email: this.newEmail || this.email };
    if (this.newPassword) payload.motDePasse = this.newPassword;
    this.http.patch(`${environment.apiUrl}/utilisateurs/${this.userId}`, payload).subscribe({
      next: () => { this.saving=false; this.successMsg="Profil mis à jour !"; this.cdr.detectChanges(); },
      error: () => { this.saving=false; this.errorMsg="Erreur."; this.cdr.detectChanges(); }
    });
  }
}