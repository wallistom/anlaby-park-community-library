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
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { TimePipe } from '../shared/time.pipe';
import { RevealDirective } from '../shared/reveal.directive';
import { EventsService } from '../core/events.service';
import { formatRange } from '../core/opening-hours.model';
import { OpeningHoursService } from '../core/opening-hours.service';
import { SITE } from '../core/site.data';
import { EventOccurrence, RECURRENCE_LABELS } from '../core/models';
import {
  addDays,
  addMonths,
  fromIso,
  isSameMonth,
  monthGrid,
  startOfMonth,
  startOfWeek,
  toIso,
  weekDays,
} from '../core/calendar';

type ViewMode = 'week' | 'month';

export interface CalendarDay {
  date: Date;
  iso: string;
  events: EventOccurrence[];
  isToday: boolean;
  isPast: boolean;
  inCurrentMonth: boolean;
  closed: boolean;
  hours: string;
  closureReason?: string;
}

interface UpcomingEvent {
  event: EventOccurrence;
  date: Date;
}

@Component({
  selector: 'app-whats-on',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    NgTemplateOutlet,
    PageHeroComponent,
    CtaBandComponent,
    IconComponent,
    TimePipe,
    RevealDirective,
  ],
  templateUrl: './whats-on.component.html',
})
export class WhatsOnComponent implements OnInit {
  protected readonly events = inject(EventsService);
  private readonly openingHours = inject(OpeningHoursService);
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  protected readonly site = SITE;

  protected readonly view = signal<ViewMode>('week');
  protected readonly cursor = signal(new Date());
  protected readonly selectedIso = signal<string | null>(null);

  private readonly today = new Date();

  protected readonly weekdayHeadings = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /** Full lists stop here unless the reader asks for the rest. */
  protected readonly eventLimit = 6;
  private readonly expandedDays = signal<ReadonlySet<string>>(new Set());

  protected readonly week = computed<CalendarDay[]>(() =>
    weekDays(this.cursor()).map((date) => this.toDay(date, true)),
  );

  protected readonly weekLabel = computed(() => {
    const days = this.week();
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

  protected readonly month = computed<CalendarDay[]>(() => {
    const anchor = this.cursor();
    return monthGrid(anchor).map((date) => this.toDay(date, isSameMonth(date, anchor)));
  });

  protected readonly monthLabel = computed(() =>
    this.cursor().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  );

  protected readonly monthDaysWithEvents = computed(() =>
    this.month().filter((day) => day.inCurrentMonth && day.events.length > 0),
  );

  protected readonly onCurrentMonth = computed(() => isSameMonth(this.cursor(), this.today));

  protected readonly onCurrentPeriod = computed(() =>
    this.view() === 'week' ? this.onCurrentWeek() : this.onCurrentMonth(),
  );

  /**
   * The day whose detail is shown. A selection wins; otherwise today, then
   * the next day with something on, so the panel is never empty.
   */
  protected readonly activeDay = computed<CalendarDay | null>(() => {
    const iso = this.selectedIso();
    const days =
      this.view() === 'week' ? this.week() : this.month().filter((day) => day.inCurrentMonth);
    return (
      days.find((day) => day.iso === iso) ??
      days.find((day) => day.isToday) ??
      days.find((day) => !day.isPast && day.events.length > 0) ??
      days.find((day) => !day.isPast) ??
      days[0] ??
      null
    );
  });

  protected readonly comingUp = computed<UpcomingEvent[]>(() =>
    this.events
      .upcoming()
      .filter((event) => event.recurrence === 'none')
      .slice(0, 4)
      .map((event) => ({ event, date: fromIso(event.date) ?? new Date(event.date) })),
  );

  protected readonly canGoForward = computed(() => {
    const next = this.view() === 'week' ? addDays(this.cursor(), 7) : addMonths(this.cursor(), 1);
    const firstShown = this.view() === 'week' ? startOfWeek(next) : startOfMonth(next);
    return toIso(firstShown) <= this.events.horizonEnd();
  });

  protected readonly canGoBack = computed(() => !this.onCurrentPeriod());

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
    this.selectedIso.set(day.iso);
    this.revealDetail();
  }

  protected jumpTo(item: UpcomingEvent): void {
    this.cursor.set(item.date);
    this.selectedIso.set(item.event.date);
    this.revealDetail();
  }

  protected recurrenceTag(event: EventOccurrence): string {
    return event.recurrence === 'none' ? 'One-off' : RECURRENCE_LABELS[event.recurrence];
  }

  protected shownEvents(day: CalendarDay): EventOccurrence[] {
    if (day.events.length <= this.eventLimit || this.expandedDays().has(day.iso)) {
      return day.events;
    }
    return day.events.slice(0, this.eventLimit - 1);
  }

  protected hiddenCount(day: CalendarDay): number {
    return day.events.length - this.shownEvents(day).length;
  }

  protected showAll(day: CalendarDay): void {
    this.expandedDays.update((current) => new Set(current).add(day.iso));
  }

  protected isActive(day: CalendarDay): boolean {
    return this.activeDay()?.iso === day.iso;
  }

  ngOnInit(): void {
    this.events.load();

    const params = this.route.snapshot.queryParamMap;
    const view = params.get('view');
    if (view === 'week' || view === 'month') {
      this.view.set(view);
    }
    const day = params.get('day');
    const date = day ? fromIso(day) : null;
    if (day && date) {
      this.cursor.set(date);
      this.selectedIso.set(day);
    }
  }

  private revealDetail(): void {
    afterNextRender(
      () => {
        document.getElementById('day-detail')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
          block: 'nearest',
        });
      },
      { injector: this.injector },
    );
  }

  private toDay(date: Date, inCurrentMonth: boolean): CalendarDay {
    const iso = toIso(date);
    const todayIso = toIso(this.today);
    const opening = this.openingHours.resolve(iso);
    return {
      date,
      iso,
      events: this.events.eventsOn(iso),
      isToday: iso === todayIso,
      isPast: iso < todayIso,
      inCurrentMonth,
      closed: opening.closed,
      hours: formatRange(opening),
      closureReason: opening.isException ? opening.reason : undefined,
    };
  }
}
