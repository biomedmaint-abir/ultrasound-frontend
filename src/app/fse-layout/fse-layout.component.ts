import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-fse-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './fse-layout.component.html',
  styleUrl: './fse-layout.component.scss'
})
export class FseLayoutComponent {
  email = localStorage.getItem('email') || '';
  role = localStorage.getItem('role') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  sidebarOpen = true;
  showLogoutConfirm = false;
  currentRoute = '';

  navItems = [
    { path: '/fse/dashboard',     icon: '⊞', label: 'Mon Tableau de bord' },
    { path: '/fse/interventions', icon: '⚙', label: 'Mes Interventions' },
    { path: '/fse/equipements',   icon: '⊡', label: 'Équipements' },
    { path: '/fse/planning',      icon: '▦', label: 'Mon Planning' },
    { path: '/fse/rapports',      icon: '⊿', label: 'Mes Rapports' },
    { path: '/fse/historique',    icon: '◷', label: 'Mon Historique' },
    { path: '/fse/assistant-ia',  icon: '◻', label: 'Assistant IA' },
    { path: '/fse/analyse-predictive', icon: '📈', label: 'Analyse Prédictive' },
    { path: '/fse/profil',        icon: '◉', label: 'Mon Profil' },
  ];

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => { this.currentRoute = e.url; });
  }

  isActive(path: string): boolean { return this.currentRoute.startsWith(path); }
  logout(): void { this.showLogoutConfirm = true; }
  confirmLogout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
}
