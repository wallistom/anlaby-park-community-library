import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { ContactMessage, EnquiryStatus, HireEnquiry, VolunteerApplication } from '../core/models';
import { SITE } from '../core/site.data';
import { fromIso } from '../core/calendar';

type Tab = 'hire' | 'volunteers' | 'messages';

interface Row {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: EnquiryStatus;
  submittedAt: string;
  heading: string;
  replySubject: string;
  details: { label: string; value: string }[];
  body?: string;
}

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  closed: 'Done',
};

@Component({
  selector: 'app-enquiries',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IconComponent],
  templateUrl: './enquiries.component.html',
})
export class EnquiriesComponent implements OnInit {
  private readonly api = inject(ApiService);

  private readonly hire = signal<HireEnquiry[]>([]);
  private readonly volunteers = signal<VolunteerApplication[]>([]);
  private readonly messages = signal<ContactMessage[]>([]);

  protected readonly activeTab = signal<Tab>('hire');
  protected readonly expandedId = signal<string | null>(null);
  protected readonly showDone = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly updateError = signal(false);

  protected readonly statusLabels = STATUS_LABELS;

  protected readonly tabs: { value: Tab; label: string }[] = [
    { value: 'hire', label: 'Room hire' },
    { value: 'volunteers', label: 'Volunteers' },
    { value: 'messages', label: 'Messages' },
  ];

  protected readonly rows = computed<Row[]>(() => {
    switch (this.activeTab()) {
      case 'hire':
        return this.hire().map((item) => ({
          id: item.enquiryId,
          name: item.name,
          email: item.email,
          phone: item.phone,
          status: item.status,
          submittedAt: item.submittedAt,
          heading: item.organisation || 'Room hire enquiry',
          replySubject: `Your room hire enquiry — ${SITE.name}`,
          details: [
            { label: 'Date wanted', value: longDate(item.preferredDate) },
            { label: 'How often', value: item.frequency },
            { label: 'How many people', value: String(item.attendees) },
          ],
          body: item.message,
        }));
      case 'volunteers':
        return this.volunteers().map((item) => ({
          id: item.applicationId,
          name: item.name,
          email: item.email,
          phone: item.phone,
          status: item.status,
          submittedAt: item.submittedAt,
          heading: 'Would like to volunteer',
          replySubject: `Volunteering at ${SITE.name}`,
          details: [
            { label: 'When they are free', value: item.availability },
            { label: 'Interested in', value: item.interests.join(', ') || 'No preference given' },
          ],
          body: item.message,
        }));
      case 'messages':
        return this.messages().map((item) => ({
          id: item.messageId,
          name: item.name,
          email: item.email,
          status: item.status,
          submittedAt: item.submittedAt,
          heading: item.subject,
          replySubject: `Re: ${item.subject}`,
          details: [],
          body: item.message,
        }));
    }
  });

  protected readonly visibleRows = computed(() =>
    this.showDone() ? this.rows() : this.rows().filter((row) => row.status !== 'closed'),
  );

  protected readonly counts = computed(() => ({
    new: this.rows().filter((row) => row.status === 'new').length,
    inProgress: this.rows().filter((row) => row.status === 'in_progress').length,
    done: this.rows().filter((row) => row.status === 'closed').length,
  }));

  protected readonly newCounts = computed(() => ({
    hire: this.hire().filter((item) => item.status === 'new').length,
    volunteers: this.volunteers().filter((item) => item.status === 'new').length,
    messages: this.messages().filter((item) => item.status === 'new').length,
  }));

  ngOnInit(): void {
    forkJoin({
      hire: this.api.listHireEnquiries(),
      volunteers: this.api.listVolunteerApplications(),
      messages: this.api.listContactMessages(),
    }).subscribe({
      next: ({ hire, volunteers, messages }) => {
        this.hire.set(sortNewestFirst(hire, 'submittedAt'));
        this.volunteers.set(sortNewestFirst(volunteers, 'submittedAt'));
        this.messages.set(sortNewestFirst(messages, 'submittedAt'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected switchTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.expandedId.set(null);
  }

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected mailto(row: Row): string {
    return `mailto:${row.email}?subject=${encodeURIComponent(row.replySubject)}`;
  }

  protected setStatus(row: Row, status: EnquiryStatus): void {
    const kind =
      this.activeTab() === 'hire'
        ? 'hire-enquiries'
        : this.activeTab() === 'volunteers'
          ? 'volunteers'
          : 'messages';

    this.updateError.set(false);
    this.api.updateSubmissionStatus(kind, row.id, status).subscribe({
      next: () => this.applyStatusLocally(row.id, status),
      error: () => this.updateError.set(true),
    });
  }

  private applyStatusLocally(id: string, status: EnquiryStatus): void {
    switch (this.activeTab()) {
      case 'hire':
        this.hire.update((items) =>
          items.map((item) => (item.enquiryId === id ? { ...item, status } : item)),
        );
        break;
      case 'volunteers':
        this.volunteers.update((items) =>
          items.map((item) => (item.applicationId === id ? { ...item, status } : item)),
        );
        break;
      case 'messages':
        this.messages.update((items) =>
          items.map((item) => (item.messageId === id ? { ...item, status } : item)),
        );
        break;
    }
  }
}

function longDate(iso: string): string {
  return (
    fromIso(iso)?.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) ?? iso
  );
}

function sortNewestFirst<T>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => String(b[key]).localeCompare(String(a[key])));
}
