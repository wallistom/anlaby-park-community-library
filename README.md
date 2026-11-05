# Anlaby Park Community Library

A website and admin area for a community-run library in Hull, so opening hours,
events, and who can sign in are changed through the site rather than in code.

Built independently and offered to the library. Not currently adopted, and no
trustee accounts are in use.

Live at <https://d2d5pvqwty4462.cloudfront.net>

Angular 20 and Tailwind v4, Python 3.12 Lambdas, DynamoDB, Terraform, S3 and
CloudFront. Everything in `eu-west-2`.

| Path       | Contents                                                    |
| ---------- | ----------------------------------------------------------- |
| `src/`     | Angular app — 10 public pages, 6 in the admin area           |
| `backend/` | Lambda handlers, one per endpoint, and their tests           |
| `infra/`   | Terraform: DynamoDB, Lambda, API Gateway, S3, CloudFront     |
| `docs/`    | Running costs, and the contrast audit                        |

## Running locally

```bash
npm install && npm start                                    # http://localhost:4200
cd backend && python3 -m unittest discover -s tests -t .
```

Pages that read data fall back to static content if the API is unreachable.

## Deploying

Branch, PR, CI, merge to `main`. The deploy workflow builds, uploads, and
invalidates CloudFront. It authenticates with GitHub OIDC, so there are no AWS
keys in the repository or in CI.

Terraform is not applied by CI. Apply it yourself, and apply it *before*
merging frontend code that depends on it — the admin route guard fails closed,
so deploying ahead of an apply locks admins out.

```bash
cd backend && ./build.sh      # only when Python dependencies change
cd infra && terraform apply
```

Three repository variables come from `terraform output`: `AWS_DEPLOY_ROLE`,
`WEBSITE_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID`.

## Access

Trustees add and remove each other under **Trustee area → Access**. Changes take
up to five minutes, which is the authoriser cache.

`allowed_trustee_emails` in `terraform.tfvars` is a separate list the admin area
cannot edit, so the site cannot lock everyone out. Keep at least one account in
it.

## Standing up a new environment

1. Create a Google OAuth 2.0 client (Web application) with `http://localhost:4200`
   as an authorised origin. Add the live URL once CloudFront exists.
2. `cp infra/terraform.tfvars.example infra/terraform.tfvars` and fill in the
   client ID and the fallback accounts.
3. `cd backend && ./build.sh`, then `cd infra && terraform init && terraform apply`.
   CloudFront takes 5–15 minutes.
4. Copy the `api_base_url` and `google_client_id` outputs into
   `src/environments/environment.prod.ts`.

State lives in an S3 bucket with a DynamoDB lock table. Both are created outside
Terraform, because they have to exist before the backend can be configured:

```bash
aws s3api create-bucket --bucket apcl-tfstate-$ACCOUNT_ID --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-bucket-versioning --bucket apcl-tfstate-$ACCOUNT_ID \
  --versioning-configuration Status=Enabled
aws dynamodb create-table --table-name apcl-tfstate-lock --region eu-west-2 \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
```

## Not committed

- `infra/terraform.tfvars` — real names and email addresses.
- `infra/terraform.tfstate` — lives in S3.

The Google client ID *is* committed, on purpose. An OAuth client ID for a web
app is public by design, the ID-token flow uses no client secret, and it is
already served in the site's JavaScript.

## Docs

- [docs/running-costs.md](docs/running-costs.md) — roughly 5p a month.
- [docs/surface-audit.md](docs/surface-audit.md) — rendered-DOM contrast check.

Content decisions that need the trustees are marked `TODO(content)` and
`TODO(legal)` in the source.
