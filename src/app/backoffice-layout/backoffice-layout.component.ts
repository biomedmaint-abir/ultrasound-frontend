import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDialogComponent],
  template: `
<div class="app-container" [class.sidebar-collapsed]="!sidebarOpen">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon-box">🔷</div>
        <div class="logo-texts">
          <span class="logo-text">UltrasoundTrack</span>
          <span class="logo-sub">by SCRIM</span>
        </div>
      </div>
      <button class="toggle-btn" (click)="toggleSidebar()">{{ sidebarOpen ? '◀' : '▶' }}</button>
    </div>
    <nav class="nav-menu">
      <a *ngFor="let item of navItems" [routerLink]="item.path" class="nav-item" [class.active]="isActive(item.path)">
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar">{{ email?.charAt(0)?.toUpperCase() }}</div>
        <div class="user-details">
          <span class="user-email">{{ nom && prenom ? nom + ' ' + prenom : email }}</span>
          <span class="user-role">Back-office</span>
        </div>
      </div>
      <button class="logout-btn" (click)="logout()">🚪 <span class="nav-label">Déconnexion</span></button>
    </div>
  </aside>
  <main class="main-content"><router-outlet></router-outlet></main>
</div>
<app-confirm-dialog [visible]="showLogoutConfirm" title="Déconnexion" message="Êtes-vous sûr de vouloir vous déconnecter ?" confirmLabel="Se déconnecter" cancelLabel="Annuler" icon="🔒" [danger]="false" (confirmed)="confirmLogout()" (cancelled)="showLogoutConfirm = false"></app-confirm-dialog>`,
  styles: [`
.app-container{display:flex;height:100vh;background:#f8f9fc}
.sidebar{width:260px;background:white;display:flex;flex-direction:column;transition:width .3s ease;box-shadow:1px 0 8px rgba(0,0,0,.06);overflow:hidden;flex-shrink:0;border-right:1px solid #f1f3f5}
.sidebar-collapsed .sidebar{width:70px;.logo-texts,.nav-label,.user-details{display:none}}
.sidebar-header{display:flex;align-items:center;justify-content:space-between;padding:20px 16px;border-bottom:1px solid #f1f3f5}
.logo{display:flex;align-items:center;gap:10px;.logo-icon-box{width:36px;height:36px;background:#FFF7ED;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}.logo-texts{display:flex;flex-direction:column}.logo-text{color:#1C2B5A;font-size:16px;font-weight:800}.logo-sub{font-size:10px;color:#6b7280;font-style:italic}}
.toggle-btn{background:#f8f9fc;border:1.5px solid #e2e6f0;color:#6b7280;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center}
.nav-menu{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;color:#6b7280;text-decoration:none;transition:all .2s ease;position:relative;.nav-icon{font-size:18px;flex-shrink:0}.nav-label{font-size:13.5px;font-weight:500;white-space:nowrap}&:hover{background:#f8f9fc;color:#0d1340}&.active{background:#FFF7ED;color:#f97316;.nav-label{font-weight:700}&::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:24px;background:#f97316;border-radius:0 4px 4px 0}}}
.sidebar-footer{padding:12px 8px;border-top:1px solid #f1f3f5;display:flex;flex-direction:column;gap:6px}
.user-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:#f8f9fc;.user-avatar{width:36px;height:36px;border-radius:50%;background:#f97316;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0}.user-details{flex:1;min-width:0;.user-email{display:block;font-size:12px;font-weight:600;color:#0d1340;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.user-role{display:block;font-size:11px;color:#f97316;font-weight:600}}}
.logout-btn{display:flex;align-items:center;gap:12px;padding:10px 14px;background:#FEF2F2;border:none;border-radius:10px;color:#DC2626;cursor:pointer;font-size:13.5px;font-weight:600;width:100%}
.main-content{flex:1;overflow-y:auto;background:#f8f9fc}
  `]
})
export class BackofficeLayoutComponent {
  email = localStorage.getItem('email') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  sidebarOpen = true;
  showLogoutConfirm = false;
  currentRoute = '';

  navItems = [
    { path: '/backoffice/planning', icon: '📅', label: 'Planning' },
    { path: '/backoffice/pieces', icon: '🔩', label: 'Pièces de rechange' },
    { path: '/backoffice/utilisateurs', icon: '⊹', label: 'Utilisateurs' },
    { path: '/backoffice/profil', icon: '◉', label: 'Mon Profil' },
  ];

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => { this.currentRoute = e.url; });
  }

  isActive(path: string): boolean { return this.currentRoute.startsWith(path); }
  logout(): void { this.showLogoutConfirm = true; }
  confirmLogout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
}
