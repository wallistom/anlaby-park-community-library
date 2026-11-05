import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent, IconName } from '../shared/icon.component';
import { AuthService } from '../core/auth.service';
import { OpeningHoursService } from '../core/opening-hours.service';
import { SITE } from '../core/site.data';

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <a
      href="#admin-main"
      class="bg-inverse sr-only rounded-br-xl px-5 py-3 font-semibold text-white focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[60]"
    >
      Skip to main content
    </a>

    <div class="bg-sunken flex min-h-screen flex-col">
      <header class="bg-navy-950 text-white" (keydown.escape)="menuOpen.set(false)">
        <div
          class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:px-8"
        >
          <a
            [routerLink]="isTrustee() ? '/admin/dashboard' : '/'"
            class="flex min-h-11 items-center gap-3"
          >
            <span
              class="bg-orange-500 text-navy-950 flex h-9 w-9 items-center justify-center rounded-lg"
            >
              <app-icon name="bookOpen" [size]="18" />
            </span>
            <span class="leading-tight">
              <span class="font-display block text-sm font-semibold">{{ site.shortName }}</span>
              <span class="text-ink-on-dark-muted block text-xs tracking-[0.14em] uppercase">
                Trustee area
              </span>
            </span>
          </a>

          @if (isTrustee()) {
            <button
              type="button"
              class="border-line-inverse hover:bg-navy-900 ml-auto flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:hidden"
              aria-controls="admin-menu"
              [attr.aria-expanded]="menuOpen()"
              (click)="menuOpen.set(!menuOpen())"
            >
              <app-icon [name]="menuOpen() ? 'close' : 'menu'" [size]="18" />
              Menu
            </button>

            <!-- One set of links: a drop-down list on phones, the usual bar from sm up. -->
            <div id="admin-menu" class="w-full sm:contents" [class.hidden]="!menuOpen()">
              <nav
                class="flex flex-col gap-1 py-2 sm:order-3 sm:w-full sm:flex-row sm:flex-wrap sm:py-0 lg:order-none lg:w-auto"
                aria-label="Trustee area"
              >
                @for (item of navItems; track item.path) {
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="!bg-navy-800 !text-white"
                    ariaCurrentWhenActive="page"
                    (click)="menuOpen.set(false)"
                    class="text-ink-on-dark-muted hover:bg-navy-900 flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <app-icon [name]="item.icon" [size]="16" />
                    {{ item.label }}
                  </a>
                }
              </nav>

              <div
                class="border-line-inverse flex flex-wrap items-center gap-3 border-t py-3 sm:ml-auto sm:border-0 sm:py-0"
              >
                <a
                  href="/"
                  target="_blank"
                  rel="noopener"
                  class="text-ink-on-dark-muted inline-flex min-h-11 w-full items-center gap-1.5 px-3 text-sm font-medium underline-offset-4 hover:text-white hover:underline sm:w-auto sm:px-0"
                >
                  <app-icon name="externalLink" [size]="15" />
                  View the website
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
                <span
                  class="text-ink-on-dark min-w-0 flex-1 px-3 text-sm sm:hidden sm:flex-none sm:px-0 md:block"
                >
                  <span class="text-ink-on-dark-muted sm:hidden">Signed in as </span>
                  {{ auth.currentUser()?.name }}
                </span>
                <button
                  type="button"
                  (click)="signOut()"
                  class="border-line-inverse hover:bg-navy-900 flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                >
                  <app-icon name="logOut" [size]="16" />
                  Sign out
                </button>
              </div>
            </div>
          } @else {
            <a
              routerLink="/"
              class="text-ink-on-dark-muted ml-auto inline-flex min-h-11 items-center text-sm underline-offset-4 hover:text-white hover:underline"
            >
              Back to the website
            </a>
          }
        </div>
      </header>

      <main
        id="admin-main"
        tabindex="-1"
        class="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8"
      >
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly hours = inject(OpeningHoursService);

  protected readonly site = SITE;
  protected readonly menuOpen = signal(false);

  protected readonly isTrustee = computed(
    () => this.auth.isSignedIn() && this.auth.accessState() === 'allowed',
  );

  protected readonly navItems: { label: string; path: string; icon: IconName }[] = [
    { label: 'Overview', path: '/admin/dashboard', icon: 'bookOpen' },
    { label: 'Events', path: '/admin/events', icon: 'calendar' },
    { label: 'Enquiries', path: '/admin/enquiries', icon: 'inbox' },
    { label: 'Opening hours', path: '/admin/hours', icon: 'clock' },
    { label: 'Who can sign in', path: '/admin/trustees', icon: 'users' },
  ];

  constructor() {
    this.hours.load();
  }

  protected signOut(): void {
    this.menuOpen.set(false);
    this.auth.signOut();
    void this.router.navigate(['/admin']);
  }
}
