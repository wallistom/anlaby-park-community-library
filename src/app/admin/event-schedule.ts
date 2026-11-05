import { LibraryEvent } from '../core/models';
import { DAY_NAMES, WEEK_ORDER } from '../core/site.data';
import { fromIso } from '../core/calendar';

/** How close to its last date a club gets before trustees are nudged to extend it. */
export const ENDING_SOON_DAYS = 28;

export type ClubStatus = 'running' | 'ending-soon' | 'finished';

export function isClub(event: LibraryEvent): boolean {
  return !!event.recurrence && event.recurrence !== 'none';
}

/** "Every Tuesday", "Every other Tuesday", "Every day", or "The 12th of every month". */
export function scheduleLabel(event: Pick<LibraryEvent, 'date' | 'recurrence'>): string {
  const date = fromIso(event.date);
  if (!date) {
    return '';
  }
  const weekday = DAY_NAMES[date.getDay()];
  switch (event.recurrence) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return `Every ${weekday}`;
    case 'fortnightly':
      return `Every other ${weekday}`;
    case 'monthly':
      return `The ${ordinal(date.getDate())} of every month`;
    default:
      return '';
  }
}

export function clubStatus(event: LibraryEvent, todayIso: string): ClubStatus {
  if (!event.repeatUntil) {
    return 'running';
  }
  if (event.repeatUntil < todayIso) {
    return 'finished';
  }
  return daysBetween(todayIso, event.repeatUntil) <= ENDING_SOON_DAYS ? 'ending-soon' : 'running';
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  const from = fromIso(fromIsoDate);
  const to = fromIso(toIsoDate);
  if (!from || !to) {
    return 0;
  }
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** Clubs in timetable order: Monday to Sunday, then by start time, with monthly ones last. */
export function compareClubs(a: LibraryEvent, b: LibraryEvent): number {
  const rank = (event: LibraryEvent): number => {
    if (event.recurrence === 'monthly') {
      return 100 + (fromIso(event.date)?.getDate() ?? 0);
    }
    return WEEK_ORDER.indexOf(fromIso(event.date)?.getDay() ?? 0);
  };
  return rank(a) - rank(b) || (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99');
}

export function ordinal(day: number): string {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}
