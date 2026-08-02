import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeroComponent } from '../shared/page-hero.component';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { ApiService } from '../core/api.service';
import { SITE, VOLUNTEER_ROLES } from '../core/site.data';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-volunteer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeroComponent, IconComponent, RevealDirective],
  templateUrl: './volunteer.component.html',
})
export class VolunteerComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly site = SITE;
  protected readonly roles = VOLUNTEER_ROLES;
  protected readonly state = signal<FormState>('idle');
  protected readonly submitted = signal(false);

  /** Roles the applicant has ticked. Held outside the form group because it is
      a checkbox set rather than a single control. */
  protected readonly selectedRoles = signal<string[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    availability: ['', Validators.required],
    message: [''],
  });

  protected toggleRole(role: string, checked: boolean): void {
    this.selectedRoles.update((roles) =>
      checked ? [...roles, role] : roles.filter((entry) => entry !== role),
    );
  }

  protected isSelected(role: string): boolean {
    return this.selectedRoles().includes(role);
  }

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
    this.api
      .submitVolunteerApplication({
        ...this.form.getRawValue(),
        interests: this.selectedRoles(),
      })
      .subscribe({
        next: () => this.state.set('success'),
        error: () => this.state.set('error'),
      });
  }
}
