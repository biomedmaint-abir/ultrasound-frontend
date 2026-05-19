import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  email = localStorage.getItem('email') || '';
  role = localStorage.getItem('role') || '';
  sidebarOpen = true;
  currentRoute = '';

  get navItems() {
    const isAdmin = this.role === 'ADMIN';
    const items = [
      { path: '/dashboard', icon: '📊', label: 'Tableau de bord' },
      { path: '/interventions', icon: '🔧', label: 'Interventions' },
      { path: '/equipements', icon: '🔬', label: 'Équipements' },
      { path: '/pieces', icon: '🔩', label: 'Pièces de rechange' },
      { path: '/contrats', icon: '📄', label: 'Contrats' },
      { path: '/planning', icon: '📅', label: 'Planification' },
      { path: '/rapports', icon: '📈', label: 'Rapports' },
      { path: '/optimisation', icon: '💹', label: 'Optimisation' },
      { path: '/historique', icon: '🕐', label: 'Historique' },
      { path: '/assistant-ia', icon: '🤖', label: 'Assistant IA' },
    ];
    if (isAdmin) {
      items.splice(8, 0, { path: '/utilisateurs', icon: '👥', label: 'Utilisateurs' });
    } else {
      items.push({ path: '/profil', icon: '👤', label: 'Mon Profil' });
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
}
