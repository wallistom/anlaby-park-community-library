/**
 * Opening hours: a weekly pattern, plus dated exceptions that override it.
 *
 * Two structures rather than one because they answer different questions. The
 * pattern is "what normally happens on a Tuesday" and changes rarely. An
 * exception is "what happens on this particular date" — a bank holiday, the
 * Christmas run, a burst pipe — and is added and forgotten.
 *
 * Everything here is pure so the resolver can be tested without a browser.
 */

/** One weekday in the normal weekly pattern. */
export interface OpeningDayPattern {
  /** Matches `Date.prototype.getDay()`: 0 is Sunday. */
  dayIndex: number;
  closed: boolean;
  /** 24-hour `HH:MM`. Absent when closed. */
  opensAt?: string;
  closesAt?: string;
}

/**
 * A dated override.
 *
 * `from`/`to` is a range so the Christmas period is one entry rather than ten,
 * and `closed: false` with times covers a half-day — Christmas Eve mornings —
 * as well as opening on a day the pattern has shut.
 */
export interface OpeningException {
  exceptionId: string;
  /** ISO `YYYY-MM-DD`. */
  from: string;
  /** ISO `YYYY-MM-DD`; equal to `from` for a single day. */
  to: string;
  closed: boolean;
  opensAt?: string;
  closesAt?: string;
  /**
   * Shown to the public. "Closed" on its own wastes a journey; "Closed for the
   * bank holiday" does not, so this is required rather than optional.
   */
  reason: string;
}

/** The dismissible banner. Data, so it can be switched off without a deploy. */
export interface SiteNotice {
  active: boolean;
  title: string;
  body: string;
}

export interface LibrarySettings {
  pattern: OpeningDayPattern[];
  exceptions: OpeningException[];
  notice: SiteNotice;
}

/** What the site should say about one particular date. */
export interface ResolvedDay {
  iso: string;
  closed: boolean;
  opensAt?: string;
  closesAt?: string;
  /** Present only when an exception applied, and safe to show publicly. */
  reason?: string;
  /** True when an exception overrode the normal pattern. */
  isException: boolean;
}

/**
 * Resolves a single date.
 *
 * Order is exception → weekly pattern → closed. The first exception covering
 * the date wins, so a specific single-day entry added later does not silently
 * lose to a long-running range; callers keep exceptions sorted with the
 * narrowest first via `sortExceptions`.
 */
export function resolveDay(iso: string, settings: LibrarySettings): ResolvedDay {
  const exception = settings.exceptions.find((e) => iso >= e.from && iso <= e.to);
  if (exception) {
    return {
      iso,
      closed: exception.closed,
      opensAt: exception.closed ? undefined : exception.opensAt,
      closesAt: exception.closed ? undefined : exception.closesAt,
      reason: exception.reason,
      isException: true,
    };
  }

  const weekday = new Date(`${iso}T00:00:00`).getDay();
  const day = settings.pattern.find((d) => d.dayIndex === weekday);
  if (!day || day.closed) {
    return { iso, closed: true, isException: false };
  }
  return {
    iso,
    closed: false,
    opensAt: day.opensAt,
    closesAt: day.closesAt,
    isException: false,
  };
}

/**
 * Narrowest range first, then earliest.
 *
 * A single day inside a longer closure — "open for the fayre during the
 * Christmas break" — has to take precedence over the range containing it, and
 * `resolveDay` takes the first match.
 */
export function sortExceptions(exceptions: OpeningException[]): OpeningException[] {
  return [...exceptions].sort((a, b) => {
    const spanA = daysBetween(a.from, a.to);
    const spanB = daysBetween(b.from, b.to);
    return spanA !== spanB ? spanA - spanB : a.from.localeCompare(b.from);
  });
}

/** Exceptions ending on or after `iso`, soonest first — the ones still to come. */
export function upcomingExceptions(
  exceptions: OpeningException[],
  iso: string,
): OpeningException[] {
  return exceptions.filter((e) => e.to >= iso).sort((a, b) => a.from.localeCompare(b.from));
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000,
  );
}

/** `13:30` becomes `1.30pm`, the way the library writes times everywhere. */
export function formatTime(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const [rawHours, minutes] = value.split(':');
  const hours = Number(rawHours);
  if (Number.isNaN(hours) || minutes === undefined) {
    return value;
  }
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}.${minutes}${suffix}`;
}

/** "1.30pm – 5.00pm", or "Closed". */
export function formatRange(day: ResolvedDay): string {
  return day.closed ? 'Closed' : `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`;
}
