# What the website costs to run

Prepared 3 August 2026, for the new site at `d2d5pvqwty4462.cloudfront.net`.

Figures below are worked out from the resources the site actually uses and
Amazon's published London prices, not from a sample bill. The site has had
almost no real visitors yet, so its current bill would understate things.

## The short answer

**Under £1 a month at any traffic this site is likely to see.** At the level we
would expect — a few hundred visitors a month — it is **around 5p a month**.

The only cost that does not depend on visitors is the domain name, at roughly
**£12 a year**.

**A sensible budget is £30 a year.** That is generous, and covers a year far
busier than expected.

## Why there is no standing charge

The site has no server. Nothing is rented by the hour, and nothing is switched
on waiting for visitors.

We checked every part of it for a standing charge and found none:

| Checked           | Finding                                                 |
| ----------------- | ------------------------------------------------------- |
| Databases (5)     | All "pay per request" — no reserved capacity to pay for |
| Programs (17)     | Charged per run, for the fraction of a second they run  |
| Delivery network  | No fixed fee; cheapest regional tier; no extras enabled |
| Doorway (API)     | No fixed fee                                            |
| Stored files      | 0.7 MB of website, under a penny a year                 |
| Error logs        | 0.06 MB, deleted automatically after 30 days            |
| Network equipment | None of the expensive kinds are used                    |

With no visitors at all, the bill would be **effectively zero**.

## What visitors cost

Every figure below is the **full price with no free allowance applied** — a
deliberate worst case. Amazon gives every account a permanent free allowance
that would absorb most of this, so the real bill should be lower still.

|                | Visitors a month | Page views | Cost a month |
| -------------- | ---------------- | ---------- | ------------ |
| Quiet          | 200              | 500        | about 1p     |
| **Expected**   | **800**          | **2,400**  | **about 5p** |
| Well promoted  | 3,000            | 9,000      | about 18p    |
| Ten times that | 20,000           | 60,000     | about £1.17  |

Where the money goes at the "expected" level — delivering the pages to people
is the largest share, and it is still pennies:

| Part                           | Cost a month          |
| ------------------------------ | --------------------- |
| Delivering pages and images    | $0.041                |
| Running the calendar and forms | $0.014                |
| The doorway to those programs  | $0.004                |
| Databases                      | $0.0004               |
| File storage and logs          | $0.0002               |
| **Total**                      | **$0.060 (about 5p)** |

## Fixed costs

| Item                 | Cost                 | Notes                                                          |
| -------------------- | -------------------- | -------------------------------------------------------------- |
| Domain name          | ~£12 a year          | `anlabyparkcommunitylibrary.com`, already owned                |
| DNS hosting          | £0, or ~£4.80 a year | Free if DNS stays where it is; ~40p a month if moved to Amazon |
| Security certificate | £0                   | Free, renews itself                                            |

## What is _not_ charged

- No monthly hosting fee, and no contract to cancel.
- Nothing while the site is idle, which is most of the time.
- Nothing extra for the trustee admin area.
- No software licences — everything it is built on is free to use.

## Two practical points

**Billing is in US dollars.** Pound figures use about $1.27 to the pound; a
change in the exchange rate moves the total by pennies.

**Set a spending alert.** At these amounts the only real risk is something
unexpected — a fault, or the site being deliberately hammered. A budget alert
at £5 a month would give plenty of warning. It is free to set up and takes a
few minutes.

## One thing to decide

The Amazon account and the Google sign-in used by the trustee area are
currently registered to Tom Wallis personally, while the website's privacy
policy names the charity as the data controller.

That works today, but it means the charity's website sits inside one person's
account. Moving both to an account owned by the charity, with a trustee as the
billing contact, is the tidier arrangement and is worth doing before the site
is promoted widely. It changes none of the costs above.

---

### Note on the figures

Prices are Amazon's published rates for London (`eu-west-2`), confirmed against
their pricing service on 3 August 2026: API requests $1.04 per million,
database reads $0.1487 per million, file storage $0.024 per GB per month. Two
rates — content delivery and program running time — come from the published
price list. How hard the site works per visit was measured from the live
system rather than assumed.
