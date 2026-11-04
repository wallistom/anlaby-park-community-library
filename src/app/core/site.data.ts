import { Activity, Facility, Trustee, VolunteerRole } from './models';
import { LibrarySettings } from './opening-hours.model';

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

export const MAP_LINKS = {
  google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_ONE_LINE)}`,
  apple: `https://maps.apple.com/?q=${encodeURIComponent(ADDRESS_ONE_LINE)}`,
} as const;

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

export const ACTIVITIES: Activity[] = [
  {
    name: 'Baby Bounce',
    icon: 'baby',
    description:
      'Rhymes, songs, and picture books for babies and toddlers, with a chance for parents and carers to meet.',
    category: 'regular',
  },
  {
    name: "Children's Craft Club",
    icon: 'shapes',
    description: 'Messy, cheerful making sessions for younger children. All materials provided.',
    category: 'regular',
  },
  {
    name: 'Craft Club',
    icon: 'scissors',
    description: 'Bring a project or start a new one, in good company and with plenty of tea.',
    category: 'regular',
  },
  {
    name: 'Art Group',
    icon: 'palette',
    description:
      'A relaxed session for painters and drawers of every standard, run on a day the library itself is closed.',
    category: 'regular',
  },
  {
    name: 'Knit and Natter',
    icon: 'chat',
    description:
      'Needles, wool, and conversation. Complete beginners are genuinely welcome — someone will show you how.',
    category: 'regular',
  },
  {
    name: 'Book Clubs',
    icon: 'bookOpen',
    description:
      'Two separate reading groups — one afternoon, one evening — each with its own character. Pick whichever suits your diary.',
    category: 'regular',
  },
  {
    name: 'Bridge Club',
    icon: 'spade',
    description: 'A friendly, established club for card players.',
    category: 'regular',
  },
  {
    name: 'Evening talks',
    icon: 'mic',
    description:
      'A monthly speaker on local history, travel, nature, and anything else that catches our interest.',
    category: 'regular',
  },
  {
    name: 'Hull & District Chess Club',
    icon: 'crown',
    description:
      'An independent club that meets regularly in our rooms. Contact the club directly to join.',
    category: 'external',
  },
  {
    name: "Age Concern's Brunch Bunch",
    icon: 'coffee',
    description:
      'A sociable morning run by Age UK in our rooms. Booking is through Age UK on 01482 324644, not through the library.',
    category: 'external',
  },
];

export const VOLUNTEER_ROLES: VolunteerRole[] = [
  {
    title: 'Library assistant',
    icon: 'book',
    description:
      'Issue and return books, help people find what they are after, and keep the shelves in order. Full training given.',
  },
  {
    title: 'Coffee Corner',
    icon: 'coffee',
    description: 'Serve drinks and cake, and give visitors a friendly face to talk to.',
  },
  {
    title: 'Baking',
    icon: 'cake',
    description: 'Make the cakes that keep the Coffee Corner going — and our reputation intact.',
  },
  {
    title: 'Fundraising & events',
    icon: 'calendar',
    description:
      'Help plan and run the fayres, quizzes, and race nights that cover a large slice of our costs.',
  },
  {
    title: 'Leaflet delivery',
    icon: 'mail',
    description: 'Get news of what is on out across the neighbourhood.',
  },
  {
    title: 'Displays',
    icon: 'sparkles',
    description: 'Put together the seasonal and themed displays that make the library feel alive.',
  },
  {
    title: 'Treasury support',
    icon: 'pound',
    description: 'Assist the Treasurer with bookkeeping and record-keeping.',
  },
  {
    title: 'Building & housekeeping',
    icon: 'wrench',
    description:
      'Read the meters, wash the linen, check the equipment, and clean and maintain the children’s toys.',
  },
  {
    title: 'Crafting for sale',
    icon: 'heart',
    description: 'Make items we can sell on our stalls to raise funds.',
  },
];
