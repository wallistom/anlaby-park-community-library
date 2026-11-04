import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { HoursTableComponent } from '../shared/hours-table.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { ImageFadeDirective } from '../shared/image-fade.directive';
import { FACILITIES, MAP_LINKS, SITE } from '../core/site.data';

@Component({
  selector: 'app-visit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeroComponent,
    HoursTableComponent,
    CtaBandComponent,
    IconComponent,
    RevealDirective,
    ImageFadeDirective,
  ],
  templateUrl: './visit.component.html',
})
export class VisitComponent {
  protected readonly site = SITE;
  protected readonly facilities = FACILITIES;

  protected readonly googleMapsUrl = MAP_LINKS.google;
  protected readonly appleMapsUrl = MAP_LINKS.apple;

  protected readonly accessNotes = [
    'Step-free wheelchair access throughout the building',
    'A hearing loop at the counter',
    'An accessible toilet',
    'Large-print books and audiobooks for readers who need them',
  ];
}
