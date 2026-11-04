import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { OpeningHoursService } from '../core/opening-hours.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-hours-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'block' },
  template: `
    <div class="card flex h-full flex-col p-5 sm:p-7">
      <div class="flex items-center gap-3">
        <span
          class="bg-blue-50 text-blue-700 flex h-11 w-11 items-center justify-center rounded-xl"
        >
          <app-icon name="clock" [size]="22" />
        </span>
        <div>
          <h2 class="font-sans text-xl font-semibold">Opening hours</h2>
          <p
            class="flex items-center gap-1.5 text-sm font-medium"
            [class]="hours.status().isOpen ? 'text-success' : 'text-orange-700'"
          >
            <span
              class="status-dot h-2 w-2"
              [class]="hours.status().isOpen ? 'status-dot-open bg-success' : 'bg-orange-600'"
              aria-hidden="true"
            ></span>
            {{ hours.status().label }}
          </p>
        </div>
      </div>

      <dl class="-mx-3 mt-5 mb-5 flex flex-col">
        @for (day of hours.week(); track day.dayIndex) {
          <div
            class="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2.5"
            [class]="
              day.dayIndex === hours.todayIndex()
                ? 'bg-blue-50 text-navy-900 font-semibold'
                : 'text-ink-soft'
            "
          >
            <dt class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {{ day.name }}
              @if (day.dayIndex === hours.todayIndex()) {
                <span
                  class="bg-blue-700 rounded-full px-2.5 py-0.5 text-[0.7rem] tracking-wide text-white uppercase"
                >
                  Today
                </span>
              }
            </dt>
            <dd class="whitespace-nowrap tabular-nums" [class.text-ink-muted]="day.closed">
              {{ day.hours }}
            </dd>
          </div>
        }
      </dl>

      @if (showNote()) {
        <p class="text-ink-soft border-line mt-auto border-t pt-5 text-sm">
          {{ hours.status().detail }}
        </p>
      }
    </div>
  `,
})
export class HoursTableComponent {
  protected readonly hours = inject(OpeningHoursService);

  readonly showNote = input(true);
}
