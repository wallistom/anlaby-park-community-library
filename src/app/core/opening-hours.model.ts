export interface OpeningDayPattern {
  dayIndex: number;
  closed: boolean;
  opensAt?: string;
  closesAt?: string;
}

export interface OpeningException {
  exceptionId: string;
  from: string;
  to: string;
  closed: boolean;
  opensAt?: string;
  closesAt?: string;
  reason: string;
}

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

export interface ResolvedDay {
  iso: string;
  closed: boolean;
  opensAt?: string;
  closesAt?: string;
  reason?: string;
  isException: boolean;
}

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

export function sortExceptions(exceptions: OpeningException[]): OpeningException[] {
  return [...exceptions].sort((a, b) => {
    const spanA = daysBetween(a.from, a.to);
    const spanB = daysBetween(b.from, b.to);
    return spanA !== spanB ? spanA - spanB : a.from.localeCompare(b.from);
  });
}

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

export function formatRange(day: ResolvedDay): string {
  return day.closed ? 'Closed' : `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`;
}
