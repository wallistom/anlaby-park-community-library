# Anlaby Park Community Library

A complete rebuild of [anlabyparkcommunitylibrary.com](https://anlabyparkcommunitylibrary.com/) — a
registered charity (no. 1155677) running Hull's first and only community-run library.

The old site was a dated WordPress theme with real problems: leftover demo blog posts still
published, key information (hire charges, annual costs) locked inside downloadable PDFs, an embedded
Facebook feed doing the job of a news section, and no way for the trustees to update anything without
a developer.

This replaces it with an Angular front end and a serverless back end the trustees can run themselves.

---

## What's here

| Path       | What it is                                                       |
| ---------- | ---------------------------------------------------------------- |
| `src/`     | Angular 20 application, Tailwind CSS v4                          |
| `backend/` | Python Lambda handlers, one per endpoint, plus their tests       |
| `infra/`   | Terraform: DynamoDB, Lambda, API Gateway, S3 + CloudFront hosting |

### Pages

Public: home, what's on, activities, visit us, room hire, volunteer, support us, about the trust,
contact, privacy. Trustee-only: sign-in, event management, and an enquiry inbox.

### What the back end does

- **Events, including repeats** — trustees add and publish events, optionally setting a frequency
  (daily, weekly, fortnightly, or monthly) and an end date. A weekly club is stored as one record;
  the public endpoint expands it into individual dates. Edit the one entry and every date updates.
- **Room hire enquiries** — the booking form writes to DynamoDB and appears in the trustee inbox.
- **Volunteer enquiries** — structured signup capturing interests and availability.
- **Contact** — general messages, routed to the trustee inbox.

---

## Running it locally

```bash
npm install
npm start          # http://localhost:4200
```

The site is fully usable without the API deployed. Pages that need it — What's On, the forms — show a
sensible fallback rather than an error, because a library website has to stay useful even when the
back end is down.

To run the backend tests:

```bash
cd backend
python3 -m unittest discover -s tests -t .
```

---

## Deploying

### 1. Create a Google OAuth client

In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), create an
**OAuth 2.0 Client ID** of type _Web application_. Add `http://localhost:4200` to **Authorised
JavaScript origins** for now — the live URL is added in step 5, once CloudFront exists. Copy the
client ID.

### 2. Configure Terraform

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with the client ID and the Google accounts allowed into the trustee area.
`terraform.tfvars` is gitignored — it names real people, so keep it out of version control.

### 3. Build the Lambda layer and apply

```bash
cd ../backend && ./build.sh
cd ../infra && terraform init && terraform apply
```

CloudFront takes roughly 5–15 minutes to finish provisioning. The CORS allowlist picks up the
CloudFront domain automatically, so no second apply is needed.

### 4. Point the frontend at the API

Copy the `api_base_url` and `google_client_id` outputs into `src/environments/environment.prod.ts`,
then build and upload:

```bash
npm run build
aws s3 sync dist/anlaby-park-library/browser/ \
  "s3://$(terraform -chdir=infra output -raw website_bucket)/" --delete
```

### 5. Authorise the live URL for sign-in

Take the `website_url` output and add it to **Authorised JavaScript origins** on the OAuth client
from step 1. Without this the public site works fine, but trustee sign-in will be refused by Google.

To use the charity's own domain, add an ACM certificate in `us-east-1` and set `aliases` on the
CloudFront distribution in `infra/hosting.tf`.

If the trustees keep their existing hosting, delete `infra/hosting.tf` and the `website_url` and
`website_bucket` outputs — nothing else depends on them.

---

## Deploying changes day to day

Once the repository is set up, publishing a change is a merge:

```bash
git switch -c my-change
# ...edit...
git commit -am "fix: correct the Saturday closing time"
git push -u origin my-change
```

Open a pull request. **CI** checks formatting, colour contrast, the Angular
build, the backend tests, and Terraform validity. Merge to `main` and the
**Deploy** workflow builds the site, uploads it, and invalidates CloudFront.

Infrastructure is deliberately not applied by CI. Terraform changes are rare and
occasionally destructive, so they stay a deliberate `terraform apply` from a
machine with credentials. Content and UI changes — the frequent kind — are one
merge away from live.

### Repository configuration

CI needs nothing. Deploy needs three repository **variables** (Settings →
Secrets and variables → Actions → Variables). None of them are secret:

| Variable | Where it comes from |
| --- | --- |
| `AWS_DEPLOY_ROLE` | `terraform output github_deploy_role_arn` |
| `WEBSITE_BUCKET` | `terraform output website_bucket` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output cloudfront_distribution_id` |

There are **no AWS access keys anywhere**. GitHub exchanges a short-lived OIDC
token for temporary credentials, and the role it assumes is pinned to this
repository on the `main` branch — a fork cannot use it. The role can write to
the website bucket and invalidate the cache; it cannot read DynamoDB, change
Lambdas, or touch Terraform state.

---

## Terraform state

State lives in S3 at `s3://apcl-tfstate-572643177124/prod/terraform.tfstate`,
versioned and encrypted, with a DynamoDB table holding the lock. It is not on
anybody's laptop — losing the machine that ran the first apply would otherwise
orphan every resource Terraform created.

The bucket and lock table are bootstrapped outside Terraform, because they have
to exist before the backend can be configured:

```bash
aws s3api create-bucket --bucket apcl-tfstate-572643177124 --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-bucket-versioning --bucket apcl-tfstate-572643177124 \
  --versioning-configuration Status=Enabled
aws dynamodb create-table --table-name apcl-tfstate-lock --region eu-west-2 \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
```

---

## What must never be committed

`.gitignore` blocks these, and it is worth knowing why:

