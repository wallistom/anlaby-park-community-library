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

@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements OnInit, OnDestroy {
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
      element.style.setProperty('--reveal-delay', `${this.appReveal()}ms`);
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
      (entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visible.set(true);
            observer.disconnect();
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
