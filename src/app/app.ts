import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent implements OnInit, OnDestroy {
  private inactivityTimer: any;
  private readonly TIMEOUT = 15 * 60 * 1000;

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
        alert('Votre session a expiré après 15 minutes d\'inactivité.');
        this.router.navigate(['/auth']);
      }
    }, this.TIMEOUT);
  }
}