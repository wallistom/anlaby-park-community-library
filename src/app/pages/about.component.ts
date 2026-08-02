import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeroComponent } from '../shared/page-hero.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { SITE, TRUSTEES } from '../core/site.data';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeroComponent, CtaBandComponent, IconComponent, RevealDirective],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  protected readonly site = SITE;
  protected readonly trustees = TRUSTEES;

  protected readonly timeline = [
    {
      year: '2013',
      title: 'Earmarked for closure',
      body: 'Hull City Council listed the library among those it could no longer run. Local people decided that was not going to be the end of it.',
    },
    {
      year: '2014',
      title: 'A charity is formed',
      body: `We became a Charitable Incorporated Organisation in ${SITE.charityStatusFrom}, registered charity number ${SITE.charityNumber}, which gave us the standing to negotiate properly.`,
    },
    {
      year: '2014',
      title: 'The lease is signed',
      body: 'In August we signed the lease with the council and took the building on. The doors stayed open.',
    },
    {
      year: 'Today',
      title: 'Flourishing',
      body: `A full library service run in partnership with Hull City Council, kept going by more than ${SITE.volunteerCount} volunteer library assistants.`,
    },
  ];

  protected readonly responsibilities = [
    'Looking after the charity’s money and reporting on it',
    'Meeting our legal and regulatory duties',
    'Setting the policies the library runs by',
    'Recruiting, training, and supporting volunteers',
    'Fundraising, and managing our partnerships',
    'Maintaining and improving the building',
    'Keeping an eye on how the library is used, so it keeps serving the people who need it',
  ];
}
