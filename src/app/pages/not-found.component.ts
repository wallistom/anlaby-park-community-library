import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { SITE } from '../core/site.data';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="container-page py-24 text-center sm:py-32">
      <span
        class="bg-forest-50 text-forest-600 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl"
      >
        <app-icon name="search" [size]="36" />
      </span>

      <p class="text-ochre-700 mt-8 text-xs font-semibold tracking-[0.18em] uppercase">Error 404</p>
      <h1 class="mt-3 text-4xl font-semibold sm:text-5xl">We can't find that page</h1>
      <p class="prose-body mx-auto mt-5 max-w-xl">
        It may have moved, or the link might be out of date. Have a look at the pages below, or ring
        us and we will point you in the right direction.
      </p>

      <div class="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <a routerLink="/" class="btn-primary">
          Back to the home page
          <app-icon name="arrowRight" [size]="18" />
        </a>
        <a
          [href]="'tel:' + site.phoneHref"
          class="border-line-strong hover:bg-surface inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 font-semibold transition-colors"
        >
          <app-icon name="phone" [size]="18" />
          {{ site.phone }}
        </a>
      </div>

      <ul class="mt-12 flex flex-wrap justify-center gap-3">
        @for (link of quickLinks; track link.path) {
          <li>
            <a
              [routerLink]="link.path"
              class="border-line-strong text-ink-soft hover:border-forest-400 inline-block rounded-full border bg-surface px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              {{ link.label }}
            </a>
          </li>
        }
      </ul>
    </section>
  `,
})
export class NotFoundComponent {
  protected readonly site = SITE;

  protected readonly quickLinks = [
    { label: "What's On", path: '/whats-on' },
    { label: 'Activities', path: '/activities' },
    { label: 'Visit Us', path: '/visit' },
    { label: 'Room Hire', path: '/room-hire' },
    { label: 'Volunteer', path: '/volunteer' },
    { label: 'Contact', path: '/contact' },
  ];
}
