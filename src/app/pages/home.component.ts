import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { TimePipe } from '../shared/time.pipe';
import { HoursTableComponent } from '../shared/hours-table.component';
import { ImageFadeDirective } from '../shared/image-fade.directive';
import { OpeningHoursService } from '../core/opening-hours.service';
import { EventsService } from '../core/events.service';
import { FACILITIES, SITE } from '../core/site.data';
import { addDays, toIso } from '../core/calendar';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, IconComponent, HoursTableComponent, ImageFadeDirective, TimePipe],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  protected readonly hours = inject(OpeningHoursService);
  protected readonly events = inject(EventsService);

  protected readonly site = SITE;
  /**
   * The next seven days, day by day.
   *
   * Three arbitrary "next events" told nobody whether the library was worth a
   * visit tomorrow. A rolling week answers the question people actually ask,
   * and it reads the same whether the library runs one club a week or ten.
   */
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

  /**
   * Titles only, taken from the same source Visit Us renders in full — a
   * second hardcoded list here would drift the moment a service changed.
   */
  protected readonly offerings = FACILITIES.slice(0, 6);

  ngOnInit(): void {
    this.events.load();
  }
}
