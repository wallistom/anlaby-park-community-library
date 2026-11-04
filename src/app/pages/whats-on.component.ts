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
import { formatRange } from '../core/opening-hours.model';
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

function daysLeftInWeek(date: Date): number {
  return 7 - ((date.getDay() + 6) % 7);
}

interface CalendarDay {
  date: Date;
  iso: string;
  events: EventOccurrence[];
  isToday: boolean;
  inCurrentMonth: boolean;
  closed: boolean;
  hours: string;
  closureReason?: string;
}

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

  protected readonly view = signal<ViewMode>('month');
  protected readonly cursor = signal(new Date());
  protected readonly selectedIso = signal<string | null>(null);

  private readonly today = new Date();

  protected readonly weekdayHeadings = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  protected readonly monthHasOneOff = computed(() =>
    this.month().some(
      (day) => day.inCurrentMonth && day.events.some((event) => event.recurrence === 'none'),
    ),
  );

  protected readonly selectedDay = computed(() => {
    const iso = this.selectedIso();
    return iso ? (this.month().find((day) => day.iso === iso) ?? null) : null;
  });

  protected readonly canGoForward = computed(() => {
    const next = this.view() === 'week' ? addDays(this.cursor(), 7) : addMonths(this.cursor(), 1);
    const firstShown = this.view() === 'week' ? startOfWeek(next) : startOfMonth(next);
    return toIso(firstShown) <= this.events.horizonEnd();
  });

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
    if (mode === 'week' && this.onCurrentWeek() && daysLeftInWeek(this.today) < 3) {
      this.cursor.set(addDays(this.today, daysLeftInWeek(this.today)));
    }
    this.view.set(mode);
  }

  protected selectDay(day: CalendarDay): void {
    if (!day.events.length) {
      return;
    }
    const opening = this.selectedIso() !== day.iso;
    this.selectedIso.update((current) => (current === day.iso ? null : day.iso));

    if (opening) {
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
  }

  ngOnInit(): void {
    this.events.load();
  }

  private toDay(date: Date, inCurrentMonth: boolean): CalendarDay {
    const iso = toIso(date);
    const opening = this.openingHours.resolve(iso);
    return {
      date,
      iso,
      events: this.events.eventsOn(iso),
      isToday: isSameDay(date, this.today),
      inCurrentMonth,
      closed: opening.closed,
      hours: formatRange(opening),
      closureReason: opening.isException ? opening.reason : undefined,
    };
  }
}
