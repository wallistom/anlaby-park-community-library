import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { map } from 'rxjs';
import { IconComponent } from '../shared/icon.component';
import { TimePipe } from '../shared/time.pipe';
import { ApiService } from '../core/api.service';
import { LibraryEvent, RECURRENCE_LABELS, Recurrence } from '../core/models';
import { fromIso, toIso } from '../core/calendar';
import {
  ClubStatus,
  clubStatus,
  compareClubs,
  daysBetween,
  isClub,
  scheduleLabel,
} from './event-schedule';

interface Notice {
  text: string;
  showLink: boolean;
}

function repeatRules(group: AbstractControl): ValidationErrors | null {
  const { recurrence, date, repeatUntil } = group.value as {
    recurrence: Recurrence;
    date: string;
    repeatUntil: string;
  };
  if (recurrence === 'none') {
    return null;
  }
  if (!repeatUntil) {
    return { repeatUntilMissing: true };
  }
  if (date && repeatUntil < date) {
    return { repeatUntilBeforeDate: true };
  }
  return null;
}

function formatDate(iso: string): string {
  return (
    fromIso(iso)?.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) ?? iso
  );
}

@Component({
  selector: 'app-manage-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, NgTemplateOutlet, IconComponent, TimePipe],
  templateUrl: './manage-events.component.html',
})
export class ManageEventsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);
  private readonly formPanel = viewChild<ElementRef<HTMLElement>>('formPanel');

  protected readonly events = signal<LibraryEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly confirmingId = signal<string | null>(null);
  /** The event whose delete request is in flight; its row is dimmed and locked. */
  protected readonly busyId = signal<string | null>(null);

  protected readonly todayIso = toIso(new Date());

  private readonly clubs = computed(() => this.events().filter(isClub).sort(compareClubs));

  protected readonly activeClubs = computed(() =>
    this.clubs().filter((club) => clubStatus(club, this.todayIso) !== 'finished'),
  );

  protected readonly finishedClubs = computed(() =>
    this.clubs()
      .filter((club) => clubStatus(club, this.todayIso) === 'finished')
      .sort((a, b) => (b.repeatUntil ?? '').localeCompare(a.repeatUntil ?? '')),
  );

  protected readonly upcoming = computed(() =>
    this.events()
      .filter((event) => !isClub(event) && event.date >= this.todayIso)
      .sort((a, b) => a.date.localeCompare(b.date)),
  );

  protected readonly past = computed(() =>
    this.events()
      .filter((event) => !isClub(event) && event.date < this.todayIso)
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  protected readonly recurrenceOptions = (Object.keys(RECURRENCE_LABELS) as Recurrence[]).map(
    (value) => ({ value, label: RECURRENCE_LABELS[value] }),
  );

  protected readonly form = this.fb.nonNullable.group(
    {
      title: ['', Validators.required],
      date: ['', Validators.required],
      startTime: [''],
      endTime: [''],
      description: ['', Validators.required],
      location: ['The Greenway', Validators.required],
      cost: [''],
      published: [true],
      recurrence: ['none' as Recurrence, Validators.required],
      repeatUntil: [''],
    },
    { validators: repeatRules },
  );

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly repeats = computed(() => this.formValue().recurrence !== 'none');

  /** A plain-English line describing what the repeat settings will put on the website. */
  protected readonly repeatPreview = computed(() => {
    const value = this.formValue();
    if (value.recurrence === 'none') {
      return 'Pick how often it happens to turn this into a regular club or group.';
    }
    if (!fromIso(value.date)) {
      return 'Choose the first date. It will then be shown on every date after it, up to the last date.';
    }
    const until = fromIso(value.repeatUntil) ? ` until ${formatDate(value.repeatUntil)}` : '';
    return `${scheduleLabel(value)}, from ${formatDate(value.date)}${until}. Change this one entry and every date on the website updates.`;
  });

  ngOnInit(): void {
    this.load();
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return (this.submitted() || field.touched) && field.invalid;
  }

  protected repeatUntilError(): string | null {
    const control = this.form.controls.repeatUntil;
    if (!this.submitted() && !control.touched) {
      return null;
    }
    if (this.form.hasError('repeatUntilMissing')) {
      return 'Please say when the last date is.';
    }
    if (this.form.hasError('repeatUntilBeforeDate')) {
      return 'The last date cannot be before the first date.';
    }
    return null;
  }

  protected startAdding(): void {
    this.form.reset({ location: 'The Greenway', published: true, recurrence: 'none' });
    this.editingId.set('');
    this.openForm();
  }

  protected startEditing(event: LibraryEvent): void {
    this.form.setValue({
      title: event.title,
      date: event.date,
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
      description: event.description,
      location: event.location,
      cost: event.cost ?? '',
      published: event.published,
      recurrence: event.recurrence ?? 'none',
      repeatUntil: event.repeatUntil ?? '',
    });
    this.editingId.set(event.eventId);
    this.openForm();
  }

  protected cancel(): void {
    this.editingId.set(null);
    this.submitted.set(false);
  }

  protected save(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      return;
    }

    const id = this.editingId();
    const payload = this.form.getRawValue();
    if (payload.recurrence === 'none') {
      payload.repeatUntil = '';
    }
    this.saving.set(true);
    this.error.set(null);

    const request = id ? this.api.updateEvent(id, payload) : this.api.createEvent(payload);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.editingId.set(null);
        this.events.update((list) =>
          id
            ? list.map((event) => (event.eventId === saved.eventId ? saved : event))
            : [...list, saved],
        );
        this.notice.set(
          saved.published
            ? { text: `“${saved.title}” is saved and on the What's On page now.`, showLink: true }
            : {
                text: `“${saved.title}” is saved as a draft. It will not be on the website until you tick “Show on the website”.`,
                showLink: false,
              },
        );
      },
      error: () => {
        this.saving.set(false);
        this.error.set('We could not save that event. Check your connection and try again.');
      },
    });
  }

  protected remove(event: LibraryEvent): void {
    this.confirmingId.set(null);
    this.busyId.set(event.eventId);
    this.error.set(null);
    this.api.deleteEvent(event.eventId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.events.update((list) => list.filter((item) => item.eventId !== event.eventId));
        this.notice.set({ text: `“${event.title}” has been deleted.`, showLink: false });
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('We could not delete that event. Check your connection and try again.');
      },
    });
  }

  /** The short label on a club's time tile: the weekday, or how often for daily and monthly. */
  protected tileLabel(event: LibraryEvent): string {
    switch (event.recurrence) {
      case 'daily':
        return 'Daily';
      case 'monthly':
        return 'Monthly';
      default:
        return fromIso(event.date)?.toLocaleDateString('en-GB', { weekday: 'short' }) ?? '';
    }
  }

  protected status(event: LibraryEvent): ClubStatus {
    return clubStatus(event, this.todayIso);
  }

  protected schedule(event: LibraryEvent): string {
    return scheduleLabel(event);
  }

  protected daysLeft(event: LibraryEvent): number {
    return event.repeatUntil ? daysBetween(this.todayIso, event.repeatUntil) : 0;
  }

  private openForm(): void {
    this.submitted.set(false);
    this.confirmingId.set(null);
    this.notice.set(null);
    afterNextRender(
      () => {
        const panel = this.formPanel()?.nativeElement;
        if (!panel) {
          return;
        }
        panel.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
          block: 'start',
        });
        panel.querySelector<HTMLElement>('#title')?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  private load(): void {
    this.loading.set(true);
    this.api.listAllEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'We could not load your events. Check your connection and reload the page. If it keeps happening, sign out and back in.',
        );
      },
    });
  }
}
