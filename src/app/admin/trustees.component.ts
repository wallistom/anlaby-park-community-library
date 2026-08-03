import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { TrusteeAccount } from '../core/models';

/**
 * Who can use the admin area.
 *
 * This exists so the charity does not have to ask an engineer every time a
 * trustee joins or leaves. Before it, the allowlist was an environment variable
 * set by Terraform, so every change needed somebody with AWS credentials — fine
 * during the build, a bottleneck for a volunteer board.
 *
 * The screen is deliberately plain. Adding somebody is two fields, and removing
 * them is one button with a confirmation.
 */
@Component({
  selector: 'app-trustees',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, IconComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold">Who can sign in</h1>
        <p class="text-ink-soft mt-2 max-w-2xl">
          Anyone listed here can manage events, opening hours, and enquiries. Add people using the
          Google address they will sign in with.
        </p>
      </div>
    </div>

    @if (error(); as message) {
      <div class="mt-6 alert-danger" role="alert">
        <app-icon name="info" [size]="19" />
        <p class="text-sm">{{ message }}</p>
      </div>
    }

    <!-- ── Add ──────────────────────────────────────────────────────────── -->
    <form class="card mt-8 p-6 sm:p-7" (ngSubmit)="add()">
      <h2 class="font-display text-lg font-semibold">Add a trustee</h2>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field-label" for="trustee-name">Their name</label>
          <input
            id="trustee-name"
            name="name"
            class="field-input"
            [(ngModel)]="name"
            autocomplete="off"
            required
          />
        </div>
        <div>
          <label class="field-label" for="trustee-email">Their Google address</label>
          <input
            id="trustee-email"
            name="email"
            type="email"
            class="field-input"
            [(ngModel)]="email"
            autocomplete="off"
            required
          />
        </div>
      </div>

      <p class="text-ink-muted mt-3 text-sm">
        It must be the address they use to sign in to Google. Nothing is sent to it — tell them
        yourself that they can now get in.
      </p>

      <button type="submit" class="btn-primary mt-5" [disabled]="saving()">
        {{ saving() ? 'Adding…' : 'Add trustee' }}
      </button>
    </form>

    <!-- ── List ─────────────────────────────────────────────────────────── -->
    <h2 class="font-display mt-10 text-lg font-semibold">
      Trustees
      @if (trustees().length) {
        <span class="text-ink-muted font-sans text-base font-normal">
          · {{ trustees().length }}
        </span>
      }
    </h2>

    @if (loading()) {
      <ul class="mt-4 flex flex-col gap-3" aria-hidden="true">
        @for (row of [1, 2, 3]; track row) {
          <li class="card flex items-center gap-4 p-5">
            <div class="bg-line h-10 w-10 shrink-0 animate-pulse rounded-full"></div>
            <div class="flex flex-1 flex-col gap-2">
              <div class="bg-line h-4 w-40 animate-pulse rounded"></div>
              <div class="bg-line h-3 w-56 animate-pulse rounded"></div>
            </div>
          </li>
        }
      </ul>
      <p class="sr-only" aria-live="polite">Loading trustees</p>
    } @else if (trustees().length) {
      <ul class="mt-4 flex flex-col gap-3">
        @for (trustee of trustees(); track trustee.email) {
          <li class="card flex flex-wrap items-center gap-4 p-5">
            <span
              class="bg-blue-100 text-navy-800 font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold"
              aria-hidden="true"
            >
              {{ initial(trustee) }}
            </span>

            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="font-semibold">{{ trustee.name }}</span>
                @if (trustee.isYou) {
                  <span class="chip-accent">You</span>
                }
              </span>
              <span class="text-ink-muted block text-sm break-all">{{ trustee.email }}</span>
              @if (trustee.addedAt) {
                <span class="text-ink-muted block text-xs">
                  Added {{ trustee.addedAt | date: 'd MMMM y' }}
                  @if (trustee.addedBy) {
                    by {{ trustee.addedBy }}
                  }
                </span>
              }
            </span>

            @if (trustee.isYou) {
              <!-- Removing yourself is the usual way a board ends up with
                   nobody who can get in, so it is not offered. -->
              <span class="text-ink-muted text-sm">Ask another trustee to remove you</span>
            } @else if (confirming() === trustee.email) {
              <span class="flex items-center gap-2">
                <button
                  type="button"
                  class="border-danger-line text-danger hover:bg-danger-soft flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40"
                  [disabled]="removing()"
                  (click)="remove(trustee)"
                >
                  {{ removing() ? 'Removing…' : 'Yes, remove' }}
                </button>
                <button type="button" class="btn-secondary btn-sm" (click)="confirming.set(null)">
                  Cancel
                </button>
              </span>
            } @else {
              <button
                type="button"
                class="btn-secondary btn-sm"
                [disabled]="trustees().length <= 1"
                (click)="confirming.set(trustee.email)"
              >
                Remove
              </button>
            }
          </li>
        }
      </ul>

      <p class="text-ink-muted mt-4 text-sm">
        Removing somebody takes up to five minutes to take effect. If an account has been lost or
        stolen, remove it here and then tell Tom, who can cut it off immediately.
      </p>
    } @else {
      <p class="text-ink-soft mt-4">
        Nobody has been added yet. You are signed in with a recovery account held outside this list
        — add the trustees who should have access.
      </p>
    }
  `,
})
export class TrusteesComponent {
  private readonly api = inject(ApiService);

  protected readonly trustees = signal<TrusteeAccount[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly removing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirming = signal<string | null>(null);

  protected name = '';
  protected email = '';

  constructor() {
    this.load();
  }

  protected initial(trustee: TrusteeAccount): string {
    return (trustee.name || trustee.email).trim().charAt(0).toUpperCase();
  }

  protected add(): void {
    const name = this.name.trim();
    const email = this.email.trim().toLowerCase();
    if (!name || !email) {
      this.error.set('Both a name and an address are needed.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.api.addTrustee({ name, email }).subscribe({
      next: () => {
        this.name = '';
        this.email = '';
        this.saving.set(false);
        this.load();
      },
      error: (response: { error?: { error?: string } }) => {
        this.saving.set(false);
        this.error.set(response.error?.error ?? 'We could not add that person.');
      },
    });
  }

  protected remove(trustee: TrusteeAccount): void {
    this.removing.set(true);
    this.error.set(null);
    this.api.removeTrustee(trustee.email).subscribe({
      next: () => {
        this.removing.set(false);
        this.confirming.set(null);
        this.load();
      },
      error: (response: { error?: { error?: string } }) => {
        this.removing.set(false);
        this.confirming.set(null);
        this.error.set(response.error?.error ?? 'We could not remove that person.');
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.listTrustees().subscribe({
      next: (trustees) => {
        this.trustees.set(trustees);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load the trustee list.');
      },
    });
  }
}
