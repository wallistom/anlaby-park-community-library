# What the website costs to run

Prepared 3 August 2026. Figures for the new site at
`d2d5pvqwty4462.cloudfront.net`.

## The short answer

**Pennies a month.** The measured cost for July 2026 was **$0.005** — about
half a penny. Even if the site got ten times busier than we expect, it would
stay under **£2 a month**.

The only cost that does not depend on traffic is the domain name, at roughly
**£12 a year**.

**A sensible budget is £30 a year.** That is comfortably more than the site
should ever need, and leaves room for a busy year.

## Why it is so cheap

There is no server. Nothing is switched on waiting for visitors, so nothing is
charged while the site is idle — which is most of the time. The site is a set
of files on Amazon's network, and small programs that run only for the fraction
of a second it takes to answer a request.

Amazon also gives every account a permanent free allowance that this site sits
well inside.

## Measured costs — July 2026

Taken from the actual AWS bill, not an estimate.

| Part        | What it does                    | Used in July   | Cost        |
| ----------- | ------------------------------- | -------------- | ----------- |
| CloudFront  | Delivers the site worldwide     | 442 requests   | $0.0000     |
| Lambda      | Runs the forms and the calendar | 1,407 runs     | $0.0000     |
| API Gateway | The doorway to those programs   | 1,647 requests | $0.0019     |
| S3          | Stores the site's files         | ~5 MB          | $0.0025     |
| DynamoDB    | Stores events, enquiries, hours | 1,174 reads    | $0.0005     |
| CloudWatch  | Keeps error logs                | minimal        | $0.0000     |
| **Total**   |                                 |                | **$0.0049** |

CloudFront and Lambda show zero because they fall inside the permanent free
allowance, not because they are unused.

July was a quiet month — mostly development traffic rather than real visitors.

## What it would cost with real visitors

Scaled from the rates above. The middle row is what we would expect once the
library tells people about it.

| Visitors         | Page views a month | Cost a month |
| ---------------- | ------------------ | ------------ |
| Quiet            | 500                | under 2p     |
| Expected         | 6,000              | about 3p     |
| Ten times busier | 60,000             | about 20p    |

Those figures assume the free allowances continue. If they were withdrawn
entirely — which is not expected — the same three rows become roughly 1p, 17p,
and £1.60. The site stays inexpensive either way.

## Fixed costs

| Item                 | Cost                | Notes                                                                           |
| -------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Domain name          | ~£12 a year         | `anlabyparkcommunitylibrary.com`, already owned; renews annually                |
| DNS hosting          | £0 or ~£4.80 a year | Free if DNS stays with the current registrar; about 40p a month if moved to AWS |
| Security certificate | £0                  | Free, and renews itself                                                         |

## What is _not_ charged

- No monthly hosting fee, and no contract.
- No charge while nobody is using the site.
- No separate charge for the trustee admin area.
- No licence fees — everything the site is built on is free to use.

## Two things worth knowing

**Billing is in US dollars.** The pound figures above use roughly $1.27 to the
pound. A move in the exchange rate changes the total by pennies.

**A spending alert is worth setting.** Costs this low are only a risk if
something unexpected happens — a fault, or the site being targeted. A budget
alert at, say, £5 a month would send an email long before anything mattered.
It costs nothing to set up.

## One thing to decide

The AWS account and the Google sign-in used by the trustee area are currently
registered to Tom Wallis personally, while the website's privacy policy names
the charity as the data controller.

That works, but it means the charity's website depends on one person's account.
Moving both into an account owned by the charity — with a trustee as the
billing contact — is the tidier arrangement and is worth doing before the site
is promoted widely. It does not change any of the costs above.
