/** Shared domain types for the public site and the trustee admin area. */

import { IconName } from '../shared/icon.component';

export interface OpeningDay {
  day: string;
  /** Human-readable hours, or null when the library is closed that day. */
  hours: string | null;
  /** Index matching `Date.prototype.getDay()` so we can highlight today. */
  dayIndex: number;
  /** Opening time in minutes from midnight; omitted when closed. */
  opensAt?: number;
  /** Closing time in minutes from midnight; omitted when closed. */
  closesAt?: number;
}

export interface Trustee {
  name: string;
  /** Officer role where one is held; undefined for general trustees. */
  role?: string;
}

export interface Facility {
  title: string;
  description: string;
  /** Key of an icon in the shared icon component. */
  icon: IconName;
  /** Set when the service carries a charge, so we never imply it is free. */
  note?: string;
}

/**
 * A club or group the library runs.
 *
 * Deliberately carries no days or times: those are published as recurring
 * events, so "What's On" is the single place a schedule can come from.
 */
export interface Activity {
  name: string;
  description: string;
  /** Broad grouping used for the filter controls on the Activities page. */
  category: ActivityCategory;
}

export type ActivityCategory = 'regular' | 'external';

export interface VolunteerRole {
  title: string;
  description: string;
}

/** How often an event repeats. */
export type Recurrence = 'none' | 'daily' | 'weekly' | 'fortnightly' | 'monthly';

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: 'One-off — does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  fortnightly: 'Every two weeks',
  monthly: 'Every month',
};

/**
 * An event as stored in DynamoDB.
 *
 * A repeating group — Baby Bounce every Tuesday, say — is stored once with a
 * `recurrence` and a `repeatUntil`, rather than as dozens of rows. The public
 * endpoint expands it into dated occurrences; the admin area edits the single
 * underlying record.
 */
export interface LibraryEvent {
  eventId: string;
  title: string;
  /** ISO-8601 date of the first occurrence, e.g. "2026-09-14". */
  date: string;
  /** Optional 24-hour start/end times, e.g. "19:30". */
  startTime?: string;
  endTime?: string;
  description: string;
  location: string;
  /** Free-text cost, e.g. "£3 including refreshments" or "Free". */
  cost?: string;
  /** Draft events are visible only to signed-in trustees. */
  published: boolean;
  recurrence: Recurrence;
  /** ISO date the repeat stops on. Required unless recurrence is 'none'. */
  repeatUntil?: string;
}

/**
 * One dated instance of an event, as returned by the public endpoint.
 *
 * `eventId` still identifies the underlying record, so `occurrenceId` exists to
 * give repeated instances a stable unique key for list rendering.
 */
export interface EventOccurrence extends LibraryEvent {
  occurrenceId: string;
  /** True when this instance came from a repeat rather than the first date. */
  isRepeat: boolean;
}

export type EnquiryStatus = 'new' | 'in_progress' | 'closed';

export interface HireEnquiry {
  enquiryId: string;
  name: string;
  email: string;
  phone?: string;
  organisation?: string;
  /** ISO-8601 date the room is wanted for. */
  preferredDate: string;
  /** Free-text, e.g. "Weekly, Tuesday evenings". */
  frequency: string;
  attendees: number;
  message: string;
  status: EnquiryStatus;
  submittedAt: string;
}

export interface VolunteerApplication {
  applicationId: string;
  name: string;
  email: string;
  phone?: string;
  /** Titles of the roles the applicant is interested in. */
  interests: string[];
  availability: string;
  message?: string;
  status: EnquiryStatus;
  submittedAt: string;
}

export interface ContactMessage {
  messageId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  submittedAt: string;
}
