import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';

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
    inject(ViewportScroller).setOffset([0, 96]);

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
