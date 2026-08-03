import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';

/**
 * Root shell, plus a thin progress bar across the top during navigation.
 *
 * Angular renders nothing while an async `canActivate` resolves, and the admin
 * guard asks the API whether the account is a trustee. On a cold Lambda, or a
 * poor connection, that left a completely blank page for a second or more with
 * nothing to say it was working — which reads as a broken link rather than a
 * wait.
 *
 * Deliberately not shown for quick navigations: appearing and vanishing inside
 * 150ms is a flicker, and a flicker is worse than nothing.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    @if (navigating()) {
      <div class="route-progress bg-navy-800 fixed inset-x-0 top-0 z-[70] h-1" role="status">
        <span class="sr-only">Loading</span>
      </div>
    }
    <router-outlet />
  `,
})
export class App {
  private readonly router = inject(Router);

  protected readonly navigating = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.navigating.set(true), 150);
        return;
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        clearTimeout(this.timer);
        this.navigating.set(false);
      }
    });
  }
}
