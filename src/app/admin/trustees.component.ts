import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { TrusteeAccount } from '../core/models';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-trustees',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, IconComponent],
  template: `
    <h1 class="text-3xl font-bold">Who can sign in</h1>
    <p class="text-ink-soft mt-2 max-w-2xl">
      Anyone listed here can manage events, opening hours, and enquiries. Add people using the
      Google address they will sign in with.
    </p>

    @if (notice(); as message) {
      <div class="alert-success mt-6 items-center py-2 pr-2" role="status">
        <app-icon name="checkCircle" [size]="20" />
        <p class="min-w-0 flex-1 py-1.5 text-sm">{{ message }}</p>
        <button type="button" (click)="notice.set(null)" class="alert-dismiss">
          <app-icon name="close" [size]="16" />
          <span class="sr-only">Dismiss this message</span>
        </button>
      </div>
    }

    <form class="card mt-8 p-6 sm:p-7" (ngSubmit)="add()" novalidate>
      <h2 class="font-sans text-lg font-semibold">Add a trustee</h2>
      <p class="text-ink-soft mt-1 max-w-xl text-sm">
        It must be the address they use to sign in to Google. Nothing is sent to it, so tell them
        yourself that they can now get in.
      </p>

      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="field-label" for="trustee-name">Their name</label>
          <input
            #nameInput
            id="trustee-name"
            name="name"
            class="field-input"
            [(ngModel)]="name"
            autocomplete="off"
            [attr.aria-invalid]="!!nameError()"
            [attr.aria-describedby]="nameError() ? 'trustee-name-error' : null"
          />
          @if (nameError(); as message) {
            <p id="trustee-name-error" class="field-error">
              <app-icon name="info" [size]="16" />
              {{ message }}
            </p>
          }
        </div>
        <div>
          <label class="field-label" for="trustee-email">Their Google address</label>
          <input
            #emailInput
            id="trustee-email"
            name="email"
            type="email"
            class="field-input"
            [(ngModel)]="email"
            autocomplete="off"
            spellcheck="false"
            [attr.aria-invalid]="!!emailError()"
            [attr.aria-describedby]="emailError() ? 'trustee-email-error' : null"
          />
          @if (emailError(); as message) {
            <p id="trustee-email-error" class="field-error">
              <app-icon name="info" [size]="16" />
              {{ message }}
            </p>
          }
        </div>
      </div>

      @if (addError(); as message) {
        <div class="alert-danger mt-5" role="alert">
          <app-icon name="info" [size]="19" />
          <p class="text-sm">{{ message }}</p>
        </div>
      }

      <button type="submit" class="btn-primary mt-5" [disabled]="saving()">
        <app-icon name="plus" [size]="18" />
        {{ saving() ? 'Adding…' : 'Add trustee' }}
      </button>
    </form>

    @if (loading()) {
      <div class="card mt-6 overflow-hidden" aria-hidden="true">
        <div class="flex flex-col gap-2.5 px-5 py-5 sm:px-6">
          <span class="skeleton h-6 w-40"></span>
          <span class="skeleton h-4 w-80 max-w-full"></span>
        </div>
        <ul class="divide-line border-line divide-y border-t">
          @for (row of [1, 2, 3]; track row) {
            <li class="flex items-center gap-4 px-5 py-4 sm:px-6">
              <span class="skeleton h-10 w-10 shrink-0 rounded-full"></span>
              <span class="flex flex-1 flex-col gap-2">
                <span class="skeleton h-4 w-40"></span>
                <span class="skeleton h-3 w-56 max-w-full"></span>
              </span>
            </li>
          }
        </ul>
      </div>
      <p class="sr-only" aria-live="polite">Loading trustees</p>
    } @else if (loadFailed()) {
      <div class="alert-danger mt-6" role="alert">
        <app-icon name="info" [size]="20" />
        <div class="text-sm">
          <p class="font-semibold">We could not load the trustee list</p>
          <p class="mt-1">
            Nothing has been changed. Check your connection and try again. If it keeps happening,
            sign out and back in.
          </p>
          <button type="button" (click)="load()" class="btn-secondary btn-sm mt-3">
            Try again
          </button>
        </div>
      </div>
    } @else {
      <section class="card mt-6 overflow-hidden" aria-labelledby="trustees-heading">
        <div class="px-5 py-5 sm:px-6">
          <h2 id="trustees-heading" class="font-sans text-lg font-semibold">
            Trustees
            @if (trustees().length) {
              <span class="text-ink-muted text-base font-normal">· {{ trustees().length }}</span>
            }
          </h2>
          <p class="text-ink-soft mt-1 max-w-2xl text-sm">
            Removing somebody takes up to five minutes to take effect. If an account has been lost
            or stolen, remove it here and then tell Tom, who can cut it off immediately.
          </p>
        </div>

        @if (trustees().length) {
          <ul class="divide-line border-line divide-y border-t">
            @for (trustee of trustees(); track trustee.email) {
              <li
                class="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 transition-opacity sm:px-6"
                [class.opacity-55]="removingEmail() === trustee.email"
              >
                <span
                  class="bg-blue-100 text-navy-800 font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold"
                  aria-hidden="true"
                >
                  {{ initial(trustee) }}
                </span>

                <span class="min-w-0 flex-1 basis-48">
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
                  <span class="text-ink-muted text-sm">Another trustee can remove you</span>
                } @else if (trustees().length <= 1) {
                  <span class="text-ink-muted text-sm">The last trustee cannot be removed</span>
                } @else if (removingEmail() === trustee.email) {
                  <span
                    class="text-ink-muted inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                    role="status"
                  >
                    <span class="spinner" aria-hidden="true"></span>
                    Removing…
                  </span>
                } @else if (confirming() === trustee.email) {
                  <div
                    class="flex flex-wrap items-center gap-2"
                    role="group"
                    aria-label="Confirm removal"
                  >
                    <span class="text-sm font-semibold">Remove {{ trustee.name }}?</span>
                    <button type="button" class="btn-danger-outline" (click)="remove(trustee)">
                      Yes, remove
                    </button>
                    <button
                      type="button"
                      class="btn-secondary btn-sm"
                      (click)="confirming.set(null)"
                    >
                      Keep
                    </button>
                  </div>
                } @else {
                  <button
                    type="button"
                    class="row-action-danger"
                    [disabled]="removingEmail() !== null"
                    (click)="confirming.set(trustee.email)"
                  >
                    <app-icon name="trash" [size]="15" />
                    Remove<span class="sr-only"> {{ trustee.name }}</span>
                  </button>
                }

                @if (removeError()?.email === trustee.email) {
                  <p class="field-error w-full" role="alert">
                    <app-icon name="info" [size]="16" />
                    {{ removeError()?.message }}
                  </p>
                }
              </li>
            }
          </ul>
        } @else {
          <div class="empty-state">
            <span class="empty-state-icon"><app-icon name="users" [size]="22" /></span>
            <div class="min-w-0 flex-1 basis-60">
              <p class="text-ink font-semibold">Nobody has been added yet</p>
              <p class="text-ink-soft mt-0.5 text-sm">
                You are signed in with a recovery account held outside this list. Add the trustees
                who should have access.
              </p>
            </div>
          </div>
        }
      </section>
    }
  `,
})
export class TrusteesComponent {
  private readonly api = inject(ApiService);
  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');
  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');

