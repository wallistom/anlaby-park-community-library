# Operations

Everything needed to deploy this site, stand up a new environment, and manage who can sign in.
The README covers what the project is and how it is built.

## Deploying

Branch, PR, CI, merge to `main`. The Deploy workflow builds, uploads, and invalidates CloudFront.
Content and interface changes are one merge from live.

Infrastructure is deliberately not applied by CI:

```bash
cd backend && ./build.sh          # only when Python dependencies change
cd infra && terraform apply
```

**Apply infrastructure before merging frontend code that depends on it.** The admin route guard
calls `GET /admin/me` and fails closed, so if the frontend ships first that route 404s and every
trustee is locked out of the admin area. The sign-in page distinguishes this case ("we could not
check your account") from a genuine refusal, so it is diagnosable rather than mysterious, but the
ordering is still the fix.

Deploys authenticate by GitHub OIDC. There are no AWS keys anywhere. The role can sync the website
bucket and invalidate the cache; it cannot read DynamoDB, change Lambdas, or touch state.

Three repository _variables_ (not secrets) come from `terraform output`:

| Variable                     | Purpose                        |
| ---------------------------- | ------------------------------ |
| `AWS_DEPLOY_ROLE`            | The role the workflow assumes  |
| `WEBSITE_BUCKET`             | Destination for the built site |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution to invalidate     |

GitHub OIDC subjects are immutable and contain numeric IDs, in the form
`repo:owner@100294355/name@1319905089:environment:production`. Matching on `owner/name` never works.
AWS separately requires a `sub` condition, so it is matched loosely and then tightened by exact
`repository` and `environment` claims.

## Who can sign in

The allowlist is the union of two sources, and the split is deliberate.

The `trustees` table is maintained by trustees themselves at **Trustee area → Access**. This is the
normal route; a volunteer board should not need an engineer to seat a new trustee.

`allowed_trustee_emails` in `terraform.tfvars` is a break-glass list, deliberately not editable from
the admin area. It exists so the site cannot be locked out of itself: if the table is emptied by
accident or DynamoDB is unreachable, whoever runs the infrastructure can still get in. Keep at least
one account in it.

The authoriser reads the table on every invocation and does not cache it. API Gateway already caches
the authoriser's verdict for 300 seconds, so invocations are rare and a scan of a table this small
costs half a read unit. Caching in both places would only make removal slower and harder to reason
about.

That 300 seconds is the one thing to know: **removing somebody takes up to five minutes to bite.**
That is fine for a trustee leaving the board. It is not fine for a compromised account, and for that
the fix is to pull them from the break-glass list and apply, or to drop the authoriser's TTL.

Two removals are refused: you cannot remove yourself, and you cannot remove the last remaining
trustee. Neither is a security control, since the break-glass list means recovery is always
possible. They exist so that recovery is never _needed_, because it requires an engineer.

## First-time setup

Only needed to stand up a new environment.

1. **Google OAuth client.** In the [Cloud console](https://console.cloud.google.com/apis/credentials),
   create an OAuth 2.0 Client ID (_Web application_) with `http://localhost:4200` as an authorised
   origin. Add the live URL once CloudFront exists, or trustee sign-in is refused.
2. **Terraform variables.** `cp infra/terraform.tfvars.example infra/terraform.tfvars`, then fill in
   the client ID and the break-glass accounts.
3. **Apply.** `cd backend && ./build.sh`, then `cd infra && terraform init && terraform apply`.
   CloudFront takes 5 to 15 minutes. CORS picks up the CloudFront domain automatically.
4. **Point the frontend at the API.** Copy the `api_base_url` and `google_client_id` outputs into
   `src/environments/environment.prod.ts`.

State lives in S3 (`apcl-tfstate-…`, versioned and encrypted) with a DynamoDB lock table. Both are
bootstrapped outside Terraform, because they have to exist before the backend can be configured:

```bash
aws s3api create-bucket --bucket apcl-tfstate-$ACCOUNT_ID --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-bucket-versioning --bucket apcl-tfstate-$ACCOUNT_ID \
  --versioning-configuration Status=Enabled
aws dynamodb create-table --table-name apcl-tfstate-lock --region eu-west-2 \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
```

Everything lives in `eu-west-2` (London). The privacy policy states UK-only storage, so keep it
there.

## Never commit

- `infra/terraform.tfvars` — it names real trustees. That is personal data belonging to the charity.
- `infra/terraform.tfstate` — the whole resource graph, including variable values. State lives in
  S3; there is no local copy.

The Google client ID is committed deliberately, in `src/environments/`. An OAuth client ID for a web
app is public by design, the ID-token flow uses no client secret, and it is already served in the
site's JavaScript. It is not a leak.
