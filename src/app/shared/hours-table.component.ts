import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { OpeningHoursService } from '../core/opening-hours.service';
import { IconComponent } from './icon.component';

/** Opening hours with today's row highlighted and a live open/closed status. */
@Component({
  selector: 'app-hours-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="card p-6 sm:p-7" [class.bg-surface]="true">
      <div class="flex items-center gap-3">
        <span
          class="bg-forest-50 text-forest-700 flex h-11 w-11 items-center justify-center rounded-xl"
        >
          <app-icon name="clock" [size]="22" />
        </span>
        <div>
          <h2 class="font-display text-xl font-semibold">Opening hours</h2>
          <p
            class="flex items-center gap-1.5 text-sm font-medium"
            [class]="hours.status().isOpen ? 'text-success' : 'text-ochre-700'"
          >
            <span
              class="inline-flex h-2 w-2 rounded-full"
              [class]="hours.status().isOpen ? 'bg-success' : 'bg-ochre-600'"
              aria-hidden="true"
            ></span>
            {{ hours.status().label }}
          </p>
        </div>
      </div>

      <dl class="mt-6 flex flex-col">
        @for (day of hours.week(); track day.dayIndex) {
          <div
            class="flex items-baseline justify-between gap-4 rounded-lg px-3 py-2.5"
            [class]="
              day.dayIndex === hours.todayIndex()
                ? 'bg-forest-50 text-forest-900 font-semibold'
                : 'text-ink-soft'
            "
          >
            <dt class="flex items-center gap-2">
              {{ day.name }}
              @if (day.dayIndex === hours.todayIndex()) {
                <span
                  class="bg-forest-700 rounded-full px-2.5 py-0.5 text-[0.7rem] tracking-wide text-white uppercase"
                >
                  Today
                </span>
              }
            </dt>
            <dd class="tabular-nums" [class.text-ink-muted]="day.hours === 'Closed'">
              {{ day.hours }}
            </dd>
          </div>
        }
      </dl>

      @if (showNote()) {
        <p class="text-ink-soft border-line mt-5 border-t pt-5 text-sm">
          {{ hours.status().detail }}
        </p>
      }
    </div>
  `,
})
export class HoursTableComponent {
  protected readonly hours = inject(OpeningHoursService);

  /** Adds the "we open again at…" sentence beneath the table. */
  readonly showNote = input(true);
}
