import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Attaches the trustee's Google ID token to admin requests.
 *
 * Scoped to our own `/admin/` routes so the token is never leaked to a third
 * party if the app later calls an external API.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isAdminCall = req.url.startsWith(`${environment.apiBaseUrl}/admin/`);
  if (!isAdminCall) {
    return next(req);
  }

  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
