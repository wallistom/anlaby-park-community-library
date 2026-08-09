# Anlaby Park Community Library

A rebuild of the website for Anlaby Park Community Library, a registered charity (no. 1155677) in
west Hull. It is live at [d2d5pvqwty4462.cloudfront.net](https://d2d5pvqwty4462.cloudfront.net).

This is not a portfolio mock-up. The forms write real enquiries from real people into DynamoDB, and
the trustees run the site themselves: opening hours, events, the homepage notice, and who is allowed
to sign in are all edited through the admin area rather than in code.

Angular 20 and Tailwind v4 on the front, Python 3.12 Lambdas behind API Gateway, DynamoDB for
storage, the whole estate described in Terraform and served from S3 through CloudFront in
`eu-west-2`. Ten public pages, six screens in the trustee area, 20 API endpoints, 61 backend tests.
First load is 106 kB over the wire. It costs about 5p a month to run.

| Path       | What it is                                                  |
| ---------- | ----------------------------------------------------------- |
| `src/`     | Angular application: 10 public pages, 6 in the trustee area |
| `backend/` | Lambda handlers, one file per endpoint, plus tests          |
| `infra/`   | Terraform: DynamoDB, Lambda, API Gateway, S3 + CloudFront   |
| `scripts/` | The contrast and opening-hours checks that gate the build   |
| `docs/`    | Operations, running costs, and the surface-contrast audit   |

## Who it's for, and how that shaped it

Two audiences that pull in different directions.

Most visitors are elderly, often on an older phone or one of the library's own computers over a
modest connection. That set the constraints: a 17px base size, tap targets of at least 44px, 106 kB
on first load, and every page still useful when the API cannot be reached.

The trustees are volunteers, not engineers. They can fill in a form. They cannot be expected to open
a terminal, so anything that changes routinely lives in the admin area, and anything that would need
an engineer to change is treated as a design failure.

## Decisions worth defending

**Contrast is enforced by the build, not asserted in a comment.** `npm run build` runs a WCAG audit
first and fails on any pairing below AA at its rendered size, 4.5:1 for body text and 3:1 for large
text and control edges. It exists because a comment is not a check: an earlier version of this file
claimed the site met AA while the Donate button sat at 4.02:1.

**Colour goes through semantic tokens, never raw ramps.** Templates use `text-ink-muted` and
`bg-sunken`, never `stone-500`. When secondary text once drifted below AA it had to be corrected in
34 separate templates; it is now one declaration.

**What's On is a calendar, not a list.** The API expands repeating events 120 days ahead, so the
library's weekly timetable becomes roughly 130 occurrences and a flat chronological list stops being
usable. The page defaults to a week view because that matches the printed timetable people already
know. Below `sm` the month grid is replaced by a list of days that have something on: seven columns
at 320px leaves 45px per cell, which can only show a dot, and a dot you have to tap to identify is
hostile to this audience.

**Date maths avoids `toISOString()`.** It shifts to UTC, which would move every event a day back
during British Summer Time.

**Opening hours are a weekly pattern plus dated exceptions.** Resolution runs exception, then
weekday pattern, then closed, and exceptions are sorted narrowest-range-first so a single open day
inside a longer closure wins: the library opens for the book sale during the Christmas break.
`scripts/check-hours.mjs` asserts the resolver in CI.

**Who can sign in is data, with a break-glass list behind it.** Trustees add and remove each other
in the admin area, which is the normal route, because a volunteer board should not need an engineer
to seat a new trustee. A second list in Terraform is deliberately not editable from the admin area,
so the site cannot lock itself out. Removals take up to five minutes to bite, because API Gateway
caches the authoriser's verdict for 300 seconds.

**Every endpoint is its own Lambda with its own IAM role.** Terraform builds the twenty functions
from one map that names, per endpoint, the exact table and the exact DynamoDB actions it is allowed.
The handler that creates an event holds `PutItem` on the events table and nothing else: it cannot
read the enquiries table, and a mistake in one endpoint stays inside it.

**The site works with the API unreachable.** Every page that reads data falls back to something
genuinely useful rather than to an error.

**No stock photography and no generated imagery.** The site shows the library's own building and
rooms, or nothing.

## Running it

```bash
npm install && npm start                                    # http://localhost:4200
npm run build                                               # contrast and hours gates, then build
cd backend && python3 -m unittest discover -s tests -t .    # 61 tests
```

Formatting is Prettier, checked in CI: `npx prettier --write "src/**/*.{ts,html,css}"`.

## Deploying

Branch, PR, CI, merge to `main`. The Deploy workflow builds, uploads, and invalidates CloudFront.
Deploys authenticate by GitHub OIDC, so there are no AWS keys in the repository or in CI, and the
deploy role can sync the website bucket and invalidate the cache but cannot read DynamoDB, change
Lambdas, or touch state.

Infrastructure is deliberately not applied by CI. Terraform changes are rare and sometimes
destructive, so they stay a considered `terraform apply`, and they must be applied _before_ merging
frontend code that depends on them: the admin route guard fails closed, so shipping ahead of an
apply locks the trustees out of their own site.

Standing up an environment, the state bootstrap, and the rest of the operational detail are in
[docs/operations.md](docs/operations.md).

## Documentation

- **[docs/operations.md](docs/operations.md)** — first-time setup, deployment, and what must never
  be committed.
- **[docs/running-costs.md](docs/running-costs.md)** — what the site costs to run, written for the
  trustees rather than for engineers.
- **[docs/surface-audit.md](docs/surface-audit.md)** — the rendered-DOM check that catches surfaces
  blending into the ones behind them.

## Outstanding

Content decisions that need the trustees are marked `TODO(content)` and `TODO(legal)` in the source:
the room-hire rate card, the fundraiser link, and a privacy policy that wants a retention period and
a look from whoever handles data protection.

Everything carried over from the old site is reproduced as published rather than derived from it.
The source is out of date and contradicts itself, giving the trustee board as ten, eleven, and
twelve members in different places, and the printed April 2025 timetable disagrees with the website
about Monday and Thursday closing times. Publishing the hours table as it was given is safe.
Counting it and writing "open five days a week" is not, because it turns one possible error into
several and implies that somebody checked.
