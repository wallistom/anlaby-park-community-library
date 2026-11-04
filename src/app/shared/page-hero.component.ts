import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BookShelfComponent } from './book-shelf.component';

@Component({
  selector: 'app-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BookShelfComponent],
  host: { class: 'block' },
  template: `
    <section class="band-hero">
      <app-book-shelf
        class="hero-rise pointer-events-none absolute right-[6%] bottom-0 hidden w-[19rem] xl:block 2xl:w-[21rem]"
        style="--rise-delay: 240ms"
      />
      <div class="container-page relative pt-12 pb-14 sm:pt-16 sm:pb-20">
        @if (eyebrow()) {
          <p class="eyebrow hero-rise">{{ eyebrow() }}</p>
        }
        <h1
          class="hero-rise max-w-3xl text-4xl font-bold sm:text-5xl lg:text-6xl"
          style="--rise-delay: 60ms"
        >
          {{ heading() }}
        </h1>
        @if (intro()) {
          <p class="lead hero-rise mt-6 max-w-2xl" style="--rise-delay: 150ms">{{ intro() }}</p>
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
