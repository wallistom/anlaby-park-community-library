import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { EventsService } from '../core/events.service';
import { SITE } from '../core/site.data';
import { EventOccurrence } from '../core/models';

interface EventMonth {
  label: string;
  events: EventOccurrence[];
}

@Component({
  selector: 'app-whats-on',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    PageHeroComponent,
    CtaBandComponent,
    IconComponent,
    RevealDirective,
  ],
  templateUrl: './whats-on.component.html',
})
export class WhatsOnComponent implements OnInit {
  protected readonly events = inject(EventsService);
  protected readonly site = SITE;

  /** Upcoming events grouped under a month heading. */
  protected readonly months = computed<EventMonth[]>(() => {
    const groups = new Map<string, EventOccurrence[]>();

    for (const event of this.events.upcoming()) {
      const label = new Date(`${event.date}T00:00:00`).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      });
      const existing = groups.get(label);
      if (existing) {
        existing.push(event);
      } else {
        groups.set(label, [event]);
      }
    }

    return [...groups].map(([label, events]) => ({ label, events }));
  });

  ngOnInit(): void {
    this.events.load();
  }
}
