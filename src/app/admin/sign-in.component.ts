import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { AuthService } from '../core/auth.service';
import { SITE } from '../core/site.data';

@Component({
  selector: 'app-sign-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="mx-auto max-w-md py-10">
      <div class="card p-8 sm:p-10">
        <span
          class="bg-blue-50 text-blue-700 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        >
          <app-icon name="key" [size]="26" />
        </span>

        <h1 class="mt-6 text-center text-2xl font-semibold">Trustee sign in</h1>
        <p class="text-ink-soft mt-2 text-center">
          This area is for {{ site.shortName }} trustees. Sign in with the Google account you gave
          to the Secretary.
        </p>

        <!-- Google renders its own button into this element. Hidden once an
             account is signed in but refused, so the only thing on offer is
             signing out and trying a different one. -->
        <div
          class="mt-8 flex justify-center"
          [hidden]="refused() || unavailable()"
          #googleButton
        ></div>

        @if (refused()) {
          <!-- Naming the account matters: the usual cause is being signed in to
               a personal Google account in this browser without realising. -->
          <div class="mt-8 alert-danger" role="alert">
            <app-icon name="info" [size]="19" />
            <div class="text-sm">
              <p>
                <strong class="font-semibold break-all">{{ auth.currentUser()?.email }}</strong>
                is not set up as a trustee account, so the admin area is closed to it.
              </p>
              <p class="mt-2">
                If you have more than one Google account, sign out and pick the one you gave to the
                Secretary.
              </p>
            </div>
          </div>

          <button type="button" class="btn-secondary mt-5 w-full" (click)="signOut()">
            Sign out and try another account
          </button>
        }

        @if (unavailable()) {
          <!-- The check itself failed, which is not the same as being turned
               away. Saying "you are not a trustee" here would be wrong. -->
          <div class="mt-8 alert-danger" role="alert">
            <app-icon name="info" [size]="19" />
            <div class="text-sm">
              <p>We could not check your account just now, so the trustee area is closed.</p>
              <p class="mt-2">Try again in a minute. If it keeps happening, let Tom know.</p>
            </div>
          </div>

          <button type="button" class="btn-secondary mt-5 w-full" (click)="retry()">
            Try again
          </button>
        }

        @if (error()) {
          <div class="mt-6 alert-danger" role="alert">
            <app-icon name="info" [size]="19" />
            <p class="text-sm">{{ error() }}</p>
          </div>
        }

        @if (!refused() && !unavailable()) {
          <p class="text-ink-muted mt-8 text-center text-xs">
            Only approved accounts can get in. If yours is not working, speak to the Secretary.
          </p>
        }
      </div>
    </div>
  `,
})
export class SignInComponent implements AfterViewInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly site = SITE;
  protected readonly error = signal<string | null>(null);

  /** Signed in, but the API will not have them. */
  protected readonly refused = computed(
    () => this.auth.isSignedIn() && this.auth.accessState() === 'denied',
  );

  /** Signed in, but the check could not be completed. */
  protected readonly unavailable = computed(
    () => this.auth.isSignedIn() && this.auth.accessState() === 'unavailable',
  );

  protected signOut(): void {
    this.auth.signOut();
  }

  /** Re-runs the check without making the trustee sign in again. */
  protected retry(): void {
    void this.auth.verifyTrustee(true).then((isTrustee) => {
      if (isTrustee) {
        void this.router.navigate(['/admin/enquiries']);
      }
    });
  }

  constructor() {
    // Send a verified trustee straight through to their inbox.
    //
    // The check has to happen before navigating, not after. Redirecting on
    // isSignedIn() alone would bounce a non-trustee off the guard and back to
    // this page, which would redirect again — a loop with no way out but
    // closing the tab.
    effect(() => {
      if (!this.auth.isSignedIn()) {
        return;
      }
      void this.auth.verifyTrustee().then((isTrustee) => {
        if (isTrustee) {
          void this.router.navigate(['/admin/enquiries']);
        }
      });
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.auth.renderSignInButton(this.googleButton().nativeElement);
    } catch {
      this.error.set(
        'Google sign-in is not configured yet. Set googleClientId in the environment file to the client ID from Terraform, then rebuild.',
      );
    }
  }
}
