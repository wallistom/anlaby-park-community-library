import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { toIso } from '../core/calendar';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** A pattern row with its name, so the template does not do lookups. */
interface PatternRow extends OpeningDayPattern {
  name: string;
}

/**
 * Opening hours, exceptions and the site notice.
 *
 * The whole lot saves as one record, so trustees press Save once and the hours
 * can never be left half-updated. Template-driven forms rather than reactive:
 * this is a small settings screen edited in place, and a FormArray for the
 * exceptions would be more machinery than the job needs.
 */
@Component({
  selector: 'app-manage-hours',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent],
  templateUrl: './manage-hours.component.html',
})
export class ManageHoursComponent {
  private readonly api = inject(ApiService);
  private readonly hours = inject(OpeningHoursService);

  protected readonly state = signal<SaveState>('idle');
  protected readonly error = signal<string | null>(null);
  protected readonly todayIso = toIso(new Date());

  /** Working copies, so nothing changes on the public site until Save. */
  protected readonly pattern = signal<PatternRow[]>(this.readPattern());
  protected readonly exceptions = signal<OpeningException[]>(
    structuredClone(this.hours.settings().exceptions),
  );
  protected readonly notice = signal<SiteNotice>({ ...this.hours.settings().notice });

  /** Past exceptions are kept but shown separately, so the list stays useful. */
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

  protected preview(day: PatternRow): string {
    return day.closed ? 'Closed' : `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`;
  }

  protected setClosed(dayIndex: number, closed: boolean): void {
    this.pattern.update((rows) =>
      rows.map((row) =>
        row.dayIndex === dayIndex
          ? {
              ...row,
              closed,
              // Give a newly opened day sensible times rather than blanks the
              // API would reject.
              opensAt: closed ? undefined : (row.opensAt ?? '09:30'),
              closesAt: closed ? undefined : (row.closesAt ?? '12:30'),
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
        // Keep the range valid as the dates are typed.
        if (next.to < next.from) {
          next.to = next.from;
        }
        if (!next.closed) {
          next.opensAt ??= '09:30';
          next.closesAt ??= '12:30';
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

  protected save(): void {
    const settings: LibrarySettings = {
      pattern: this.pattern().map(({ name: _name, ...day }) => day),
      exceptions: this.exceptions(),
      notice: this.notice(),
    };

    const missingReason = settings.exceptions.find((entry) => !entry.reason.trim());
    if (missingReason) {
      this.error.set(
        'Every exception needs a reason — it is shown on the website so people know why.',
      );
      this.state.set('error');
      return;
    }

    this.state.set('saving');
    this.error.set(null);
    this.api.saveSettings(settings).subscribe({
      next: (saved) => {
        // Push straight into the shared service so the rest of the admin area
        // and the public pages reflect the change without a reload.
        this.hours.apply(saved);
        this.exceptions.set(structuredClone(saved.exceptions));
        this.state.set('saved');
      },
      error: () => {
        this.state.set('error');
        this.error.set('We could not save that. Please try again.');
      },
    });
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
