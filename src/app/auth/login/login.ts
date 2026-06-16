import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = '';
  sessionMessage = '';
  loading = false;
  showPassword = false;
  rememberMe = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (localStorage.getItem('session_expired') === 'true') {
      this.sessionMessage = 'Vous avez depasse 15 minutes d inactivite. Vous avez ete deconnecte automatiquement.';
      localStorage.removeItem('session_expired');
    }
  }

  login(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.sessionMessage = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token, response.email, response.role, response.nom, response.prenom);
        const role = response.role;
        if (role === 'ADMIN') { this.router.navigate(['/dashboard']); }
        else if (role === 'BACK_OFFICE') { this.router.navigate(['/backoffice/planning']); }
        else if (role === 'CHEF_POLE') { this.router.navigate(['/chefpole/planning']); }
        else { this.router.navigate(['/fse/dashboard']); }
      },
      error: () => {
        this.errorMessage = 'Email ou mot de passe incorrect.';
        this.loading = false;
      }
    });
  }
}
