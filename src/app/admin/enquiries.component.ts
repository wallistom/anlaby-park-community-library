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

type Tab = 'hire' | 'volunteers' | 'messages';

/** A submission flattened into the shape the list renders. */
interface Row {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: EnquiryStatus;
  submittedAt: string;
  heading: string;
  /** Label/value pairs shown when the row is expanded. */
  details: { label: string; value: string }[];
  body?: string;
}

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
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

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
          details: [
            { label: 'Date wanted', value: item.preferredDate },
            { label: 'How often', value: item.frequency },
            { label: 'Attendees', value: String(item.attendees) },
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
          heading: 'Volunteer enquiry',
          details: [
            { label: 'Availability', value: item.availability },
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
          details: [],
          body: item.message,
        }));
    }
  });

  /** Unhandled count per tab, so the badge is visible before you click in. */
  protected readonly newCounts = computed(() => ({
    hire: this.hire().filter((item) => item.status === 'new').length,
    volunteers: this.volunteers().filter((item) => item.status === 'new').length,
    messages: this.messages().filter((item) => item.status === 'new').length,
  }));

  protected readonly newCount = computed(
    () => this.rows().filter((row) => row.status === 'new').length,
  );

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
        this.error.set(true);
      },
    });
  }

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected setStatus(row: Row, status: EnquiryStatus): void {
    const kind =
      this.activeTab() === 'hire'
        ? 'hire-enquiries'
        : this.activeTab() === 'volunteers'
          ? 'volunteers'
          : 'messages';

    this.api.updateSubmissionStatus(kind, row.id, status).subscribe({
      // Update locally rather than refetching everything for one status change.
      next: () => this.applyStatusLocally(row.id, status),
      error: () => this.error.set(true),
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

function sortNewestFirst<T>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => String(b[key]).localeCompare(String(a[key])));
}
