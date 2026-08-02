import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
          class="bg-forest-50 text-forest-700 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        >
          <app-icon name="key" [size]="26" />
        </span>

        <h1 class="mt-6 text-center text-2xl font-semibold">Trustee sign in</h1>
        <p class="text-ink-soft mt-2 text-center">
          This area is for {{ site.shortName }} trustees. Sign in with the Google account you gave
          to the Secretary.
        </p>

        <!-- Google renders its own button into this element. -->
        <div class="mt-8 flex justify-center" #googleButton></div>

        @if (error()) {
          <div class="mt-6 alert-danger" role="alert">
            <app-icon name="info" [size]="19" />
            <p class="text-sm">{{ error() }}</p>
          </div>
        }

        <p class="text-ink-muted mt-8 text-center text-xs">
          Only approved accounts can get in. If yours is not working, speak to the Secretary.
        </p>
      </div>
    </div>
  `,
})
export class SignInComponent implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly site = SITE;
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Send an already-signed-in trustee straight through to their inbox.
    effect(() => {
      if (this.auth.isSignedIn()) {
        void this.router.navigate(['/admin/enquiries']);
      }
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
