import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { TimePipe } from '../shared/time.pipe';
import { EventsService } from '../core/events.service';
import { OpeningHoursService } from '../core/opening-hours.service';
import { SITE } from '../core/site.data';
import { EventOccurrence } from '../core/models';
import {
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfMonth,
  startOfWeek,
  toIso,
  weekDays,
} from '../core/calendar';

type ViewMode = 'week' | 'month';

/** Opens on next week once fewer than three days of this one remain. */
function openingCursor(): Date {
  const today = new Date();
  const daysLeft = 7 - ((today.getDay() + 6) % 7);
  return daysLeft < 3 ? addDays(today, daysLeft) : today;
}

/** One day in either view, with everything the template needs precomputed. */
export interface CalendarDay {
  date: Date;
  iso: string;
  events: EventOccurrence[];
  isToday: boolean;
  /** False for the leading and trailing days that pad the month grid. */
  inCurrentMonth: boolean;
  /** Opening hours, so a day with nothing on still says something useful. */
  hours: string | null;
}

/**
 * What's On.
 *
 * A flat chronological list was the original design and does not survive real
 * data: once the trustees enter the weekly timetable, the API expands it to
 * roughly 130 occurrences over its 120-day horizon. A week view is the primary
 * one because it matches the printed timetable the library already publishes —
 * people already think about this place in terms of "what happens on a
 * Tuesday".
 */
@Component({
  selector: 'app-whats-on',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, PageHeroComponent, CtaBandComponent, IconComponent, TimePipe],
  templateUrl: './whats-on.component.html',
})
export class WhatsOnComponent implements OnInit {
  protected readonly events = inject(EventsService);
  private readonly openingHours = inject(OpeningHoursService);
  private readonly injector = inject(Injector);
  protected readonly site = SITE;

  protected readonly view = signal<ViewMode>('week');
  /**
   * Anchor date; whichever week or month contains it is the one shown.
   *
   * Late in the week there is almost nothing left to show, so the view opens on
   * next week instead of a card or two of leftovers.
   */
  protected readonly cursor = signal(openingCursor());
  /** Day selected in the month grid, shown in detail beneath it. */
  protected readonly selectedIso = signal<string | null>(null);

  private readonly today = new Date();

  protected readonly weekdayHeadings = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // --- Week --------------------------------------------------------------

  /**
   * The visible week, with days that have already passed dropped — nobody
   * visiting a "what's on" page wants to read about last Tuesday.
   */
  protected readonly week = computed<CalendarDay[]>(() => {
    const todayIso = toIso(this.today);
    return weekDays(this.cursor())
      .map((date) => this.toDay(date, true))
      .filter((day) => day.iso >= todayIso);
  });

  protected readonly weekLabel = computed(() => {
    const days = this.week();
    if (!days.length) {
      return '';
    }
    const first = days[0];
    const last = days[days.length - 1];
    const sameMonth = isSameMonth(first.date, last.date);
    const start = first.date.toLocaleDateString(
      'en-GB',
      sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' },
    );
    const end = last.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return `${start} – ${end}`;
  });

  protected readonly onCurrentWeek = computed(
    () => toIso(startOfWeek(this.cursor())) === toIso(startOfWeek(this.today)),
  );

  protected readonly weekEventCount = computed(() =>
    this.week().reduce((total, day) => total + day.events.length, 0),
  );

  // --- Month -------------------------------------------------------------

  protected readonly month = computed<CalendarDay[]>(() => {
    const anchor = this.cursor();
    return monthGrid(anchor).map((date) => this.toDay(date, isSameMonth(date, anchor)));
  });

  protected readonly monthLabel = computed(() =>
    this.cursor().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  );

  /** Days that actually have something on — the mobile month list. */
  protected readonly monthDaysWithEvents = computed(() =>
    this.month().filter((day) => day.inCurrentMonth && day.events.length > 0),
  );

  protected readonly onCurrentMonth = computed(() => isSameMonth(this.cursor(), this.today));

  protected readonly selectedDay = computed(() => {
    const iso = this.selectedIso();
    return iso ? (this.month().find((day) => day.iso === iso) ?? null) : null;
  });

  // --- Navigation --------------------------------------------------------

  /** Stops navigation past the point the API can expand repeats to. */
  protected readonly canGoForward = computed(() => {
    const next = this.view() === 'week' ? addDays(this.cursor(), 7) : addMonths(this.cursor(), 1);
    const firstShown = this.view() === 'week' ? startOfWeek(next) : startOfMonth(next);
    return toIso(firstShown) <= this.events.horizonEnd();
  });

  /** Nothing before today is published, so there is no reason to go back past it. */
  protected readonly canGoBack = computed(() =>
    this.view() === 'week' ? !this.onCurrentWeek() : !this.onCurrentMonth(),
  );

  protected step(direction: -1 | 1): void {
    this.selectedIso.set(null);
    this.cursor.update((current) =>
      this.view() === 'week' ? addDays(current, 7 * direction) : addMonths(current, direction),
    );
  }

  protected backToToday(): void {
    this.selectedIso.set(null);
    this.cursor.set(new Date());
  }

  protected setView(mode: ViewMode): void {
    this.selectedIso.set(null);
    this.view.set(mode);
  }

  protected selectDay(day: CalendarDay): void {
    if (!day.events.length) {
      return;
    }
    const opening = this.selectedIso() !== day.iso;
    this.selectedIso.update((current) => (current === day.iso ? null : day.iso));

    // A six-row grid pushes the detail panel below the fold, so selecting a
    // day otherwise looks like nothing happened. `nearest` scrolls only when
    // it actually needs to, rather than yanking the page every time.
    if (opening) {
      afterNextRender(
        () => {
          document.getElementById('day-detail')?.scrollIntoView({
            behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'nearest',
          });
        },
        { injector: this.injector },
      );
    }
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngOnInit(): void {
    this.events.load();
  }

  private toDay(date: Date, inCurrentMonth: boolean): CalendarDay {
    const iso = toIso(date);
    const opening = this.openingHours.days.find((day) => day.dayIndex === date.getDay());
    return {
      date,
      iso,
      events: this.events.eventsOn(iso),
      isToday: isSameDay(date, this.today),
      inCurrentMonth,
      hours: opening?.hours ?? null,
    };
  }
}
