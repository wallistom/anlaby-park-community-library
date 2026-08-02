import { Activity, Facility, Trustee, VolunteerRole } from './models';
import { LibrarySettings } from './opening-hours.model';

/**
 * Single source of truth for the library's factual details.
 *
 * PROVENANCE — read before relying on any of this.
 *
 * Every value here was scraped from the old anlabyparkcommunitylibrary.com,
 * which is itself out of date and internally inconsistent: its own pages give
 * the trustee board as ten, eleven and twelve members, and the library's
 * printed April 2025 timetable disagrees with the website about Monday and
 * Thursday closing times (5.30pm against 5.00pm) and shows an Art Group running
 * on a Wednesday the website lists as closed.
 *
 * So treat all of this as UNVERIFIED until a trustee confirms it. Two rules
 * follow from that:
 *
 *   1. Reproduce, never derive. Publishing the hours table is fine — it is what
 *      the source said. Counting it and writing "open five days a week" is not:
 *      it turns one possible error into several, and it reads as though someone
 *      checked. Aggregate claims like that have been removed.
 *   2. Where the source published nothing, the site says so rather than
 *      guessing. See the TODO(content) markers.
 */

export const SITE = {
  name: 'Anlaby Park Community Library',
  shortName: 'APCL',
  tagline: "Hull's first and only community-run library",
  charityNumber: '1155677',
  charityStatusFrom: 'February 2014',
  address: {
    line1: 'The Greenway',
    line2: 'Anlaby High Road',
    city: 'Hull',
    postcode: 'HU4 6XH',
  },
  phone: '01482 614483',
  /** E.164 form for `tel:` links. */
  phoneHref: '+441482614483',
  email: 'admin@anlabyparkcommunitylibrary.com',
  social: {
    facebook: 'https://www.facebook.com/AnlabyParkCommunityLibrary',
    x: 'https://x.com/anlabyparklib',
  },
  volunteerCount: 60,
  annualRunningCost: 18000,
} as const;

export const ADDRESS_ONE_LINE = `${SITE.address.line1}, ${SITE.address.line2}, ${SITE.address.city} ${SITE.address.postcode}`;

/**
 * The starting weekly pattern and notice.
 *
 * These are the DEFAULTS ONLY. Trustees edit the live values through the admin
 * area, and the API is the source of truth. This copy exists so the site still
 * shows something sensible when the API is unreachable — a library website that
 * cannot say when it opens is worse than one showing slightly stale hours.
 *
 * Values are the scraped ones; see the provenance note above. Once a trustee
 * saves in the admin area, these stop being used except as an offline fallback.
 */
export const DEFAULT_SETTINGS: LibrarySettings = {
  pattern: [
    { dayIndex: 1, closed: false, opensAt: '13:30', closesAt: '17:00' },
    { dayIndex: 2, closed: false, opensAt: '09:30', closesAt: '12:30' },
    { dayIndex: 3, closed: true },
    { dayIndex: 4, closed: false, opensAt: '13:30', closesAt: '17:00' },
    { dayIndex: 5, closed: false, opensAt: '09:30', closesAt: '12:30' },
    { dayIndex: 6, closed: false, opensAt: '09:30', closesAt: '12:30' },
    { dayIndex: 0, closed: true },
  ],
  exceptions: [],
  notice: {
    active: true,
    title: 'We are open as usual during building works',
    body: 'Remedial works to the building run until December 2026. We have moved into temporary accommodation on site, and every service — books, computers, the Coffee Corner, and all our groups — carries on as normal.',
  },
};

