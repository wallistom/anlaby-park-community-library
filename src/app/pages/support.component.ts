import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeroComponent } from '../shared/page-hero.component';
import { CtaBandComponent } from '../shared/cta-band.component';
import { IconComponent, IconName } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { SITE } from '../core/site.data';

interface GivingOption {
  title: string;
  description: string;
  icon: IconName;
  action: string;
  /** Highlighted as the option we most want people to choose. */
  preferred?: boolean;
}

@Component({
  selector: 'app-support',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeroComponent, CtaBandComponent, IconComponent, RevealDirective],
  templateUrl: './support.component.html',
})
export class SupportComponent {
  protected readonly site = SITE;
  protected readonly annualCost = SITE.annualRunningCost.toLocaleString('en-GB');

  protected readonly givingOptions: GivingOption[] = [
    {
      title: 'A standing order',
      description:
        'A few pounds a month, paid automatically, is by far the most useful thing you can give us — it lets the trustees plan ahead instead of hoping.',
      icon: 'calendar',
      action: 'Ask in the library or email us for a standing order form',
      preferred: true,
    },
    {
      title: 'A one-off donation online',
      description:
        'Give a single amount by card through our online fundraising page. Quick, and no need to come in.',
      icon: 'heart',
      // TODO(content): link the trustees' PayPal fundraiser URL here.
      action: 'Ask us for the current online giving link',
    },
    {
      title: 'Cash in the library',
      description:
        'There is a donation tin on the counter, and every coin in it goes straight into running costs.',
      icon: 'pound',
      action: 'Pop in any time we are open',
    },
  ];

  protected readonly costs = [
    { label: 'Heating, lighting, and water', detail: 'Lighting and heating an older building.' },
    {
      label: 'Insurance and compliance',
      detail: 'Required of us as a charity and a public space.',
    },
    {
      label: 'Books, stock, and equipment',
      detail: 'Including the children’s and large-print collections.',
    },
    { label: 'Maintenance and repairs', detail: 'An older building needs constant attention.' },
    { label: 'Computers and connectivity', detail: 'Public network machines and free wi-fi.' },
  ];
}
