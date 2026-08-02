import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { FooterComponent } from './footer.component';
import { IconComponent } from '../shared/icon.component';
import { SITE_NOTICE } from '../core/site.data';

/** Chrome shared by every public page: skip link, notice, header, footer. */
@Component({
  selector: 'app-public-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, HeaderComponent, FooterComponent, IconComponent],
  template: `
    <a
      href="#main-content"
      class="bg-inverse focus:ring-ochre-400 sr-only rounded-br-xl px-5 py-3 font-semibold text-white focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[60]"
    >
      Skip to main content
    </a>

    @if (notice.active && noticeVisible()) {
      <div class="bg-ochre-100 text-ochre-950 border-ochre-200 border-b">
        <div
          class="mx-auto flex max-w-7xl items-start gap-3 px-5 py-3 text-sm sm:items-center sm:px-8"
        >
          <span class="text-ochre-700 mt-0.5 sm:mt-0"><app-icon name="info" [size]="18" /></span>
          <p class="flex-1">
            <strong class="font-semibold">{{ notice.title }}.</strong>
            {{ notice.body }}
            <a [routerLink]="notice.linkPath" class="font-semibold underline underline-offset-2">
              {{ notice.linkText }}
            </a>
          </p>
          <button
            type="button"
            class="hover:bg-ochre-200 -my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
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
  protected readonly notice = SITE_NOTICE;
  protected readonly noticeVisible = signal(true);
}