/** Monday first, matching how the hours are read and printed. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const TRUSTEES: Trustee[] = [
  { name: 'Steve Ashton', role: 'Chair' },
  { name: 'John Palmer', role: 'Treasurer' },
  { name: 'Gill Meetoo', role: 'Secretary' },
  { name: 'Mandy Abdulla', role: 'Operational Manager & Fundraising Lead' },
  { name: 'Adam Farrah' },
  { name: 'Paula Suddards' },
  { name: 'Denise Porteous' },
  { name: 'Beverley Leek' },
  { name: 'Zoe Dalton' },
  { name: 'Margaret Clarke' },
  { name: 'Haroldo Herrera-Richmond' },
  { name: 'Anne Haddesley' },
];

export const FACILITIES: Facility[] = [
  {
    title: 'Books for every reader',
    description:
      'Adult fiction and non-fiction, including a wide large-print collection, plus a big selection of children’s and teenage books.',
    icon: 'book',
  },
  {
    title: 'Audiobooks',
    description: 'Spoken-word titles to borrow when print is hard going or your hands are busy.',
    icon: 'headphones',
    note: 'Small charge',
  },
  {
    title: 'Order any book',
    description:
      'Request titles from across the Hull City Libraries catalogue and collect them here on The Greenway.',
    icon: 'search',
    note: 'Small charge',
  },
  {
    title: 'Computers & wi-fi',
    description:
      'Public network computers and free wi-fi for job applications, forms, banking, or simply staying in touch.',
    icon: 'monitor',
  },
  {
    title: 'Printing, copying & laminating',
    description: 'Black-and-white or colour printing, photocopying, and laminating while you wait.',
    icon: 'printer',
  },
  {
    title: 'The Coffee Corner',
    description:
      'A proper cup of coffee and a slice of homemade cake, with a different bake each week. Sit and read, or sit and natter.',
    icon: 'coffee',
  },
  {
    title: 'School visits',
    description:
      'Class visits and reading sessions that introduce local children to their own library.',
    icon: 'school',
  },
  {
    title: 'Outreach service',
    description: 'We take books out to residents of Lees Rest Homes who cannot easily get to us.',
    icon: 'heart',
  },
  {
    title: 'Accessible throughout',
    description: 'Step-free wheelchair access, a hearing loop, and an accessible toilet.',
    icon: 'accessible',
  },
];

/**
 * The clubs and groups that run here, described rather than timetabled.
 *
 * Days and times deliberately live nowhere in this file. The trustees publish
 * them as recurring events in the admin area, so "What's On" always reflects
 * what is actually happening rather than a hardcoded list that quietly rots.
 */
export const ACTIVITIES: Activity[] = [
  {
    name: 'Baby Bounce',
    description:
      'Rhymes, songs, and picture books for babies and toddlers, with a chance for parents and carers to meet.',
    category: 'regular',
  },
  {
    name: "Children's Craft Club",
    description: 'Messy, cheerful making sessions for younger children. All materials provided.',
    category: 'regular',
  },
  {
    name: 'Craft Club',
    description: 'Bring a project or start a new one, in good company and with plenty of tea.',
    category: 'regular',
  },
  {
    name: 'Art Group',
    description:
      'A relaxed session for painters and drawers of every standard, run on a day the library itself is closed.',
    category: 'regular',
  },
  {
    name: 'Knit and Natter',
    description:
      'Needles, wool, and conversation. Complete beginners are genuinely welcome — someone will show you how.',
    category: 'regular',
  },
  {
    name: 'Book Clubs',
    description:
      'Two separate reading groups — one afternoon, one evening — each with its own character. Pick whichever suits your diary.',
    category: 'regular',
  },
  {
    name: 'Bridge Club',
    description: 'A friendly, established club for card players.',
    category: 'regular',
  },
  {
    name: 'Evening talks',
    description:
      'A monthly speaker on local history, travel, nature, and anything else that catches our interest.',
    category: 'regular',
  },
  {
    name: 'Hull & District Chess Club',
    description:
      'An independent club that meets regularly in our rooms. Contact the club directly to join.',
    category: 'external',
  },
  {
    name: "Age Concern's Brunch Bunch",
    description:
      'A sociable morning run by Age UK in our rooms. Booking is through Age UK on 01482 324644, not through the library.',
    category: 'external',
  },
];

export const ACTIVITY_CATEGORY_LABELS: Record<Activity['category'], string> = {
  regular: 'Our group',
  external: 'Visiting group',
};

export const VOLUNTEER_ROLES: VolunteerRole[] = [
  {
    title: 'Library assistant',
    description:
      'Issue and return books, help people find what they are after, and keep the shelves in order. Full training given.',
  },
  {
    title: 'Coffee Corner',
    description: 'Serve drinks and cake, and give visitors a friendly face to talk to.',
  },
  {
    title: 'Baking',
    description: 'Make the cakes that keep the Coffee Corner going — and our reputation intact.',
  },
  {
    title: 'Fundraising & events',
    description:
      'Help plan and run the fayres, quizzes, and race nights that cover a large slice of our costs.',
  },
  {
    title: 'Leaflet delivery',
    description: 'Get news of what is on out across the neighbourhood.',
  },
  {
    title: 'Displays',
    description: 'Put together the seasonal and themed displays that make the library feel alive.',
  },
  {
    title: 'Treasury support',
    description: 'Assist the Treasurer with bookkeeping and record-keeping.',
  },
  {
    title: 'Building & housekeeping',
    description:
      'Read the meters, wash the linen, check the equipment, and clean and maintain the children’s toys.',
  },
  {
    title: 'Crafting for sale',
    description: 'Make items we can sell on our stalls to raise funds.',
  },
];
