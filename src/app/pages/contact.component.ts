import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { OpeningHoursService } from '../core/opening-hours.service';
import { ADDRESS_ONE_LINE, SITE } from '../core/site.data';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, PageHeroComponent, IconComponent],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private readonly api = inject(ApiService);
  protected readonly hours = inject(OpeningHoursService);
  private readonly fb = inject(FormBuilder);

  protected readonly site = SITE;
  protected readonly addressOneLine = ADDRESS_ONE_LINE;
  protected readonly googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_ONE_LINE)}`;

  protected readonly state = signal<FormState>('idle');
  protected readonly submitted = signal(false);

  protected readonly subjects = [
    'General enquiry',
    'Joining the library',
    'Activities and clubs',
    'Room hire',
    'Volunteering',
    'Donations and fundraising',
    'Something else',
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['General enquiry', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return (this.submitted() || field.touched) && field.invalid;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      const firstInvalid = Object.keys(this.form.controls).find(
        (key) => this.form.get(key)?.invalid,
      );
      if (firstInvalid) {
        document.getElementById(firstInvalid)?.focus();
      }
      return;
    }

    this.state.set('submitting');
    this.api.submitContactMessage(this.form.getRawValue()).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error'),
    });
  }
}
