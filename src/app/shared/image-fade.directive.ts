import { Directive, ElementRef, HostListener, OnInit, inject } from '@angular/core';

/**
 * Fades a photograph in once it has decoded, instead of letting it snap into
 * place.
 *
 * Images that are already in the browser cache complete before Angular binds
 * the load handler, so `complete` is checked up front — otherwise a cached
 * photo would stay invisible forever.
 */
@Directive({
  selector: 'img[appImageFade]',
  host: { class: 'img-fade' },
})
export class ImageFadeDirective implements OnInit {
  private readonly host = inject<ElementRef<HTMLImageElement>>(ElementRef);

  ngOnInit(): void {
    if (this.host.nativeElement.complete) {
      this.reveal();
    }
  }

  @HostListener('load')
  protected onLoad(): void {
    this.reveal();
  }

  /** A broken image should still not leave an invisible gap. */
  @HostListener('error')
  protected onError(): void {
    this.reveal();
  }

  private reveal(): void {
    this.host.nativeElement.classList.add('is-loaded');
  }
}
