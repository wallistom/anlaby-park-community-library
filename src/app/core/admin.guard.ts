import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Keeps the trustee screens shut unless the API says this account is a trustee.
 *
 * Signed in is not the same as allowed in. Google issues a valid ID token to
 * anyone with an account, so checking only `isSignedIn()` let any Google user
 * reach the admin shell — the API refused every request, but the navigation,
 * the screens, and a row of failures were all on display.
 *
 * The allowlist stays server-side. This asks and obeys the answer; both a
 * refusal and an unreachable API send the visitor back to the sign-in page,
 * where `accessState` explains what happened.
 */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isSignedIn()) {
    return router.createUrlTree(['/admin']);
  }

  const isTrustee = await auth.verifyTrustee();
  return isTrustee ? true : router.createUrlTree(['/admin']);
};
