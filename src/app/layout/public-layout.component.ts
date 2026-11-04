import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { FooterComponent } from './footer.component';
import { IconComponent } from '../shared/icon.component';
import { OpeningHoursService } from '../core/opening-hours.service';

@Component({
  selector: 'app-public-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, HeaderComponent, FooterComponent, IconComponent],
  template: `
    <a
      href="#main-content"
      class="bg-inverse sr-only rounded-br-xl px-5 py-3 font-semibold text-white focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[60]"
    >
      Skip to main content
    </a>

    @if (notice().active && noticeVisible()) {
      <div class="bg-orange-100 text-orange-950 border-orange-200 border-b">
        <div
          class="mx-auto flex max-w-6xl items-start gap-3 px-5 py-2.5 text-sm sm:items-center sm:px-8"
        >
          <span class="text-orange-700 mt-0.5 sm:mt-0"><app-icon name="info" [size]="18" /></span>
          <p class="flex-1">
            <strong class="font-semibold">{{ notice().title }}.</strong>
            <span class="sm:inline" [class.hidden]="!noticeExpanded()">
              {{ notice().body }}
              <a routerLink="/contact" class="font-semibold underline underline-offset-2">
                Any questions? Get in touch
              </a>
            </span>
            @if (!noticeExpanded()) {
              <button
                type="button"
                class="-my-3 ml-1 py-3 font-semibold underline underline-offset-2 sm:hidden"
                (click)="noticeExpanded.set(true)"
              >
                Read more
              </button>
            }
          </p>
          <button
            type="button"
            class="hover:bg-orange-200 -my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            (click)="noticeVisible.set(false)"
          >
            <span class="sr-only">Dismiss this notice</span>
            <app-icon name="close" [size]="18" />
          </button>
        </div>
      </div>
    }

    <app-header />

    <main id="main-content" tabindex="-1">
      <router-outlet />
    </main>

    <app-footer />
  `,
})
export class PublicLayoutComponent {
  private readonly hours = inject(OpeningHoursService);
  protected readonly notice = this.hours.notice;

  constructor() {
    this.hours.load();
  }
  protected readonly noticeVisible = signal(true);
  protected readonly noticeExpanded = signal(false);
}
