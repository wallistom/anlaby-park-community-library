import { IconName } from '../shared/icon.component';

export interface Trustee {
  name: string;
  role?: string;
}

export interface Facility {
  title: string;
  description: string;
  icon: IconName;
  note?: string;
}

export interface Activity {
  name: string;
  description: string;
  category: ActivityCategory;
  icon: IconName;
}

export type ActivityCategory = 'regular' | 'external';

export interface VolunteerRole {
  title: string;
  description: string;
  icon: IconName;
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'fortnightly' | 'monthly';

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: 'One-off — does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  fortnightly: 'Every two weeks',
  monthly: 'Every month',
};

export interface LibraryEvent {
  eventId: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description: string;
  location: string;
  cost?: string;
  published: boolean;
  recurrence: Recurrence;
  repeatUntil?: string;
}

export interface EventOccurrence extends LibraryEvent {
  occurrenceId: string;
  isRepeat: boolean;
}

export type EnquiryStatus = 'new' | 'in_progress' | 'closed';

export interface HireEnquiry {
  enquiryId: string;
  name: string;
  email: string;
  phone?: string;
  organisation?: string;
  preferredDate: string;
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

export interface TrusteeAccount {
  email: string;
  name: string;
  addedAt: string;
  addedBy: string;
  isYou: boolean;
}
