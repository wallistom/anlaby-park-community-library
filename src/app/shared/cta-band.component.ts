import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';

/** Closing call to action used at the foot of most pages. */
@Component({
  selector: 'app-cta-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="container-page mt-20 mb-4">
      <div class="bg-inverse rounded-2xl px-8 py-14 text-center sm:px-12">
        <h2 class="mx-auto max-w-2xl text-3xl font-semibold text-white sm:text-4xl">
          {{ heading() }}
        </h2>
        <p class="text-ink-on-dark mx-auto mt-5 max-w-xl text-lg leading-relaxed">{{ body() }}</p>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
