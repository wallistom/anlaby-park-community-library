import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-cta-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="container-page mt-20 mb-4 sm:mt-24">
      <div
        class="band-inverse shadow-raised rounded-2xl px-6 py-12 sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-16 lg:px-14"
      >
        <div class="max-w-2xl">
          <h2 class="text-3xl font-bold text-white sm:text-4xl">{{ heading() }}</h2>
          <p class="text-ink-on-dark mt-4 max-w-xl text-lg leading-relaxed">{{ body() }}</p>
        </div>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0 lg:flex-col">
          <a [routerLink]="primaryPath()" class="btn-on-dark">
            {{ primaryLabel() }}
            <app-icon name="arrowRight" [size]="18" />
          </a>
          @if (secondaryPath() && secondaryLabel()) {
            <a [routerLink]="secondaryPath()" class="btn-on-dark-secondary">
              {{ secondaryLabel() }}
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class CtaBandComponent {
  readonly heading = input.required<string>();
  readonly body = input.required<string>();
  readonly primaryLabel = input.required<string>();
  readonly primaryPath = input.required<string>();
  readonly secondaryLabel = input<string>();
  readonly secondaryPath = input<string>();
}
