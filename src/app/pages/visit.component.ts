import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { HoursTableComponent } from '../shared/hours-table.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { OpeningHoursService } from '../core/opening-hours.service';
import { ADDRESS_ONE_LINE, FACILITIES, SITE } from '../core/site.data';

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
  ],
  templateUrl: './visit.component.html',
})
export class VisitComponent {
  protected readonly hours = inject(OpeningHoursService);

  protected readonly site = SITE;
  protected readonly facilities = FACILITIES;
  protected readonly addressOneLine = ADDRESS_ONE_LINE;

  /** Deep links that work from a postcode, so no coordinates are guessed. */
  protected readonly googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_ONE_LINE)}`;
  protected readonly appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(ADDRESS_ONE_LINE)}`;

  protected readonly accessNotes = [
    'Step-free wheelchair access throughout the building',
    'A hearing loop at the counter',
    'An accessible toilet',
    'Large-print books and audiobooks for readers who need them',
  ];
}
