import { Injectable, computed, signal } from '@angular/core';
import { OPENING_HOURS } from './site.data';
import { OpeningDay } from './models';

export interface OpenStatus {
  isOpen: boolean;
  /** Short label for the header pill, e.g. "Open until 5.00pm". */
  label: string;
  /** Longer sentence used on the Visit page. */
  detail: string;
}

/**
 * Works out whether the library is open right now.
 *
 * The clock is held in a signal refreshed every minute so the status pill stays
 * correct on a page left open, rather than freezing at load time.
 */
@Injectable({ providedIn: 'root' })
export class OpeningHoursService {
  private readonly now = signal(new Date());

  readonly days = OPENING_HOURS;

  /** The row matching today, used to highlight it in the hours table. */
  readonly today = computed(() => {
    const dayIndex = this.now().getDay();
    return OPENING_HOURS.find((day) => day.dayIndex === dayIndex) ?? null;
  });

  readonly status = computed<OpenStatus>(() => {
    const now = this.now();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = this.today();

    if (today?.opensAt !== undefined && today.closesAt !== undefined) {
      if (minutes >= today.opensAt && minutes < today.closesAt) {
        const closing = formatMinutes(today.closesAt);
        return {
          isOpen: true,
          label: `Open until ${closing}`,
          detail: `We are open now and close at ${closing} today.`,
        };
      }

      if (minutes < today.opensAt) {
        const opening = formatMinutes(today.opensAt);
        return {
          isOpen: false,
          label: `Opens ${opening}`,
          detail: `We are closed at the moment and open again at ${opening} today.`,
        };
      }
    }

    const next = this.nextOpening(now.getDay());
    if (!next) {
      return { isOpen: false, label: 'Closed', detail: 'We are closed at the moment.' };
    }

    const { day, dayLabel } = next;
    const opening = formatMinutes(day.opensAt!);
    return {
      isOpen: false,
      label: `Opens ${dayLabel}`,
      detail: `We are closed at the moment. We open again ${dayLabel} at ${opening}.`,
    };
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.setInterval(() => this.now.set(new Date()), 60_000);
    }
  }

  /** Finds the next day the library opens, starting the day after `fromDay`. */
  private nextOpening(fromDay: number): { day: OpeningDay; dayLabel: string } | null {
    for (let offset = 1; offset <= 7; offset++) {
      const dayIndex = (fromDay + offset) % 7;
      const day = OPENING_HOURS.find((entry) => entry.dayIndex === dayIndex);
      if (day?.opensAt !== undefined) {
        return { day, dayLabel: offset === 1 ? 'tomorrow' : `on ${day.day}` };
      }
    }
    return null;
  }
}

function formatMinutes(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}.${String(minutes).padStart(2, '0')}${suffix}`;
}
