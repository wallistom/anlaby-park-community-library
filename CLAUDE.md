# CLAUDE.md

Working notes for this repository. The README explains **what** the project is and how to
deploy it; this file records the **decisions, conventions, and traps** that are not obvious
from reading the code.

---

## What this is

A replacement for [anlabyparkcommunitylibrary.com](https://anlabyparkcommunitylibrary.com/) —
a real registered charity (no. 1155677) in west Hull, run by volunteer trustees. It is live at
**https://d2d5pvqwty4462.cloudfront.net**.

This is not a demo. The forms write real enquiries from real people into DynamoDB, and the
trustees will administer it themselves. Treat the content, the personal data, and the running
costs accordingly.

---

## Who uses it

Two audiences, and they pull in different directions:

- **The public** — skews elderly, often on older phones or the library's own computers over
  modest connections. This is why the base font is 17px, tap targets are ≥44px, the initial
  bundle is ~103 kB, and every page works with the API unreachable.
- **Trustees** — volunteers, middle-aged, not technical. They can fill in forms and click
  buttons. They cannot be expected to touch AWS, Terraform, or a terminal. Anything they need
  to change routinely must be editable through `/admin`.

---

## Commands

```bash
npm start                  # dev server on :4200
npm run build              # contrast gate THEN ng build — the gate can fail the build
npm run check:contrast     # WCAG audit on its own

cd backend && python3 -m unittest discover -s tests -t .   # 50 tests
cd backend && ./build.sh                                   # rebuild the Lambda layer

cd infra && terraform plan     # state is in S3; no init flags needed
```

Formatting is Prettier, enforced in CI: `npx prettier --write "src/**/*.{ts,html,css}"`.

---

## Stack and layout

Angular 20 + Tailwind v4 · Python 3.12 Lambdas · DynamoDB · Terraform · S3 + CloudFront, all in
`eu-west-2` (London — the privacy policy states UK-only storage, so keep it there).

```
src/app/core/       site.data.ts (single source of truth for facts), services, guards
src/app/shared/     icon, page-hero, hours-table, cta-band, directives
src/app/pages/      10 public pages
src/app/admin/      sign-in, manage-events, enquiries
backend/src/        one directory per resource; one file per endpoint
infra/              Terraform for the whole estate
scripts/            check-contrast.mjs — the build gate
```

---

## Conventions that matter

### Colour goes through semantic tokens, never raw ramps

`styles.css` defines raw ramps (`blue`, `navy`, `orange`, `stone`) and then a semantic layer.
**Templates use only the semantic names**: `text-ink`, `text-ink-soft`, `text-ink-muted`,
`bg-surface`, `bg-page`, `bg-sunken`, `bg-inverse`, `border-line`, `border-line-strong`,
`text-danger`, `text-success`, and so on.

This exists because it was absent once and the palette silently regressed: secondary text drifted
onto a value failing WCAG AA in 34 separate templates. Fixing it now means editing one
declaration.

### The surface ladder has exactly three light steps, and they must stay apart

`surface` (white) → `page` → `sunken`, at 1.10:1 and 1.12:1, with white 1.23:1 from the band.

Those gaps are the whole reason the site reads as separate zones. It went wrong once already:
`page`, `sunken`, and `blue-50` all sat within 1.08:1 of each other while doing three different
jobs, so every band edge dissolved and 16 cards on About were 1.06:1 from what they sat on.

Two rules follow:

- **Never put a pale fill on a surface next to it in the ladder.** `bg-blue-50` on `bg-page` is
  1.01:1 — invisible. Pale callouts belong on `bg-sunken`, or on white where `blue-50` has a real
  1.11:1 step. Same for `bg-orange-50`, which is 1.01:1 on the page.
- **A white card must not sit on a white section.** Put the section on `bg-sunken`.

Deepening `page` or `sunken` forces `ink-muted` and `line-strong` darker to hold 4.5:1 and 3:1
against the new band. Re-solve both before changing either, and check `ink-muted` stays clearly
lighter than `ink-soft` or the text hierarchy collapses.

The audit that catches all of this is a rendered-DOM check, not a static one — see
`docs/surface-audit.md`.

### Contrast is enforced, not asserted

`npm run build` runs `scripts/check-contrast.mjs` first and **fails the build** on any pairing
below AA at its rendered size (4.5:1 body, 3:1 large text and interactive-control edges).

If you add a new colour pairing, add it to the `PAIRS` array in that script. A comment claiming
good contrast is not a check — an earlier version of the README claimed AA while the Donate
button sat at 4.02:1.

### Use the component classes

`btn-primary`, `btn-secondary`, `btn-accent`, `btn-on-dark`, `btn-sm`, `card`,
`card-interactive`, `chip-*`, `pill-on`/`pill-off`, `field-input`, `field-label`, `field-error`,
`alert-danger`, `link`, `link-arrow`, `eyebrow`, `section`, `container-page`, `prose-body`.

Don't re-implement these with utilities inline. Three radii only: `rounded-lg` (chips),
`rounded-xl` (buttons, inputs), `rounded-2xl` (cards) — plus `rounded-full` for pills.

### Motion

Tokens: `--duration-micro` 150ms, `--duration-quick` 220ms, `--duration-page` 280ms.

Rules learned the hard way:

- **`opacity` and `transform` only.** Never animate layout properties.
- **Hover transforms belong inside `@media (hover: hover)`.** On touch, `:hover` latches after a
  tap and the effect sticks.
- **Don't animate a page-level translate.** It competes with the scroll reveal *and* makes the
  page a containing block, trapping the `position: fixed` mobile drawer.
- **No hover motion on non-interactive elements.** It implies an affordance that isn't there.
- The base `prefers-reduced-motion` rule collapses all durations, so individual rules don't need
  their own handling.

**If you add an animation class, attach it to an element and verify it fires.** Three animations
once shipped as dead CSS because they were written but never applied. Check with
`getComputedStyle(el).animationName`.

---

## Traps that have already cost time

- **Tailwind v4 cannot `@apply` a custom class inside another.** Composed classes are written out
  in full in `styles.css`. Don't try to DRY them up.
- **`truncate` inside a grid sets the column's min-content to the full string.** One long trustee
  name blew out the whole About grid. Use `min-w-0` or let text wrap.
- **Long unbroken strings.** The email address is 345px wide. Every render of it needs
  `break-all`; the body carries `overflow-wrap: break-word` as a net for user-typed content.
- **Chrome won't resize below ~400px on macOS.** To test 320px, load the page in an iframe of
  that width — media queries respond to iframe width, so breakpoints behave correctly.
- **The mobile drawer must not use a fixed top offset.** The dismissible notice makes the header
  height variable. It is a full-screen overlay with its own header bar.
- **GitHub OIDC subjects are immutable and contain numeric IDs**
  (`repo:owner@100294355/name@1319905089:environment:production`). Matching `owner/name` never
  works. AWS separately *requires* a `sub` condition, so it is matched loosely and tightened by
  exact `repository` and `environment` claims.

---

## Hard rules

### Never commit

- `infra/terraform.tfvars` — names real trustees. Personal data belonging to the charity.
- `infra/terraform.tfstate` — the whole resource graph including variable values. State lives in
  S3; there is no local copy.

The Google **client ID is committed deliberately** in `src/environments/`. An OAuth client ID for
a web app is public by design, the ID-token flow uses no client secret, and it is already served
in the site's JavaScript. It is not a leak.

### Content accuracy

Every fact on this site was scraped from the old site, **which is out of date and contradicts
itself** — it gives the trustee board as ten, eleven and twelve members in different places, and
the printed April 2025 timetable disagrees with the website on Monday/Thursday closing times and
shows a Wednesday group on a day the website calls closed.

Treat all of it as unverified. Two rules follow:

- **Reproduce, never derive.** Publishing the hours table is fine — it is what the source said.
  Counting it and writing "open five days a week" is not: it turns one possible error into
  several and implies someone checked. A claim like that shipped to production once and was
  wrong by a day.
- **Where the source published nothing, say so** rather than guessing. See the `TODO(content)`
  markers.

`src/app/core/site.data.ts` is the single source of truth. Change a fact there, not in a
template.

### What's On is a calendar, not a list

A flat chronological list does not survive real data: the API expands repeats
120 days ahead, so the library's own timetable becomes ~130 occurrences. The page
offers a **week** view (default, because it matches the printed timetable people
already know) and a **month** view.

The month grid is hidden below `sm` and replaced by a list of days that have
something on. Seven columns at 320px leaves 45px per cell, which can only show a
dot — and a dot you must tap to identify is hostile to this audience.

Date maths lives in `src/app/core/calendar.ts` and deliberately avoids
`toISOString()`, which shifts to UTC and would move every event a day back during
British Summer Time.

### Opening hours are a pattern plus exceptions

`opening-hours.model.ts` holds a weekly pattern and a list of dated exceptions.
Resolution is **exception → weekday pattern → closed**, and exceptions are sorted
narrowest-range-first so a single day inside a longer closure wins (open for the
book sale during the Christmas break).

Trustees edit all of it at `/admin/hours`, including the site banner. Nothing
about hours should be hardcoded again — `DEFAULT_SETTINGS` in `site.data.ts`
exists only as an offline fallback so the site is never blank when the API is
unreachable.

`scripts/check-hours.mjs` asserts the resolver in CI. It compiles the module
with `tsc` rather than stripping types with regexes, which breaks on function
signatures.

### Days and times live in events, not in code

`site.data.ts` describes what each club *is*. When it meets comes from recurring events the
trustees publish in `/admin`. A hardcoded timetable would rot, and the printed one already
disagrees with the website about Monday/Thursday closing (5.00 vs 5.30pm — unresolved).

### Imagery

No stock photography, and no AI-generated imagery. The site shows the library's own building and
rooms or nothing. `public/images/` holds two 512×512 photos carried over from the old site —
which is why the hero is a contained framed composition rather than full-bleed. Larger originals
dropped in under the same filenames are the only change needed.

Context: the old WordPress site still has `crystal-spires`, `fantasy-ruins`, and
`fantasy-jungle-ruins` demo posts live in its sitemap. Generated imagery is the visual signature
of the thing being replaced.

---

## Deploying

Push a branch → PR → CI (formatting, contrast, build, backend tests, `terraform validate`) →
merge to `main` → the Deploy workflow publishes and invalidates CloudFront.

**Infrastructure is deliberately not applied by CI.** Terraform changes are rare and sometimes
destructive; they stay a deliberate `terraform apply`. Content and UI changes are one merge from
live.

**Apply infrastructure before merging frontend code that depends on it.** The admin route guard
calls `GET /admin/me`, and it fails closed — if the frontend ships first, that route 404s and
every trustee is locked out of the admin area. The sign-in page distinguishes this case ("we
could not check your account") from a genuine refusal, so it is diagnosable rather than
mysterious, but the ordering is still the fix.

Deploys authenticate by GitHub OIDC. There are **no AWS keys anywhere**. The role can sync the
website bucket and invalidate the cache; it cannot read DynamoDB, change Lambdas, or touch state.

Repository variables (not secrets): `AWS_DEPLOY_ROLE`, `WEBSITE_BUCKET`,
`CLOUDFRONT_DISTRIBUTION_ID` — all from `terraform output`.

---

## Design principles applied here

- **Restraint over decoration.** The site was cut down once for being too busy — the dark utility
  bar, duplicated sections, gradient blobs, and card shadows all went. Add weight only with a
  reason.
- **Nothing half-present.** A newsletter signup was removed entirely because it collected
  addresses under a promise of monthly news with no way to send anything. For a charity, an
  unfulfillable promise attached to personal data is worse than a missing feature.
- **One source of truth.** Duplicated blocks were removed: the hours table appeared three times,
  the home offerings list shadowed `FACILITIES`, and undated event cards appeared on two pages.
- **The site must work without the API.** Every page that reads data has a fallback that is
  genuinely useful, not an error.

---

## Outstanding

Marked in source with `TODO(content)` / `TODO(legal)`:

- Room hire rate card (`room-hire.component.html`) — the old site kept it in a PDF.
- PayPal fundraiser URL (`support.component.ts`).
- Building-works notice (`SITE_NOTICE` in `site.data.ts`) — confirm it is current; set
  `active: false` when the works finish.
- Privacy policy — should be reviewed by whoever handles data protection, and given a retention
  period.
- Opening-hours discrepancy between the website and the printed timetable.

Also unresolved, and worth raising with the user rather than fixing silently: the AWS account and
Google OAuth client are under a personal identity, while the privacy policy names the charity as
data controller. Moving them to charity-owned accounts is the correct fix.
