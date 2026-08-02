#!/usr/bin/env node
/**
 * Assertions for the opening-hours resolver.
 *
 * This decides whether the site tells somebody the library is open on
 * Christmas Day, so it is checked in CI rather than trusted.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Compile the module with the real TypeScript compiler rather than stripping
// types with regexes, which silently breaks on function signatures.
const out = mkdtempSync(join(tmpdir(), 'apcl-hours-'));
execFileSync(
  'npx',
  ['tsc', 'src/app/core/opening-hours.model.ts', '--outDir', out,
   '--module', 'esnext', '--target', 'es2022', '--moduleResolution', 'bundler'],
  { stdio: 'pipe' },
);
const { resolveDay, sortExceptions, upcomingExceptions, formatRange } =
  await import(join(out, 'opening-hours.model.js'));

const pattern = [
  { dayIndex: 1, closed: false, opensAt: '13:30', closesAt: '17:00' },
  { dayIndex: 2, closed: false, opensAt: '09:30', closesAt: '12:30' },
  { dayIndex: 3, closed: true },
  { dayIndex: 4, closed: false, opensAt: '13:30', closesAt: '17:00' },
  { dayIndex: 5, closed: false, opensAt: '09:30', closesAt: '12:30' },
  { dayIndex: 6, closed: false, opensAt: '09:30', closesAt: '12:30' },
  { dayIndex: 0, closed: true },
];
const base = (exceptions = []) => ({ pattern, exceptions: sortExceptions(exceptions), notice: {} });

let failed = 0;
const is = (name, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.log(`  FAIL ${name}\n       got ${a}\n       want ${e}`); failed++; }
};

// --- Baseline pattern ---------------------------------------------------
is('Monday uses the pattern', resolveDay('2026-08-03', base()).closesAt, '17:00');
is('Wednesday is closed by pattern', resolveDay('2026-08-05', base()).closed, true);
is('Sunday is closed by pattern', resolveDay('2026-08-02', base()).closed, true);

// --- Single-day exception ------------------------------------------------
const bankHoliday = [{ exceptionId: 'a', from: '2026-08-31', to: '2026-08-31', closed: true, reason: 'Bank holiday' }];
is('bank holiday closes an open Monday', resolveDay('2026-08-31', base(bankHoliday)).closed, true);
is('bank holiday carries its reason', resolveDay('2026-08-31', base(bankHoliday)).reason, 'Bank holiday');
is('the day after is unaffected', resolveDay('2026-09-01', base(bankHoliday)).closed, false);

// --- Range exception -----------------------------------------------------
const christmas = [{ exceptionId: 'b', from: '2026-12-24', to: '2027-01-02', closed: true, reason: 'Christmas' }];
is('range start is closed', resolveDay('2026-12-24', base(christmas)).closed, true);
is('mid-range is closed', resolveDay('2026-12-29', base(christmas)).closed, true);
is('range end is closed', resolveDay('2027-01-02', base(christmas)).closed, true);
is('day before the range is still open', resolveDay('2026-12-22', base(christmas)).closed, false);

// --- Half day ------------------------------------------------------------
const halfDay = [{ exceptionId: 'c', from: '2026-12-24', to: '2026-12-24', closed: false, opensAt: '09:30', closesAt: '12:00', reason: 'Christmas Eve' }];
is('half day is open', resolveDay('2026-12-24', base(halfDay)).closed, false);
is('half day uses its own closing time', resolveDay('2026-12-24', base(halfDay)).closesAt, '12:00');

// --- Opening on a normally closed day ------------------------------------
const fayre = [{ exceptionId: 'd', from: '2026-08-02', to: '2026-08-02', closed: false, opensAt: '11:00', closesAt: '16:00', reason: 'Summer fayre' }];
is('can open on a closed Sunday', resolveDay('2026-08-02', base(fayre)).closed, false);

// --- Precedence: a single day inside a longer closure --------------------
const nested = [
  { exceptionId: 'e', from: '2026-12-24', to: '2027-01-02', closed: true, reason: 'Christmas' },
  { exceptionId: 'f', from: '2026-12-28', to: '2026-12-28', closed: false, opensAt: '10:00', closesAt: '13:00', reason: 'Open for the book sale' },
];
is('narrower exception wins inside a range', resolveDay('2026-12-28', base(nested)).closed, false);
is('and keeps its own reason', resolveDay('2026-12-28', base(nested)).reason, 'Open for the book sale');
is('the rest of the range stays closed', resolveDay('2026-12-29', base(nested)).closed, true);

// --- Upcoming ------------------------------------------------------------
const mixed = [
  { exceptionId: 'g', from: '2026-07-01', to: '2026-07-01', closed: true, reason: 'Past' },
  { exceptionId: 'h', from: '2026-12-25', to: '2026-12-25', closed: true, reason: 'Christmas Day' },
  { exceptionId: 'i', from: '2026-08-31', to: '2026-08-31', closed: true, reason: 'Bank holiday' },
];
is('upcoming drops past entries and sorts', upcomingExceptions(mixed, '2026-08-02').map((e) => e.reason),
   ['Bank holiday', 'Christmas Day']);
is('an in-progress range still counts as upcoming',
   upcomingExceptions([{ exceptionId: 'j', from: '2026-08-01', to: '2026-08-10', closed: true, reason: 'Works' }], '2026-08-05').length, 1);

// --- Formatting ----------------------------------------------------------
is('closed formats as Closed', formatRange({ closed: true }), 'Closed');
is('range formats in library style', formatRange({ closed: false, opensAt: '13:30', closesAt: '17:00' }), '1.30pm – 5.00pm');
is('noon is pm', formatRange({ closed: false, opensAt: '12:00', closesAt: '12:30' }), '12.00pm – 12.30pm');
is('midnight is am', formatRange({ closed: false, opensAt: '00:30', closesAt: '09:00' }), '12.30am – 9.00am');

console.log();
if (failed) { console.error(`${failed} opening-hours assertion(s) failed.`); process.exit(1); }
console.log('All opening-hours assertions passed.');
