import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  email = localStorage.getItem('email') || '';
  sidebarOpen = true;
  currentRoute = '';

  navItems = [
    { path: '/dashboard', icon: '📊', label: 'Tableau de bord' },
    { path: '/interventions', icon: '🔧', label: 'Interventions' },
    { path: '/equipements', icon: '🔬', label: 'Équipements' },
    { path: '/pieces', icon: '🔩', label: 'Pièces de rechange' },
    { path: '/contrats', icon: '📄', label: 'Contrats' },
    { path: '/planning', icon: '📅', label: 'Planification' },
    { path: '/rapports', icon: '📈', label: 'Rapports' },
    { path: '/optimisation', icon: '💹', label: 'Optimisation' },
    { path: '/assistant-ia', icon: '🤖', label: 'Assistant IA' },
  ];

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.url;
    });
  }

  isActive(path: string): boolean {
    return this.currentRoute.startsWith(path);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    this.router.navigate(['/auth']);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}