import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { ADDRESS_ONE_LINE, SITE } from '../core/site.data';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  protected readonly site = SITE;
  protected readonly addressOneLine = ADDRESS_ONE_LINE;
  protected readonly year = new Date().getFullYear();

  protected readonly exploreLinks = [
    { label: "What's On", path: '/whats-on' },
    { label: 'Activities & Clubs', path: '/activities' },
    { label: 'Visit Us', path: '/visit' },
    { label: 'Room Hire', path: '/room-hire' },
  ];

  protected readonly supportLinks = [
    { label: 'Donate', path: '/support' },
    { label: 'Volunteer With Us', path: '/volunteer' },
    { label: 'About the Trust', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];
}
