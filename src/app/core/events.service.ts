import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { EventOccurrence } from './models';

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
