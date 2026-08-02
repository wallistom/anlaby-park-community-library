import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeroComponent } from '../shared/page-hero.component';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { SITE } from '../core/site.data';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-room-hire',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeroComponent, IconComponent],
  templateUrl: './room-hire.component.html',
})
export class RoomHireComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly site = SITE;
  protected readonly state = signal<FormState>('idle');
  protected readonly submitted = signal(false);
  /** Today in ISO form, used as the `min` on the date picker. */
  protected readonly todayIso = new Date().toISOString().slice(0, 10);

  protected readonly suitableFor = [
    'Classes and workshops',
    'Club and society meetings',
    'Community and residents’ groups',
    'Children’s parties and family occasions',
    'Training sessions and away-days',
    'Regular weekly or monthly bookings',
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    organisation: [''],
    preferredDate: ['', Validators.required],
    frequency: ['One-off booking', Validators.required],
    attendees: [10, [Validators.required, Validators.min(1), Validators.max(200)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return (this.submitted() || field.touched) && field.invalid;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.focusFirstError();
      return;
    }

    this.state.set('submitting');
    this.api.submitHireEnquiry(this.form.getRawValue()).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error'),
    });
  }

  /** Moves keyboard focus to the first field with a problem. */
  private focusFirstError(): void {
    const firstInvalid = Object.keys(this.form.controls).find((key) => this.form.get(key)?.invalid);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
    }
  }
}
