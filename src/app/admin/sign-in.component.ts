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
import { environment } from '../../environments/environment';

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

        <h1 class="mt-6 text-center text-2xl font-bold">Trustee sign in</h1>
        <p class="text-ink-soft mt-2 text-center">
          This area is for {{ site.shortName }} trustees. Sign in with the Google account you gave
          to the Secretary.
        </p>

        <div
          class="mt-8 flex justify-center"
          [hidden]="refused() || unavailable() || checking()"
          #googleButton
        ></div>

        @if (checking()) {
          <p
            class="text-ink-soft mt-8 flex items-center justify-center gap-3 text-sm"
            aria-live="polite"
          >
            <span
              class="border-line-strong border-t-navy-800 h-5 w-5 animate-spin rounded-full border-2"
              aria-hidden="true"
            ></span>
            Checking your account…
          </p>
        }

        @if (refused()) {
          <div class="mt-8 alert-danger" role="alert">
            <app-icon name="info" [size]="19" />
            <div class="text-sm">
              <p>
                <strong class="font-semibold break-all">{{ auth.currentUser()?.email }}</strong>
                is not on the list of trustee accounts, so it cannot open the trustee area.
              </p>
              <p class="mt-2">
                If you have another Google account, try that one. If this is the one you gave to the
                Secretary, ask them to check it has been added.
              </p>
            </div>
          </div>

          <button type="button" class="btn-secondary mt-5 w-full" (click)="useAnotherAccount()">
            Use a different Google account
          </button>
        }

        @if (unavailable()) {
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
            <div class="text-sm">
              <p>{{ error() }}</p>
              @if (environment.googleClientId) {
                <button type="button" class="btn-secondary btn-sm mt-3" (click)="reload()">
                  Reload the page
                </button>
              }
            </div>
          </div>
        }

        @if (!refused() && !unavailable() && !checking()) {
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
  protected readonly environment = environment;
  protected readonly error = signal<string | null>(null);

  protected readonly refused = computed(
    () => this.auth.isSignedIn() && this.auth.accessState() === 'denied',
  );

  protected readonly checking = computed(
    () => this.auth.isSignedIn() && this.auth.accessState() === 'checking',
  );

  protected readonly unavailable = computed(
    () => this.auth.isSignedIn() && this.auth.accessState() === 'unavailable',
  );

  /** Forgets the refused account in this tab and brings the Google button back. */
  protected useAnotherAccount(): void {
    this.auth.signOut();
  }

  protected reload(): void {
    window.location.reload();
  }

  protected retry(): void {
    void this.auth.verifyTrustee(true).then((isTrustee) => {
      if (isTrustee) {
        void this.router.navigate(['/admin/dashboard']);
      }
    });
  }

  constructor() {
    effect(() => {
      if (!this.auth.isSignedIn()) {
        return;
      }
      void this.auth.verifyTrustee().then((isTrustee) => {
        if (isTrustee) {
          void this.router.navigate(['/admin/dashboard']);
        }
      });
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.auth.renderSignInButton(this.googleButton().nativeElement);
    } catch {
      // Without a client ID this is a set-up mistake; with one, Google's script did not load.
      this.error.set(
        environment.googleClientId
          ? 'We could not reach Google sign-in just now. Check your connection and reload the page. If it keeps happening, a privacy or ad-blocking extension may be stopping it.'
          : 'Google sign-in is not configured yet. Set googleClientId in the environment file to the client ID from Terraform, then rebuild.',
      );
    }
  }
}
