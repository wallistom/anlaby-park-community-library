import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { EventOccurrence } from './models';
import { toIso } from './calendar';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads the published events feed once and shares it across the pages that
 * need it.
 *
 * The site must stay useful when the API is unreachable — before the backend
 * is deployed, or during an outage — so callers get an explicit `state` to
 * render a fallback against rather than an empty list that reads as "nothing
 * is happening here".
 */
@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly api = inject(ApiService);
  private readonly events = signal<EventOccurrence[]>([]);
  private readonly loadState = signal<LoadState>('idle');

  readonly state = this.loadState.asReadonly();

  /**
   * Published occurrences from today onwards, soonest first.
   *
   * The API already filters and sorts; this repeats the work cheaply so a stale
   * cached response can never surface yesterday's dates.
   */
  readonly upcoming = computed(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return this.events()
      .filter((event) => event.published && event.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
  });

  /**
   * Occurrences indexed by ISO date, so a calendar cell is a map lookup rather
   * than a filter over every occurrence. With the real timetable entered this
   * feed is ~130 entries, and a month grid would otherwise scan it 42 times.
   */
  readonly byDate = computed(() => {
    const index = new Map<string, EventOccurrence[]>();
    for (const event of this.upcoming()) {
      const day = index.get(event.date);
      if (day) {
        day.push(event);
      } else {
        index.set(event.date, [event]);
      }
    }
    // Within a day, order by start time; untimed events sort last.
    for (const day of index.values()) {
      day.sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));
    }
    return index;
  });

  /**
   * The API expands repeats 120 days ahead, so navigating past that shows empty
   * months with no explanation. Views use this to stop at the last date we can
   * actually speak for.
   */
  readonly horizonEnd = computed(() => {
    const end = new Date();
    end.setDate(end.getDate() + 120);
    return toIso(end);
  });

  eventsOn(iso: string): EventOccurrence[] {
    return this.byDate().get(iso) ?? [];
  }

  load(): void {
    if (this.loadState() === 'loading' || this.loadState() === 'loaded') {
      return;
    }
    this.loadState.set('loading');
    this.api.listPublicEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loadState.set('loaded');
      },
      error: () => this.loadState.set('error'),
    });
  }
}
