import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { LibraryEvent, RECURRENCE_LABELS, Recurrence } from '../core/models';

@Component({
  selector: 'app-manage-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, IconComponent],
  templateUrl: './manage-events.component.html',
})
export class ManageEventsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly events = signal<LibraryEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly recurrenceOptions = (Object.keys(RECURRENCE_LABELS) as Recurrence[]).map(
    (value) => ({ value, label: RECURRENCE_LABELS[value] }),
  );

  protected readonly form = this.fb.nonNullable.group({
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
  });

  protected readonly repeats = signal(false);

  constructor() {
    this.form.controls.recurrence.valueChanges.subscribe((value) => {
      const isRepeating = value !== 'none';
      this.repeats.set(isRepeating);

      const control = this.form.controls.repeatUntil;
      if (isRepeating) {
        control.addValidators(Validators.required);
      } else {
        control.removeValidators(Validators.required);
        control.setValue('');
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.refresh();
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return (this.submitted() || field.touched) && field.invalid;
  }

  protected startAdding(): void {
    this.form.reset({ location: 'The Greenway', published: true, recurrence: 'none' });
    this.submitted.set(false);
    this.editingId.set('');
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
    this.submitted.set(false);
    this.editingId.set(event.eventId);
  }

  protected repeatSummary(event: LibraryEvent): string | null {
    if (!event.recurrence || event.recurrence === 'none') {
      return null;
    }
    const label = RECURRENCE_LABELS[event.recurrence];
    return event.repeatUntil ? `${label}, until ${event.repeatUntil}` : label;
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
    this.saving.set(true);
    this.error.set(null);

    const request = id ? this.api.updateEvent(id, payload) : this.api.createEvent(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.refresh();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('We could not save that event. Please try again.');
      },
    });
  }

  protected remove(event: LibraryEvent): void {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) {
      return;
    }
    this.api.deleteEvent(event.eventId).subscribe({
      next: () => this.refresh(),
      error: () => this.error.set('We could not delete that event. Please try again.'),
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.api.listAllEvents().subscribe({
      next: (events) => {
        this.events.set([...events].sort((a, b) => a.date.localeCompare(b.date)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'We could not load your events. The API may not be deployed yet, or your session may have expired.',
        );
      },
    });
  }
}
