import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DAY_NAMES, DEFAULT_SETTINGS, WEEK_ORDER } from './site.data';
import {
  LibrarySettings,
  ResolvedDay,
  formatRange,
  resolveDay,
  sortExceptions,
  upcomingExceptions,
} from './opening-hours.model';
import { toIso } from './calendar';

export interface OpenStatus {
  isOpen: boolean;
  /** Short label, e.g. "Open until 5.00pm". */
  label: string;
  /** Fuller sentence for the Visit page. */
  detail: string;
  /** Set when today is an exception, so the reason can be shown. */
  reason?: string;
}

/**
 * Whether the saved settings have actually arrived.
 *
 * Public pages ignore this — they fall back to the compiled-in defaults so the
 * site is never blank. The admin form must not: editing a form seeded with
 * defaults and pressing Save would write those defaults over whatever the
 * trustees had actually saved.
 */
export type SettingsLoadState = 'idle' | 'loading' | 'ready' | 'failed';

export interface WeekRow {
  dayIndex: number;
  name: string;
  hours: string;
}

/**
 * Whether the library is open, and when.
 *
 * Settings are loaded from the API and start from the compiled-in defaults, so
 * the site is never blank and never wrong-by-omission if the API is down. The
 * clock is a signal refreshed every minute, so a page left open does not freeze
 * on a stale status.
 */
@Injectable({ providedIn: 'root' })
export class OpeningHoursService {
  private readonly http = inject(HttpClient);

  private readonly now = signal(new Date());
  private readonly stored = signal<LibrarySettings>(DEFAULT_SETTINGS);
  private loadStarted = false;

  private readonly loadStatus = signal<SettingsLoadState>('idle');

  /** For screens that must not act on the fallback defaults. */
  readonly loadState = this.loadStatus.asReadonly();

  /** Exceptions sorted narrowest-first, so a single day beats a range. */
  readonly settings = computed<LibrarySettings>(() => {
    const value = this.stored();
    return { ...value, exceptions: sortExceptions(value.exceptions) };
  });

  readonly notice = computed(() => this.settings().notice);

  /** The whole week, Monday first, for the hours table. */
  readonly week = computed<WeekRow[]>(() => {
    const settings = this.settings();
    return WEEK_ORDER.map((dayIndex) => {
      const day = settings.pattern.find((entry) => entry.dayIndex === dayIndex);
      const resolved: ResolvedDay = {
        iso: '',
        closed: day?.closed ?? true,
        opensAt: day?.opensAt,
        closesAt: day?.closesAt,
        isException: false,
      };
      return { dayIndex, name: DAY_NAMES[dayIndex], hours: formatRange(resolved) };
    });
  });

  readonly todayIndex = computed(() => this.now().getDay());

  /** Exceptions still to come, so upcoming closures can be announced early. */
  readonly upcoming = computed(() =>
    upcomingExceptions(this.settings().exceptions, toIso(this.now())),
  );

  readonly status = computed<OpenStatus>(() => {
    const now = this.now();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = resolveDay(toIso(now), this.settings());

    if (!today.closed && today.opensAt && today.closesAt) {
      const opens = toMinutes(today.opensAt);
      const closes = toMinutes(today.closesAt);

      if (minutes >= opens && minutes < closes) {
        const until = formatTimeLabel(today.closesAt);
        return {
          isOpen: true,
          label: `Open until ${until}`,
          detail: `We are open now and close at ${until} today.`,
          reason: today.reason,
        };
      }
      if (minutes < opens) {
        const from = formatTimeLabel(today.opensAt);
        return {
          isOpen: false,
          label: `Opens ${from}`,
          detail: `We are closed at the moment and open again at ${from} today.`,
          reason: today.reason,
        };
      }
    }

    const next = this.nextOpening();
    if (!next) {
      return {
        isOpen: false,
        label: 'Closed',
        detail: today.reason ?? 'We are closed at the moment.',
        reason: today.reason,
      };
    }
    return {
      isOpen: false,
      label: `Opens ${next.when}`,
      detail: today.reason
        ? `${today.reason}. We open again ${next.when} at ${next.at}.`
        : `We are closed at the moment. We open again ${next.when} at ${next.at}.`,
      reason: today.reason,
    };
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.setInterval(() => this.now.set(new Date()), 60_000);
    }
  }

  /**
   * Fetches the live settings once.
   *
   * A failure is deliberately silent: the defaults are already in place and a
   * visitor should never see an error where the opening hours belong.
   */
  load(): void {
    if (this.loadStarted) {
      return;
    }
    this.loadStarted = true;
    this.loadStatus.set('loading');
    this.http.get<Partial<LibrarySettings>>(`${environment.apiBaseUrl}/settings`).subscribe({
      next: (value) => {
        if (value?.pattern?.length) {
          this.stored.set({
            pattern: value.pattern,
            exceptions: value.exceptions ?? [],
            notice: value.notice ?? DEFAULT_SETTINGS.notice,
          });
        }
        // An empty body means nothing has been saved yet, which is a real
        // answer: the defaults genuinely are the current state.
        this.loadStatus.set('ready');
      },
      error: () => {
        // Public pages keep the defaults and carry on. The admin form checks
        // this and refuses to edit rather than risk overwriting.
        this.loadStatus.set('failed');
      },
    });
  }

  /** Applies settings saved in the admin area without a refetch. */
  apply(settings: LibrarySettings): void {
    this.stored.set(settings);
    this.loadStatus.set('ready');
  }

  /** Hours for a given date, exceptions included — used by the calendar. */
  resolve(iso: string): ResolvedDay {
    return resolveDay(iso, this.settings());
  }

  /** Scans forward for the next day the library opens. */
  private nextOpening(): { when: string; at: string } | null {
    const today = this.now();
    for (let offset = 1; offset <= 14; offset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      const day = resolveDay(toIso(date), this.settings());
      if (!day.closed && day.opensAt) {
        return {
          when: offset === 1 ? 'tomorrow' : `on ${DAY_NAMES[date.getDay()]}`,
          at: formatTimeLabel(day.opensAt),
        };
      }
    }
    return null;
  }
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTimeLabel(value: string): string {
  const [rawHours, minutes] = value.split(':');
  const hours = Number(rawHours);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}.${minutes}${suffix}`;
}
