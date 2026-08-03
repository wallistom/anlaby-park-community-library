import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Standard banner at the top of every interior page.
 *
 * A pale blue band rather than a full-bleed dark one: a saturated block on
 * every page made the site feel heavier than a community library should. Navy
 * is reserved for the footer and the support call to action, where it carries
 * meaning.
 *
 * It must not be white. The header is white, so a white banner beneath it left
 * nothing to mark where the chrome ended and the page began.
 */
@Component({
  selector: 'app-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-line bg-sunken border-b">
      <div class="container-page py-14 sm:py-16">
        @if (eyebrow()) {
          <p class="eyebrow">{{ eyebrow() }}</p>
        }
        <h1 class="mt-2 max-w-3xl text-4xl font-semibold sm:text-5xl">{{ heading() }}</h1>
        @if (intro()) {
          <p class="prose-body mt-5 max-w-2xl">{{ intro() }}</p>
        }
        <ng-content />
      </div>
    </section>
  `,
})
export class PageHeroComponent {
  readonly eyebrow = input<string>();
  readonly heading = input.required<string>();
  readonly intro = input<string>();
}
