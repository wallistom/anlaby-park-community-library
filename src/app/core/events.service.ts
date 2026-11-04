import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { EventOccurrence } from './models';
import { toIso } from './calendar';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly api = inject(ApiService);
  private readonly events = signal<EventOccurrence[]>([]);
  private readonly loadState = signal<LoadState>('idle');

  readonly state = this.loadState.asReadonly();

  readonly upcoming = computed(() => {
    const todayIso = toIso(new Date());
    return this.events()
      .filter((event) => event.published && event.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
  });

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
    for (const day of index.values()) {
      day.sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));
    }
    return index;
  });

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
