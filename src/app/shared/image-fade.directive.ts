import { Directive, ElementRef, HostListener, OnInit, inject } from '@angular/core';

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

  @HostListener('error')
  protected onError(): void {
    this.reveal();
  }

  private reveal(): void {
    this.host.nativeElement.classList.add('is-loaded');
  }
}