- **`infra/terraform.tfvars`** — names real trustees and carries the OAuth
  client ID. Personal data belonging to the charity.
- **`infra/terraform.tfstate`** — the full resource graph, including the values
  of every variable.

The Google client ID *is* committed, in `src/environments/`. That is deliberate
and not a leak: an OAuth client ID for a web application is public by design,
the ID-token flow uses no client secret, and it is already served in the site's
JavaScript to every visitor.

---

## How authentication works

Trustees sign in with Google. The browser receives a signed ID token and sends it as a bearer token;
a Lambda authoriser verifies the signature, issuer, audience, and expiry against Google, **and**
checks the email against `allowed_trustee_emails`. Both checks matter — a valid Google token only
proves the caller owns some Google account, not that they are a trustee.

The client never decides who is allowed in. It decodes the token only to show a name in the corner.

To add or remove a trustee, edit `allowed_trustee_emails` in `terraform.tfvars` and re-apply. Changes
take effect within five minutes (the authoriser cache TTL).

---

## Architecture notes

**One Lambda per endpoint.** Fifteen functions rather than one router. Each has its own IAM role
granting only the DynamoDB actions it needs on the tables it touches, so a flaw in the public contact
form cannot read the volunteer table.

**Scans, not queries.** The tables hold a community library's worth of data — hundreds of rows, not
millions — so scanning is simpler and cheaper than maintaining indexes. If volumes ever grow, add a
GSI on `status` and query instead.

**Repeats are expanded, not stored.** `backend/src/common/recurrence.py` turns one repeating record
into dated occurrences at request time, capped at 120 days ahead and 200 occurrences per event so a
long-running club cannot flood the response. Storing every date instead would mean the trustees had
to edit fifty rows to move one club. Monthly repeats clamp to the end of short months without
drifting — a series starting on the 31st lands on the 30th in September and back on the 31st in
October.

**No timetable in the codebase.** Days and times live only in the events data. `site.data.ts`
describes what each club *is*; when it meets comes from the admin area, so there is one source of
truth rather than a hardcoded list that quietly goes stale.

**Nothing is here that does not earn its place.** A round of deliberate removal took out a newsletter
signup that collected addresses with no way to send anything, a filter control for ten items, an
admin dashboard that re-rendered the enquiry inbox, a third copy of the opening-hours table, and a
set of undated "annual event" cards duplicated across two pages. If a feature cannot be finished, it
is better absent than half-present — particularly where it gathers personal data.

**Every route is lazily loaded.** The initial bundle is around 103 kB transferred. This site is used
on older phones and on the library's own computers, over modest connections.

**Accessibility is a requirement, not a polish step.** Many users are elderly. The base font is 17px,
tap targets are at least 44px, focus rings are high-contrast and never removed, forms move focus to
the first error and describe problems in plain English, and `prefers-reduced-motion` disables all
animation.

**Contrast is enforced, not asserted.** `npm run build` runs `scripts/check-contrast.mjs` first and
fails if any pairing the UI uses drops below WCAG AA at its rendered size — 4.5:1 for body text,
3:1 for large text and for the edges of interactive controls. This exists because an earlier version
of this file claimed AA while four pairings did not meet it, including the Donate button at 4.02:1.
A comment asserting good contrast is not a check.

**Colour goes through semantic tokens.** `styles.css` defines the raw ramps (forest, ochre,
parchment) and then a semantic layer — `ink`, `ink-muted`, `surface`, `line-strong`, `accent`,
`danger`, `success` — and components reference only the semantic names. Fixing a contrast problem is
one declaration, not thirty-four templates. That indirection is the direct fix for how the earlier
regression spread.

---

## Before this goes live

A few things need the trustees' input. Each is marked with a `TODO` in the source.

- **The weekly timetable** — nothing to change in code: add each club in **Trustee area → Events**
  with a frequency and an end date, and it will appear on What's On. The library's April 2025
  printed timetable listed Craft Group (Mondays), Baby Bounce and Bridge Club (Tuesdays), Art Group
  (Wednesdays), Age UK's Brunch Bunch (Thursdays), and two Book Clubs on the second Thursday of the
  month — worth checking against current practice before entering them.
- **Opening hours discrepancy** (`src/app/core/site.data.ts`) — the website says Monday and Thursday
  close at 5.00pm; the printed timetable says 5.30pm. The website's hours are used here. Confirm
  which is right.
- **Room hire rates** (`src/app/pages/room-hire.component.html`) — the old site kept these in a PDF.
  The page currently invites people to ask. Replace with a real rate card.
- **Online giving link** (`src/app/pages/support.component.ts`) — the PayPal fundraiser URL.
- **The building-works notice** (`SITE_NOTICE` in `site.data.ts`) — confirm it is still accurate, and
  set `active: false` when the works finish.
- **Privacy policy** (`src/app/pages/privacy.component.html`) — should be checked by whoever handles
  data protection for the charity, and given a retention period.

### Photographs

`public/images/` holds two photographs carried over from the old site: the exterior on The Greenway,
and the interior looking down the shelves. Both are used on the home page.

They are only 512×512 — that is the largest the old site published — so they are shown at contained
sizes rather than full bleed, and will look slightly soft on a high-density screen. If the trustees
have the originals, dropping in larger files with the same names is the only change needed.

There is deliberately no stock imagery anywhere. A community library should show its own rooms and
its own people.

---

## Content accuracy

Every fact on this site — opening hours, address, phone number, charity number, trustee names and
roles, the £18,000 running cost, the 2013–2014 history — is taken from the existing website. The
prose has been rewritten; the facts have not been invented or altered. Where the old site did not
publish something, this one says so rather than guessing.
