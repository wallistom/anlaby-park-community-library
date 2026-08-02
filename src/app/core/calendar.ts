/**
 * Date helpers for the events calendar.
 *
 * Deliberately free of Angular and of `toISOString()`. That method converts to
 * UTC first, so west of Greenwich it reports the previous day for anything
 * before 01:00 BST — which would silently shift every event by a day during
 * British Summer Time. Everything here works in local time.
 */

/** ISO `YYYY-MM-DD` for a local date, without the UTC shift. */
export function toIso(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` as local midnight. */
export function fromIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setDate(1); // avoid rolling over from the 31st into the wrong month
  next.setMonth(next.getMonth() + months);
  return next;
}

/** Monday of the week containing `date` — UK weeks start on Monday. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const weekday = (start.getDay() + 6) % 7; // Sunday 0 -> 6
  start.setDate(start.getDate() - weekday);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toIso(a) === toIso(b);
}

/** The seven dates of the week containing `date`. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * The full grid for a month, padded to whole weeks so the calendar is always
 * rectangular. Trailing days from the neighbouring months are included and
 * flagged by the caller via `isSameMonth`.
 */
export function monthGrid(date: Date): Date[] {
  const first = startOfWeek(startOfMonth(date));
  const last = endOfMonth(date);
  const cells: Date[] = [];
  let cursor = first;
  while (cursor <= last || cells.length % 7 !== 0) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
    if (cells.length > 42) break; // six weeks is the maximum a month can span
  }
  return cells;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
