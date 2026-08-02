import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { ACTIVITIES, ACTIVITY_CATEGORY_LABELS, SITE } from '../core/site.data';

/**
 * The standing clubs and groups.
 *
 * There is no filter control: ten items fit on one screen, so filtering was
 * interaction for its own sake. Anything with a date belongs on What's On.
 */
@Component({
  selector: 'app-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeroComponent, CtaBandComponent, IconComponent, RevealDirective],
  templateUrl: './activities.component.html',
})
export class ActivitiesComponent {
  protected readonly site = SITE;
  protected readonly categoryLabels = ACTIVITY_CATEGORY_LABELS;
  protected readonly activities = ACTIVITIES;
}
