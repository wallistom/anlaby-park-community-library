import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { OpeningHoursService } from '../core/opening-hours.service';
import { EnquiryStatus, LibraryEvent } from '../core/models';
import { formatTime, upcomingExceptions } from '../core/opening-hours.model';
import { fromIso, toIso } from '../core/calendar';
import { ClubStatus, ENDING_SOON_DAYS, clubStatus, daysBetween, isClub } from './event-schedule';

interface ClubWarning {
  title: string;
  status: ClubStatus;
  lastDate: string;
  daysLeft: number;
}

function dayMonth(iso: string): string {
  return fromIso(iso)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) ?? iso;
}

@Component({
  selector: 'app-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, IconComponent],
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly hours = inject(OpeningHoursService);

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  private readonly events = signal<LibraryEvent[]>([]);
  private readonly statuses = signal<EnquiryStatus[]>([]);
  protected readonly trusteeCount = signal(0);

  private readonly todayIso = toIso(new Date());

  protected readonly firstName = computed(
    () => (this.auth.currentUser()?.name ?? '').trim().split(/\s+/)[0] || 'there',
  );

  protected readonly newEnquiries = computed(
    () => this.statuses().filter((status) => status === 'new').length,
  );
  protected readonly inProgress = computed(
    () => this.statuses().filter((status) => status === 'in_progress').length,
  );

  /** Drafts are counted on their own line, so these only count what the public can see. */
  private readonly clubs = computed(() =>
    this.events().filter((event) => isClub(event) && event.published),
  );

  protected readonly runningClubs = computed(
    () => this.clubs().filter((club) => clubStatus(club, this.todayIso) !== 'finished').length,
  );

  protected readonly upcomingOneOffs = computed(
    () =>
      this.events().filter(
        (event) => !isClub(event) && event.published && event.date >= this.todayIso,
      ).length,
  );

  protected readonly drafts = computed(
    () =>
      this.events().filter(
        (event) =>
          !event.published &&
          (isClub(event)
            ? clubStatus(event, this.todayIso) !== 'finished'
            : event.date >= this.todayIso),
      ).length,
  );

  /** Clubs ending soon, or finished in the last few weeks. Older ones were left to finish. */
  protected readonly clubWarnings = computed<ClubWarning[]>(() =>
    this.clubs()
      .filter(
        (club) =>
          club.repeatUntil &&
          clubStatus(club, this.todayIso) !== 'running' &&
          daysBetween(club.repeatUntil, this.todayIso) <= ENDING_SOON_DAYS,
      )
      .sort((a, b) => (a.repeatUntil ?? '').localeCompare(b.repeatUntil ?? ''))
      .map((club) => ({
        title: club.title,
        status: clubStatus(club, this.todayIso),
        lastDate: club.repeatUntil ?? '',
        daysLeft: daysBetween(this.todayIso, club.repeatUntil ?? this.todayIso),
      })),
  );

  protected readonly hoursState = this.hours.loadState;
  protected readonly today = this.hours.status;
  protected readonly notice = this.hours.notice;

  /** The current or next closure, in a sentence. */
  protected readonly nextChange = computed(() => {
    const change = upcomingExceptions(this.hours.settings().exceptions, this.todayIso)[0];
    if (!change) {
      return 'No closures or changed hours coming up.';
    }
    const hours = change.closed
      ? 'closed'
      : `open ${formatTime(change.opensAt)} – ${formatTime(change.closesAt)}`;
    if (change.from <= this.todayIso) {
      return change.to === this.todayIso
        ? `Today: ${change.reason}, ${hours}.`
        : `Now: ${change.reason}, ${hours} until ${dayMonth(change.to)}.`;
    }
    const when =
      change.from === change.to
        ? `on ${dayMonth(change.from)}`
        : `from ${dayMonth(change.from)} to ${dayMonth(change.to)}`;
    return `Coming up: ${change.reason}, ${hours} ${when}.`;
  });

  ngOnInit(): void {
    this.load();
  }

  protected retryHours(): void {
    this.hours.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      events: this.api.listAllEvents(),
      hire: this.api.listHireEnquiries(),
      volunteers: this.api.listVolunteerApplications(),
      messages: this.api.listContactMessages(),
      trustees: this.api.listTrustees(),
    }).subscribe({
      next: ({ events, hire, volunteers, messages, trustees }) => {
        this.events.set(events);
        this.statuses.set(
          [...hire, ...volunteers, ...messages].map((submission) => submission.status),
        );
        this.trusteeCount.set(trustees.length);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
}
