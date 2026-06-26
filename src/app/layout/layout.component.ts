import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  email = localStorage.getItem('email') || '';
  role = localStorage.getItem('role') || '';
  sidebarOpen = true;
  showLogoutConfirm = false;
  currentRoute = '';

  get navItems() {
    const isAdmin = this.role === 'ADMIN';
    const items = [
      { path: '/dashboard',     icon: '⊞', label: 'Tableau de bord' },
      { path: '/interventions', icon: '⚙', label: 'Interventions' },
      { path: '/equipements',   icon: '⊡', label: 'Équipements' },
      { path: '/contrats',      icon: '≡', label: 'Contrats' },
      { path: '/optimisation',  icon: '⚡', label: 'Optimisation' },
      { path: '/analyse-predictive', icon: '📈', label: 'Analyse Prédictive' },
      { path: '/historique',    icon: '◷', label: 'Historique' },
    ];
    if (isAdmin) {
      items.splice(8, 0, { path: '/utilisateurs', icon: '⊹', label: 'Utilisateurs' });
    } else {
      items.push({ path: '/profil', icon: '◉', label: 'Mon Profil' });
    }
    return items;
  }

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.url;
    });
  }

  isActive(path: string): boolean { return this.currentRoute.startsWith(path); }
  logout(): void { this.showLogoutConfirm = true; }
  confirmLogout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
}