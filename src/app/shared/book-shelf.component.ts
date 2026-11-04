import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-book-shelf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 340 210" class="h-auto w-full" focusable="false">
      <rect x="8" y="64" width="24" height="142" rx="1.5" class="fill-navy-800" />
      <rect x="8" y="76" width="24" height="3" class="fill-navy-600" />
      <rect x="8" y="188" width="24" height="3" class="fill-navy-600" />

      <rect x="34" y="38" width="32" height="168" rx="1.5" class="fill-blue-600" />
      <rect x="42" y="68" width="16" height="40" rx="1" class="fill-blue-100" />

      <rect x="68" y="82" width="18" height="124" rx="1.5" class="fill-orange-500" />
      <rect x="68" y="92" width="18" height="2" class="fill-orange-300" />
      <rect x="68" y="192" width="18" height="2" class="fill-orange-300" />

      <rect x="88" y="20" width="28" height="186" rx="1.5" class="fill-navy-950" />
      <rect x="100" y="48" width="4" height="64" rx="1" class="fill-navy-400" />

      <rect x="118" y="56" width="22" height="150" rx="1.5" class="fill-blue-300" />
      <rect x="118" y="66" width="22" height="3" class="fill-blue-200" />

      <rect
        x="142.5"
        y="46.5"
        width="35"
        height="159"
        rx="1.5"
        class="fill-surface stroke-navy-950/10"
      />
      <rect x="143" y="62" width="34" height="10" class="fill-navy-800" />
      <rect x="152" y="86" width="16" height="3" rx="1" class="fill-navy-300" />

      <rect x="180" y="72" width="20" height="134" rx="1.5" class="fill-orange-700" />
      <rect x="180" y="84" width="20" height="2" class="fill-orange-400" />

      <g transform="rotate(-14 214 206)">
        <rect x="214" y="48" width="26" height="158" rx="1.5" class="fill-navy-800" />
        <rect x="214" y="62" width="26" height="3" class="fill-blue-300" />
      </g>

      <rect x="252" y="186" width="78" height="20" rx="1.5" class="fill-blue-600" />
      <rect x="258" y="166" width="66" height="20" rx="1.5" class="fill-orange-500" />
      <rect x="264" y="150" width="54" height="16" rx="1.5" class="fill-navy-950" />

      <rect x="0" y="206" width="340" height="4" rx="1" class="fill-navy-950/20" />
    </svg>
  `,
})
export class BookShelfComponent {}
