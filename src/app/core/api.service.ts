import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LibrarySettings } from './opening-hours.model';
import {
  ContactMessage,
  EnquiryStatus,
  EventOccurrence,
  HireEnquiry,
  LibraryEvent,
  TrusteeAccount,
  VolunteerApplication,
} from './models';

export type HireEnquiryInput = Omit<HireEnquiry, 'enquiryId' | 'status' | 'submittedAt'>;
export type VolunteerApplicationInput = Omit<
  VolunteerApplication,
  'applicationId' | 'status' | 'submittedAt'
>;
export type ContactMessageInput = Omit<ContactMessage, 'messageId' | 'status' | 'submittedAt'>;
export type EventInput = Omit<LibraryEvent, 'eventId'>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  listPublicEvents(): Observable<EventOccurrence[]> {
    return this.http.get<EventOccurrence[]>(`${this.base}/events`);
  }

  submitHireEnquiry(input: HireEnquiryInput): Observable<{ enquiryId: string }> {
    return this.http.post<{ enquiryId: string }>(`${this.base}/hire-enquiries`, input);
  }

  submitVolunteerApplication(
    input: VolunteerApplicationInput,
  ): Observable<{ applicationId: string }> {
    return this.http.post<{ applicationId: string }>(`${this.base}/volunteers`, input);
  }

  submitContactMessage(input: ContactMessageInput): Observable<{ messageId: string }> {
    return this.http.post<{ messageId: string }>(`${this.base}/messages`, input);
  }

  saveSettings(settings: LibrarySettings): Observable<LibrarySettings> {
    return this.http.put<LibrarySettings>(`${this.base}/admin/settings`, settings);
  }

  listAllEvents(): Observable<LibraryEvent[]> {
    return this.http.get<LibraryEvent[]>(`${this.base}/admin/events`);
  }

  createEvent(input: EventInput): Observable<LibraryEvent> {
    return this.http.post<LibraryEvent>(`${this.base}/admin/events`, input);
  }

  updateEvent(eventId: string, input: EventInput): Observable<LibraryEvent> {
    return this.http.put<LibraryEvent>(
      `${this.base}/admin/events/${encodeURIComponent(eventId)}`,
      input,
    );
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/events/${encodeURIComponent(eventId)}`);
  }

  listHireEnquiries(): Observable<HireEnquiry[]> {
    return this.http.get<HireEnquiry[]>(`${this.base}/admin/hire-enquiries`);
  }

  listVolunteerApplications(): Observable<VolunteerApplication[]> {
    return this.http.get<VolunteerApplication[]>(`${this.base}/admin/volunteers`);
  }

  listContactMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.base}/admin/messages`);
  }

  updateSubmissionStatus(
    kind: 'hire-enquiries' | 'volunteers' | 'messages',
    id: string,
    status: EnquiryStatus,
  ): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/${kind}/${encodeURIComponent(id)}`, {
      status,
    });
  }

  listTrustees(): Observable<TrusteeAccount[]> {
    return this.http.get<TrusteeAccount[]>(`${this.base}/admin/trustees`);
  }

  addTrustee(input: { email: string; name: string }): Observable<TrusteeAccount> {
    return this.http.post<TrusteeAccount>(`${this.base}/admin/trustees`, input);
  }

  removeTrustee(email: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/trustees/${encodeURIComponent(email)}`);
  }
}
