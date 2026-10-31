# Billing implementation plan

Reviewed 2026-10-23. This plan keeps the public Next.js application as a static export and puts all identity, billing, quota, and provider operations in the Cloudflare Worker and its single SQLite-backed Durable Object.

## Commercial model

| Plan | Price | Included images | Credit behavior |
| --- | ---: | ---: | --- |
| Free | $0 | 3 starter images | Granted once after email verification |
| Credit Pack | $9.99 | 30 | Never expires |
| Pro Monthly | $14.99/month | 80 per cycle | One-cycle rollover, capped at 160 |
| Pro Annual | $119/year | 800 per cycle | Available for the subscription year |

Square, portrait, and landscape outputs stay close to one megapixel, so every successful request consumes exactly one credit. Expiring subscription credits are consumed first, then starter credits, then non-expiring pack credits.

## Delivery phases

1. Normalize output sizes and retain the global pixel budget.
2. Add passwordless email verification, signed server-side sessions, account balances, rate limits, and three starter credits.
3. Reserve a credit atomically before calling fal.ai. Complete the reservation on a valid image; restore it after a technical failure or safety block.
4. Add server-created Stripe Checkout Sessions, Customer Portal Sessions, signed webhooks, event idempotency, renewal grants, cancellation, refunds, and dispute freezes.
5. Add pricing, account, privacy, terms, refund, and contact surfaces. Purchase controls remain disabled until every production secret and Price ID is configured.
6. Validate with mocked external services, type checking, and a production build before deployment.

## Review findings incorporated

- The current site has no user identity, so Checkout cannot safely launch before accounts exist.
- The server uses a Price ID allowlist; the browser never chooses credit quantities.
- Subscription credits reset on successful renewal invoices, not on the first day of a calendar month.
- Stripe webhook event IDs and entitlement source IDs are unique, preventing duplicate delivery.
- Failed generations return reserved credits. Transient polling failures keep the reservation until a terminal result is known.
- Paid claims do not include watermark removal or a provider queue priority that the product does not implement.
- Refund language does not promise an unconditional refund after credits have been consumed.
- Production activation requires tested email delivery, an operating support inbox, live Stripe Price IDs, and webhook secrets.

## Production activation inputs

- an onboarded Cloudflare Email Sending domain and the `EMAIL` Worker binding
- an operating support inbox at `support@mossimage.run`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- the three live Stripe Price IDs listed in `.dev.vars.example`
- a Stripe webhook endpoint at `https://mossimage.run/api/stripe/webhook/`

No secret belongs in the static Next.js bundle or the repository.

## Stripe objects to create

The following Stripe Price IDs were supplied on October 23, 2026. Price IDs are identifiers rather than secrets; production IDs are kept in `wrangler.jsonc`, while local development uses the Test IDs in `.dev.vars`.

| Product | Live Price ID | Test Price ID |
| --- | --- | --- |
| MOSS Image Credit Pack — 30 images | `price_1UTXrAPWs6WruTx0DXDurW7G` | `price_1UTYXZBGBMUaQ3l5q0Bce634` |
| MOSS Image Pro Monthly — 80 images | `price_1UTXs9PWs6WruTx0OAw5ogoe` | `price_1UTYY3BGBMUaQ3l5T3D4eNFc` |
| MOSS Image Pro Annual — 800 images | `price_1UTXtTPWs6WruTx0YvTvKeI8` | `price_1UTYYUBGBMUaQ3l5u3K5YARy` |

Product metadata is optional because the Worker identifies plans from its server-side Price ID allowlist. Do not let browser input choose a Price ID or credit amount.

Create one Stripe webhook endpoint at `https://mossimage.run/api/stripe/webhook/` and subscribe it to:

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`
- `charge.dispute.created`

Enable the Stripe Customer Portal for payment-method updates, invoice access, and subscription cancellation. Refund eligibility still requires the policy checks described on `/refund/`; issue an approved refund in Stripe only after confirming the relevant credits are unused.

## Safe activation order

1. Onboard `mossimage.run` in Cloudflare Email Sending and bind `EMAIL` to the Worker with `login@mossimage.run` as the only allowed sender. Route `support@mossimage.run` to the verified support mailbox with Cloudflare Email Routing.
2. Confirm the timezone for the stated weekday 09:00–18:00 support hours. The site identifies Moxion Labs LLC and its registered agent address separately from the physical business address Stripe may require for KYC.
3. Create and test the three Stripe products and prices in Test mode, then repeat in Live mode.
4. Add the production secrets with `wrangler secret put`; keep `.dev.vars` local only.
5. Run local email login, Test-mode Checkout, renewal, cancellation, full unused refund, duplicate webhook, failed generation restoration, and download checks.
6. Set `AUTH_ENABLED` to `true` only in the reviewed deployment change, run the full test/build suite, deploy, and perform one low-cost production smoke purchase and generation.

Until these steps are complete, `wrangler.jsonc` intentionally keeps `AUTH_ENABLED` set to `false`, so the deployed site cannot expose a half-configured paid flow.
