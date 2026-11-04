import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isSignedIn()) {
    return router.createUrlTree(['/admin']);
  }

  const isTrustee = await auth.verifyTrustee();
  return isTrustee ? true : router.createUrlTree(['/admin']);
};
