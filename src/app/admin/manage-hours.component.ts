import {
  ChangeDetectionStrategy,
  Component,
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

  constructor() {
    effect(() => {
      if (this.seeded || this.hours.loadState() !== 'ready') {
        return;
      }
      this.seeded = true;
      this.seed();
    });
  }

  protected preview(day: PatternRow): string {
    return day.closed ? 'Closed' : `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`;
  }

  /** The exception as the public will read it. */
  protected exceptionPreview(entry: OpeningException): string {
    const when =
      entry.from === entry.to
        ? longDate(entry.from)
        : `${longDate(entry.from)} to ${longDate(entry.to)}`;
    const hours = entry.closed
      ? 'Closed'
      : `Open ${formatTime(entry.opensAt)} – ${formatTime(entry.closesAt)}`;
    const reason = entry.reason.trim();
    return `${hours}, ${when}${reason ? ` — ${reason}` : ''}`;
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
    this.state.set('idle');
    this.error.set(null);
  }

  protected save(): void {
    const settings: LibrarySettings = {
      pattern: this.pattern().map(({ name: _name, ...day }) => day),
      exceptions: this.exceptions(),
      notice: this.notice(),
    };

    if (settings.exceptions.some((entry) => !entry.reason.trim())) {
      this.error.set(
        'Each different day needs a reason, because the website shows it so people know why.',
      );
      this.state.set('error');
      return;
    }
    if (settings.notice.active && !settings.notice.title.trim()) {
      this.error.set('The notice needs a heading, or switch it off.');
      this.state.set('error');
      return;
    }

    this.state.set('saving');
    this.error.set(null);
    this.api.saveSettings(settings).subscribe({
      next: (saved) => {
        this.hours.apply(saved);
        this.seed();
        this.state.set('saved');
      },
      error: () => {
        this.state.set('error');
        this.error.set('We could not save that. Check your connection and try again.');
      },
    });
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
