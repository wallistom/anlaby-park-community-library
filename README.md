# Anlaby Park Community Library

A rebuild of [anlabyparkcommunitylibrary.com](https://anlabyparkcommunitylibrary.com/) — a registered
charity (no. 1155677) running Hull's first and only community-run library.

Live at **https://d2d5pvqwty4462.cloudfront.net**. Not a demo: the forms write real enquiries from
real people, and the trustees administer it themselves.

Angular 20 + Tailwind v4 · Python 3.12 Lambdas · DynamoDB · Terraform · S3 + CloudFront, all in
`eu-west-2`.

| Path       | What it is                                                   |
| ---------- | ------------------------------------------------------------ |
| `src/`     | Angular application — 10 public pages, 5 in the trustee area |
| `backend/` | Lambda handlers, one per endpoint, plus tests                |
| `infra/`   | Terraform: DynamoDB, Lambda, API Gateway, S3 + CloudFront    |
| `docs/`    | Running costs, and the surface-contrast audit                |

## Running it

```bash
npm install && npm start                                    # http://localhost:4200
cd backend && python3 -m unittest discover -s tests -t .    # backend tests
```

The site works with the API unreachable — every page that reads data has a useful fallback rather
than an error.

## Deploying changes

Branch → PR → CI → merge to `main`. The Deploy workflow builds, uploads, and invalidates CloudFront.

**Infrastructure is not applied by CI.** Terraform changes stay a deliberate `terraform apply`, and
must be applied _before_ merging frontend code that depends on them — the admin route guard fails
closed, so shipping ahead of an apply locks trustees out.

```bash
cd backend && ./build.sh          # only when Python dependencies change
cd infra && terraform apply
```

Deploys authenticate by GitHub OIDC; there are **no AWS keys anywhere**. Three repository _variables_
(not secrets) come from `terraform output`: `AWS_DEPLOY_ROLE`, `WEBSITE_BUCKET`,
`CLOUDFRONT_DISTRIBUTION_ID`.

## Who can sign in

Trustees manage this themselves at **Trustee area → Access**. Changes take up to five minutes (the
authoriser cache).

`allowed_trustee_emails` in `terraform.tfvars` is a separate break-glass list, deliberately not
editable from the admin area, so the site cannot be locked out of itself. Keep at least one account
in it.

## First-time setup

Only needed to stand up a new environment.

1. **Google OAuth client** — in the [Cloud console](https://console.cloud.google.com/apis/credentials),
   create an OAuth 2.0 Client ID (_Web application_) with `http://localhost:4200` as an authorised
   origin. Add the live URL once CloudFront exists, or trustee sign-in is refused.
2. **Terraform variables** — `cp infra/terraform.tfvars.example infra/terraform.tfvars`, then fill in
   the client ID and the break-glass accounts.
3. **Apply** — `cd backend && ./build.sh`, then `cd infra && terraform init && terraform apply`.
   CloudFront takes 5–15 minutes. CORS picks up the CloudFront domain automatically.
4. **Point the frontend at the API** — copy the `api_base_url` and `google_client_id` outputs into
   `src/environments/environment.prod.ts`.

State lives in S3 (`apcl-tfstate-…`, versioned and encrypted) with a DynamoDB lock table, both
bootstrapped outside Terraform because they must exist before the backend can be configured:

```bash
aws s3api create-bucket --bucket apcl-tfstate-$ACCOUNT_ID --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-bucket-versioning --bucket apcl-tfstate-$ACCOUNT_ID \
  --versioning-configuration Status=Enabled
aws dynamodb create-table --table-name apcl-tfstate-lock --region eu-west-2 \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
```

## Never commit

- `infra/terraform.tfvars` — names real trustees. Personal data belonging to the charity.
- `infra/terraform.tfstate` — the whole resource graph. State lives in S3.

The Google **client ID is committed deliberately** in `src/environments/`. An OAuth client ID for a
web app is public by design, the ID-token flow uses no client secret, and it is already served in the
site's JavaScript. It is not a leak.

## Also worth reading

- **[CLAUDE.md](CLAUDE.md)** — conventions, design decisions, and the traps that have already cost
  time. Read this before changing colour, motion, or the calendar.
- **[docs/running-costs.md](docs/running-costs.md)** — what the site costs to run, written for the
  trustees. Roughly 5p a month.
- **[docs/surface-audit.md](docs/surface-audit.md)** — the rendered-DOM check for surfaces blending
  into each other.

Outstanding content decisions that need the trustees are marked `TODO(content)` in the source and
listed at the end of `CLAUDE.md`.
