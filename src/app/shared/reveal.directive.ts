import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Fades an element up as it scrolls into view.
 *
 * Elements start hidden only once the observer is confirmed to be running, so
 * content stays visible if IntersectionObserver is unavailable or JavaScript
 * fails part-way. The animation itself is disabled by the reduced-motion rule
 * in styles.css.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements OnInit, OnDestroy {
  /** Stagger, in milliseconds, applied before the element animates in. */
  readonly appReveal = input<number>(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly visible = signal(false);
  private observer?: IntersectionObserver;

  constructor() {
    effect(() => {
      const element = this.host.nativeElement;
      if (!this.visible()) {
        return;
      }
      element.style.animationDelay = `${this.appReveal()}ms`;
      element.classList.remove('reveal-pending');
      element.classList.add('reveal-visible');
    });
  }

  ngOnInit(): void {
    const element = this.host.nativeElement;

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    element.classList.add('reveal-pending');

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visible.set(true);
            this.observer?.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
