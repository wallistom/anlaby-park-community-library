import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'book'
  | 'headphones'
  | 'search'
  | 'monitor'
  | 'printer'
  | 'coffee'
  | 'school'
  | 'heart'
  | 'accessible'
  | 'menu'
  | 'close'
  | 'arrowRight'
  | 'arrowLeft'
  | 'phone'
  | 'mail'
  | 'mapPin'
  | 'clock'
  | 'calendar'
  | 'users'
  | 'check'
  | 'externalLink'
  | 'pound'
  | 'facebook'
  | 'x'
  | 'info'
  | 'logOut'
  | 'edit'
  | 'trash'
  | 'plus'
  | 'inbox'
  | 'key'
  | 'sparkles'
  | 'quote';

/**
 * Inline SVG icon set.
 *
 * Drawn on a 24×24 grid with a 1.75 stroke so the icons sit comfortably beside
 * Inter at body size, and they inherit `currentColor`.
 *
 * The shapes live in the template rather than in a string map so that Angular
 * compiles them as real SVG nodes. Binding markup through `[innerHTML]` would
 * be stripped by the sanitiser, and working around that would mean an
 * unnecessary `bypassSecurityTrust*` call.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('book') {
          <svg:path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <svg:path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        }
        @case ('headphones') {
          <svg:path d="M3 14h3v7H4a1 1 0 0 1-1-1v-6zm15 0h3v6a1 1 0 0 1-1 1h-2v-7z" />
          <svg:path d="M3 14a9 9 0 0 1 18 0" />
        }
        @case ('search') {
          <svg:circle cx="11" cy="11" r="7" />
          <svg:path d="m20 20-3.5-3.5" />
        }
        @case ('monitor') {
          <svg:rect x="2" y="3" width="20" height="14" rx="2" />
          <svg:path d="M8 21h8m-4-4v4" />
        }
        @case ('printer') {
          <svg:path
            d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
          />
          <svg:rect x="6" y="14" width="12" height="8" rx="1" />
        }
        @case ('coffee') {
          <svg:path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <svg:path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
          <svg:path d="M6 2v3M10 2v3M14 2v3" />
        }
        @case ('school') {
          <svg:path d="m12 3 10 5-10 5L2 8l10-5z" />
          <svg:path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" />
        }
        @case ('heart') {
          <svg:path
            d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21.5l8.8-8.5a5.2 5.2 0 0 0 0-7.4z"
          />
        }
        @case ('accessible') {
          <svg:circle cx="12" cy="4.5" r="2" />
          <svg:path d="M12 8v6m0 0h4m-4 0-2.5 7M12 8 7.5 9.5M12 8l4.5 1.5" />
        }
        @case ('menu') {
          <svg:path d="M3 6h18M3 12h18M3 18h18" />
        }
        @case ('close') {
          <svg:path d="M18 6 6 18M6 6l12 12" />
        }
        @case ('arrowRight') {
          <svg:path d="M5 12h14m-6-7 7 7-7 7" />
        }
        @case ('arrowLeft') {
          <svg:path d="M19 12H5m6 7-7-7 7-7" />
        }
        @case ('phone') {
          <svg:path
            d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"
          />
        }
        @case ('mail') {
          <svg:rect x="2" y="4" width="20" height="16" rx="2" />
          <svg:path d="m2 7 10 6 10-6" />
        }
        @case ('mapPin') {
          <svg:path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <svg:circle cx="12" cy="10" r="3" />
        }
        @case ('clock') {
          <svg:circle cx="12" cy="12" r="9" />
          <svg:path d="M12 7v5l3.5 2" />
        }
        @case ('calendar') {
          <svg:rect x="3" y="5" width="18" height="16" rx="2" />
          <svg:path d="M3 10h18M8 3v4M16 3v4" />
        }
        @case ('users') {
          <svg:path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <svg:circle cx="9" cy="7" r="4" />
          <svg:path d="M22 20v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
        }
        @case ('check') {
          <svg:path d="m20 6-11 11-5-5" />
        }
        @case ('externalLink') {
          <svg:path d="M14 3h7v7" />
          <svg:path d="M10 14 21 3" />
          <svg:path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        }
        @case ('pound') {
          <svg:path d="M16 5.5A3.5 3.5 0 0 0 9 6v5.5m-3 0h7M6 19h12M6 19c2-1.5 3-3 3-5.5" />
        }
        @case ('facebook') {
          <svg:path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        }
        @case ('x') {
          <svg:path d="M3 3h4.5l5 6.8L18 3h3l-7.1 8.6L21.5 21H17l-5.3-7.2L5.8 21H3l7.5-9L3 3z" />
        }
        @case ('info') {
          <svg:circle cx="12" cy="12" r="9" />
          <svg:path d="M12 11v5M12 8h.01" />
        }
        @case ('logOut') {
          <svg:path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <svg:path d="m16 17 5-5-5-5M21 12H9" />
        }
        @case ('edit') {
          <svg:path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
          <svg:path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        }
        @case ('trash') {
          <svg:path
            d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
          />
        }
        @case ('plus') {
          <svg:path d="M12 5v14M5 12h14" />
        }
        @case ('inbox') {
          <svg:path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <svg:path
            d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"
          />
        }
        @case ('key') {
          <svg:circle cx="7.5" cy="15.5" r="4.5" />
          <svg:path d="m10.7 12.3 8.3-8.3M17 6l2.5 2.5M14.5 8.5 17 11" />
        }
        @case ('sparkles') {
          <svg:path
            d="M12 3v4M12 17v4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M3 12h4M17 12h4M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"
          />
        }
        @case ('quote') {
          <svg:path d="M9 11H5.5A1.5 1.5 0 0 1 4 9.5V8a4 4 0 0 1 4-4" />
          <svg:path d="M9 11v3a4 4 0 0 1-4 4" />
          <svg:path d="M20 11h-3.5A1.5 1.5 0 0 1 15 9.5V8a4 4 0 0 1 4-4" />
          <svg:path d="M20 11v3a4 4 0 0 1-4 4" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(24);
}
