import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { OpeningHoursService } from '../core/opening-hours.service';
import { DAY_NAMES, WEEK_ORDER } from '../core/site.data';
import {
  LibrarySettings,
  OpeningDayPattern,
  OpeningException,
  SiteNotice,
  formatTime,
} from '../core/opening-hours.model';
import { fromIso, toIso } from '../core/calendar';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const NEW_DAY_OPENS = '09:30';
const NEW_DAY_CLOSES = '12:30';

interface PatternRow extends OpeningDayPattern {
  name: string;
}

/** Why a day's times cannot be saved, or null when they can. */
function timesProblem(day: {
  closed: boolean;
  opensAt?: string;
  closesAt?: string;
}): string | null {
  if (day.closed) {
    return null;
  }
  if (!day.opensAt || !day.closesAt) {
    return 'Set both an opening and a closing time.';
  }
  return day.closesAt <= day.opensAt ? 'The closing time must be after the opening time.' : null;
}

function longDate(iso: string): string {
  return (
    fromIso(iso)?.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) ?? iso
  );
}

@Component({
  selector: 'app-manage-hours',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './manage-hours.component.html',
})
export class ManageHoursComponent {
  private readonly api = inject(ApiService);
  private readonly hours = inject(OpeningHoursService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly state = signal<SaveState>('idle');
  protected readonly error = signal<string | null>(null);
  protected readonly todayIso = toIso(new Date());

  protected readonly loadState = this.hours.loadState;
  protected readonly ready = computed(() => this.loadState() === 'ready');

  protected readonly pattern = signal<PatternRow[]>(this.readPattern());
  protected readonly exceptions = signal<OpeningException[]>(
    structuredClone(this.hours.settings().exceptions),
  );
  protected readonly notice = signal<SiteNotice>({ ...this.hours.settings().notice });

  /** What was last loaded or saved, so unsaved edits can be spotted and undone. */
  private readonly baseline = signal('');
  private seeded = false;

  private readonly snapshot = computed(() =>
    JSON.stringify({
      pattern: this.pattern(),
      exceptions: this.exceptions(),
      notice: this.notice(),
    }),
  );

  protected readonly dirty = computed(() => this.ready() && this.snapshot() !== this.baseline());

  protected readonly upcomingExceptions = computed(() =>
    this.exceptions()
      .filter((e) => e.to >= this.todayIso)
      .sort((a, b) => a.from.localeCompare(b.from)),
  );

  protected readonly pastExceptions = computed(() =>
    this.exceptions()
      .filter((e) => e.to < this.todayIso)
      .sort((a, b) => b.from.localeCompare(a.from)),
  );

  /** Set by pressing Save, so a reason is not flagged as missing while it is still being typed. */
  protected readonly attempted = signal(false);

  /** Everything that would stop a save, worked out live so each message clears once it is fixed. */
  private readonly problems = computed(() => {
    const times = new Map<string, string>();
    for (const day of this.pattern()) {
      const problem = timesProblem(day);
      if (problem) {
        times.set(`day-${day.dayIndex}`, problem);
      }
    }
    const reasons = new Set<string>();
    for (const entry of this.upcomingExceptions()) {
      const problem = timesProblem(entry);
      if (problem) {
        times.set(`ex-${entry.exceptionId}`, problem);
      }
      if (!entry.reason.trim()) {
        reasons.add(entry.exceptionId);
      }
    }
    const noticeTitle = this.notice().active && !this.notice().title.trim();
    return { times, reasons, noticeTitle, count: times.size + reasons.size + Number(noticeTitle) };
  });

  protected readonly noticeTitleMissing = computed(
    () => this.attempted() && this.problems().noticeTitle,
  );

  /** What the save bar has to report: a blocked save or a failed one, otherwise nothing. */
  protected readonly barProblem = computed(() => {
    const count = this.problems().count;
    if (this.attempted() && count) {
      return count === 1
        ? 'One thing needs fixing before this can be saved. It is marked in red.'
        : `${count} things need fixing before this can be saved. They are marked in red.`;
    }
    return this.state() === 'error' ? this.error() : null;
  });

  protected readonly barTone = computed<'saved' | 'problem' | 'unsaved'>(() => {
    if (!this.dirty()) {
      return 'saved';
    }
    return this.barProblem() ? 'problem' : 'unsaved';
  });

  constructor() {
    effect(() => {
      if (this.seeded || this.hours.loadState() !== 'ready') {
        return;
      }
      this.seeded = true;
      this.seed();
    });
  }

  protected timeError(key: string): string | null {
    return this.problems().times.get(key) ?? null;
  }

  protected reasonMissing(id: string): boolean {
    return this.attempted() && this.problems().reasons.has(id);
  }

  protected retryLoad(): void {
    this.hours.load();
  }

  protected preview(day: PatternRow): string {
    return day.closed ? 'Closed' : `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`;
  }

  protected dateRange(entry: OpeningException): string {
    return entry.from === entry.to
      ? longDate(entry.from)
      : `${longDate(entry.from)} to ${longDate(entry.to)}`;
  }

  /** The exception as the public will read it. */
  protected exceptionPreview(entry: OpeningException): string {
    const hours = entry.closed
      ? 'Closed'
      : `Open ${formatTime(entry.opensAt)} – ${formatTime(entry.closesAt)}`;
    const reason = entry.reason.trim();
    return `${hours}, ${this.dateRange(entry)}${reason ? ` — ${reason}` : ''}`;
  }

  protected setClosed(dayIndex: number, closed: boolean): void {
    this.pattern.update((rows) =>
      rows.map((row) =>
        row.dayIndex === dayIndex
          ? {
              ...row,
              closed,
              opensAt: closed ? undefined : (row.opensAt ?? NEW_DAY_OPENS),
              closesAt: closed ? undefined : (row.closesAt ?? NEW_DAY_CLOSES),
            }
          : row,
      ),
    );
  }

  protected setTime(dayIndex: number, field: 'opensAt' | 'closesAt', value: string): void {
    this.pattern.update((rows) =>
      rows.map((row) => (row.dayIndex === dayIndex ? { ...row, [field]: value } : row)),
    );
  }

  protected addException(): void {
    this.exceptions.update((list) => [
      ...list,
      {
        exceptionId: `new-${list.length}-${this.todayIso}`,
        from: this.todayIso,
        to: this.todayIso,
        closed: true,
        reason: '',
      },
    ]);
  }

  protected updateException(id: string, patch: Partial<OpeningException>): void {
    this.exceptions.update((list) =>
      list.map((entry) => {
        if (entry.exceptionId !== id) {
          return entry;
        }
        const next = { ...entry, ...patch };
        // A single day stays a single day when its date moves, earlier or later.
        if (patch.from && entry.to === entry.from) {
          next.to = patch.from;
        }
        if (next.to < next.from) {
          next.to = next.from;
        }
        if (!next.closed) {
          next.opensAt ??= NEW_DAY_OPENS;
          next.closesAt ??= NEW_DAY_CLOSES;
        }
        return next;
      }),
    );
  }

  protected setNotice(patch: Partial<SiteNotice>): void {
    this.notice.update((current) => ({ ...current, ...patch }));
  }

  protected removeException(id: string): void {
    this.exceptions.update((list) => list.filter((entry) => entry.exceptionId !== id));
  }

  protected discard(): void {
    this.seed();
    this.attempted.set(false);
    this.state.set('idle');
    this.error.set(null);
  }

  protected save(): void {
    this.attempted.set(true);
    if (this.problems().count) {
      this.focusFirstProblem();
      return;
    }

    const settings: LibrarySettings = {
      pattern: this.pattern().map(({ name: _name, ...day }) => day),
      exceptions: this.exceptions(),
      notice: this.notice(),
    };

    this.state.set('saving');
    this.error.set(null);
    this.api.saveSettings(settings).subscribe({
      next: (saved) => {
        this.hours.apply(saved);
        this.seed();
        this.attempted.set(false);
        this.state.set('saved');
      },
      error: () => {
        this.state.set('error');
        this.error.set('We could not save that. Check your connection and try again.');
      },
    });
  }

  /** Brings the first field marked in red into view, wherever Save was pressed. */
  private focusFirstProblem(): void {
    afterNextRender(
      () => {
        const field = this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (!field) {
          return;
        }
        field.scrollIntoView({
          block: 'center',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        });
        field.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  private seed(): void {
    this.pattern.set(this.readPattern());
    this.exceptions.set(structuredClone(this.hours.settings().exceptions));
    this.notice.set({ ...this.hours.settings().notice });
    this.baseline.set(this.snapshot());
  }

  private readPattern(): PatternRow[] {
    const current = this.hours.settings().pattern;
    return WEEK_ORDER.map((dayIndex) => {
      const day = current.find((entry) => entry.dayIndex === dayIndex);
      return {
        dayIndex,
        name: DAY_NAMES[dayIndex],
        closed: day?.closed ?? true,
        opensAt: day?.opensAt,
        closesAt: day?.closesAt,
      };
    });
  }
}
