import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DAY_NAMES, DEFAULT_SETTINGS, WEEK_ORDER } from './site.data';
import {
  LibrarySettings,
  ResolvedDay,
  formatRange,
  formatTime,
  resolveDay,
  sortExceptions,
} from './opening-hours.model';
import { toIso } from './calendar';

export interface OpenStatus {
  isOpen: boolean;
  label: string;
  detail: string;
  reason?: string;
}

export type SettingsLoadState = 'idle' | 'loading' | 'ready' | 'failed';

export interface WeekRow {
  dayIndex: number;
  name: string;
  closed: boolean;
  hours: string;
}

@Injectable({ providedIn: 'root' })
export class OpeningHoursService {
  private readonly http = inject(HttpClient);

  private readonly now = signal(new Date());
  private readonly stored = signal<LibrarySettings>(DEFAULT_SETTINGS);
  private loadStarted = false;

  private readonly loadStatus = signal<SettingsLoadState>('idle');

  readonly loadState = this.loadStatus.asReadonly();

  readonly settings = computed<LibrarySettings>(() => {
    const value = this.stored();
    return { ...value, exceptions: sortExceptions(value.exceptions) };
  });

  readonly notice = computed(() => this.settings().notice);

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
      return {
        dayIndex,
        name: DAY_NAMES[dayIndex],
        closed: resolved.closed,
        hours: formatRange(resolved),
      };
    });
  });

  readonly todayIndex = computed(() => this.now().getDay());

  readonly status = computed<OpenStatus>(() => {
    const now = this.now();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = resolveDay(toIso(now), this.settings());

    if (!today.closed && today.opensAt && today.closesAt) {
      const opens = toMinutes(today.opensAt);
      const closes = toMinutes(today.closesAt);

      if (minutes >= opens && minutes < closes) {
        const until = formatTime(today.closesAt);
        return {
          isOpen: true,
          label: `Open until ${until}`,
          detail: `We are open now and close at ${until} today.`,
          reason: today.reason,
        };
      }
      if (minutes < opens) {
        const from = formatTime(today.opensAt);
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
    window.setInterval(() => this.now.set(new Date()), 60_000);
  }

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
        this.loadStatus.set('ready');
      },
      error: () => {
        this.loadStatus.set('failed');
      },
    });
  }

  apply(settings: LibrarySettings): void {
    this.stored.set(settings);
    this.loadStatus.set('ready');
  }

  resolve(iso: string): ResolvedDay {
    return resolveDay(iso, this.settings());
  }

  private nextOpening(): { when: string; at: string } | null {
    const today = this.now();
    for (let offset = 1; offset <= 14; offset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      const day = resolveDay(toIso(date), this.settings());
      if (!day.closed && day.opensAt) {
        return {
          when: offset === 1 ? 'tomorrow' : `on ${DAY_NAMES[date.getDay()]}`,
          at: formatTime(day.opensAt),
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
