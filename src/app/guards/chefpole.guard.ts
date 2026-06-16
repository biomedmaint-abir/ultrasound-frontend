import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ChefPoleGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(): boolean {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/auth']); return false; }
    if (role !== 'CHEF_POLE') { this.router.navigate(['/auth']); return false; }
    return true;
  }
}
