import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../shared/page-hero.component';
import { SITE } from '../core/site.data';

/**
 * Privacy notice covering the data this site actually collects.
 *
 * TODO(legal): the trustees should have this checked before launch, and add a
 * retention period and a named data contact if they hold one.
 */
@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeroComponent],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent {
  protected readonly site = SITE;
}
