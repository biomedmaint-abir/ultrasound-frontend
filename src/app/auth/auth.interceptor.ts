import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isExcluded = req.url.includes('/assistant') ||
                         req.url.includes('/documents') ||
                         req.url.includes('/documents-philips') ||
                         req.url.includes('/codes-erreur') ||
                         req.url.includes('anthropic.com') ||
                         req.url.includes('/interventions') ||
                         req.url.includes('/equipements') ||
                         req.url.includes('/pieces') ||
                         req.url.includes('/intervention-pieces') ||
                         req.url.includes('/analyse-predictive') ||
                         req.url.includes('/optimisation');

      if (error.status === 401 && !isExcluded) {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        router.navigate(['/auth']);
      }
      return throwError(() => error);
    })
  );
};