  protected readonly trustees = signal<TrusteeAccount[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly addError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly confirming = signal<string | null>(null);
  protected readonly removingEmail = signal<string | null>(null);
  protected readonly removeError = signal<{ email: string; message: string } | null>(null);

  /** Mirrors the inputs, so field errors can update as the trustee types. */
  private readonly nameValue = signal('');
  private readonly emailValue = signal('');

  protected get name(): string {
    return this.nameValue();
  }
  protected set name(value: string) {
    this.nameValue.set(value);
  }
  protected get email(): string {
    return this.emailValue();
  }
  protected set email(value: string) {
    this.emailValue.set(value);
  }

  protected readonly nameError = computed(() =>
    this.submitted() && !this.nameValue().trim() ? 'Please give their name.' : null,
  );

  protected readonly emailError = computed(() => {
    if (!this.submitted()) {
      return null;
    }
    const email = this.emailValue().trim().toLowerCase();
    if (!email) {
      return 'Please give the Google address they sign in with.';
    }
    if (!EMAIL_PATTERN.test(email)) {
      return 'That does not look like a full address. It should be like name@gmail.com.';
    }
    if (this.trustees().some((trustee) => trustee.email === email)) {
      return `${email} can already sign in.`;
    }
    return null;
  });

  constructor() {
    this.load();
  }

  protected initial(trustee: TrusteeAccount): string {
    return (trustee.name || trustee.email).trim().charAt(0).toUpperCase();
  }

  protected add(): void {
    this.submitted.set(true);
    this.addError.set(null);
    if (this.nameError()) {
      this.nameInput().nativeElement.focus();
      return;
    }
    if (this.emailError()) {
      this.emailInput().nativeElement.focus();
      return;
    }

    const name = this.nameValue().trim();
    const email = this.emailValue().trim().toLowerCase();
    this.saving.set(true);
    this.notice.set(null);
    this.api.addTrustee({ name, email }).subscribe({
      next: (added) => {
        this.name = '';
        this.email = '';
        this.submitted.set(false);
        this.saving.set(false);
        this.trustees.update((list) => [...list, added]);
        this.notice.set(
          `${added.name} can now sign in with ${added.email}. Nothing has been sent to them, so let them know.`,
        );
      },
      error: (response: { error?: { error?: string } }) => {
        this.saving.set(false);
        this.addError.set(
          response.error?.error ??
            'We could not add that person. Check your connection and try again.',
        );
      },
    });
  }

  protected remove(trustee: TrusteeAccount): void {
    this.confirming.set(null);
    this.removeError.set(null);
    this.notice.set(null);
    this.removingEmail.set(trustee.email);
    this.api.removeTrustee(trustee.email).subscribe({
      next: () => {
        this.removingEmail.set(null);
        this.trustees.update((list) => list.filter((entry) => entry.email !== trustee.email));
        this.notice.set(`${trustee.name} has been removed. They lose access within five minutes.`);
      },
      error: (response: { error?: { error?: string } }) => {
        this.removingEmail.set(null);
        this.removeError.set({
          email: trustee.email,
          message:
            response.error?.error ??
            'We could not remove them. Check your connection and try again.',
        });
      },
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.listTrustees().subscribe({
      next: (trustees) => {
        this.trustees.set(trustees);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(true);
      },
    });
  }
}
