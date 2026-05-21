import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';
import { ToastService } from './shared/toast/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: '<router-outlet /><app-toast></app-toast>'
})
export class AppComponent implements OnInit, OnDestroy {
  private inactivityTimer: any;
  private readonly TIMEOUT = 15 * 60 * 1000;
  private toastService = inject(ToastService);

  constructor(private router: Router) {}

  ngOnInit(): void { this.resetTimer(); }
  ngOnDestroy(): void { clearTimeout(this.inactivityTimer); }

  @HostListener('document:mousemove')
  @HostListener('document:keypress')
  @HostListener('document:click')
  @HostListener('document:scroll')
  resetTimer(): void {
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        this.toastService.warning('Session expirée après 15 minutes d\'inactivité.');
        this.router.navigate(['/auth']);
      }
    }, this.TIMEOUT);
  }
}
