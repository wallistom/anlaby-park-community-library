import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from '../shared/icon.component';
import { OpeningHoursService } from '../core/opening-hours.service';
import { SITE } from '../core/site.data';

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "What's On", path: '/whats-on' },
  { label: 'Activities', path: '/activities' },
  { label: 'Visit Us', path: '/visit' },
  { label: 'Room Hire', path: '/room-hire' },
  { label: 'Volunteer', path: '/volunteer' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  protected readonly hours = inject(OpeningHoursService);

  protected readonly site = SITE;
  protected readonly navItems = NAV_ITEMS;
  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);

  constructor() {
    // Close the drawer on navigation so the menu never lingers over a new page.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.lockBodyScroll(this.menuOpen());
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    this.lockBodyScroll(false);
  }

  /** Stops the page scrolling behind the open mobile drawer. */
  private lockBodyScroll(locked: boolean): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = locked ? 'hidden' : '';
    }
  }
}
