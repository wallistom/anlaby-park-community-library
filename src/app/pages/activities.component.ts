import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { ACTIVITIES, SITE } from '../core/site.data';

@Component({
  selector: 'app-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeroComponent, CtaBandComponent, IconComponent, RevealDirective],
  templateUrl: './activities.component.html',
})
export class ActivitiesComponent {
  protected readonly site = SITE;
  protected readonly ownGroups = ACTIVITIES.filter((activity) => activity.category === 'regular');
  protected readonly visitingGroups = ACTIVITIES.filter(
    (activity) => activity.category === 'external',
  );
}
