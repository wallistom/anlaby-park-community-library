import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { HoursTableComponent } from '../shared/hours-table.component';
import { RevealDirective } from '../shared/reveal.directive';
import { OpeningHoursService } from '../core/opening-hours.service';
import { EventsService } from '../core/events.service';
import { FACILITIES, SITE } from '../core/site.data';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, IconComponent, HoursTableComponent, RevealDirective],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  protected readonly hours = inject(OpeningHoursService);
  protected readonly events = inject(EventsService);

  protected readonly site = SITE;
  protected readonly nextEvents = computed(() => this.events.upcoming().slice(0, 3));

  /**
   * Titles only, taken from the same source Visit Us renders in full — a
   * second hardcoded list here would drift the moment a service changed.
   */
  protected readonly offerings = FACILITIES.slice(0, 6);

  ngOnInit(): void {
    this.events.load();
  }
}
