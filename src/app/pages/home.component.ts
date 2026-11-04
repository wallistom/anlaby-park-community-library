import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { TimePipe } from '../shared/time.pipe';
import { HoursTableComponent } from '../shared/hours-table.component';
import { ImageFadeDirective } from '../shared/image-fade.directive';
import { CtaBandComponent } from '../shared/cta-band.component';
import { RevealDirective } from '../shared/reveal.directive';
import { OpeningHoursService } from '../core/opening-hours.service';
import { EventsService } from '../core/events.service';
import { FACILITIES, MAP_LINKS, SITE } from '../core/site.data';
import { addDays, toIso } from '../core/calendar';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    IconComponent,
    HoursTableComponent,
    ImageFadeDirective,
    TimePipe,
    CtaBandComponent,
    RevealDirective,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  protected readonly hours = inject(OpeningHoursService);
  protected readonly events = inject(EventsService);

  protected readonly site = SITE;
  protected readonly mapLinks = MAP_LINKS;
  protected readonly comingDays = computed(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, offset) => {
      const date = addDays(today, offset);
      return {
        date,
        iso: toIso(date),
        isToday: offset === 0,
        events: this.events.eventsOn(toIso(date)),
      };
    }).filter((day) => day.events.length > 0);
  });

  protected readonly offerings = FACILITIES.slice(0, 6);
  protected readonly access = FACILITIES.find((item) => item.icon === 'accessible');

  ngOnInit(): void {
    this.events.load();
  }
}
