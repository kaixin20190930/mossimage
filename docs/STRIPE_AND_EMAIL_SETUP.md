# Stripe and Cloudflare Email setup

Prepared October 23, 2026. Production authentication is enabled with `AUTH_ENABLED=true`.

## 1. Stripe keys

The supplied `pk_live_...` value is a publishable browser key. This Worker integration does not use it. Despite the environment-variable name, `STRIPE_SECRET_KEY` may contain either a standard server key (`sk_test_...` / `sk_live_...`) or a restricted server key (`rk_test_...` / `rk_live_...`). Prefer a restricted key in production when it has the permissions listed below.

In the Stripe Dashboard:

1. Confirm the active Stripe account owns the six configured Price IDs.
2. Open **Workbench → API keys**.
3. In Test mode, reveal the standard key beginning with `sk_test_`, or create a restricted key beginning with `rk_test_`, and place it only in local `.dev.vars` as `STRIPE_SECRET_KEY`. Do not paste it into chat or commit it.
4. In Live mode, either reveal/create a standard `sk_live_` key or create a restricted `rk_live_` key named `mossimage-worker-production`. For a restricted key, enable write access to Checkout Sessions and Billing Portal Sessions, plus read access to Customers, Prices, Products, and Subscriptions. Add Customer write access only if Checkout reports that it is required for customer creation. Leave refunds, payouts, balance, and account-management permissions disabled.
5. Copy the live key once and save it in a password manager. If Stripe returns a permission error during testing, use the request entry in Workbench logs to identify and add only the missing permission.
6. When production activation is approved, store the live value interactively with `npx wrangler secret put STRIPE_SECRET_KEY`.

The Stripe CLI currently authenticated on this computer points to a different Stripe account and could not retrieve any of the supplied Price IDs. Log the CLI into the same account that owns the products before using it for local tests.

### Managed Payments product tax codes

Stripe Managed Payments requires an eligible tax code on every Product used by Checkout. In Live mode, open each of the three MOSS Image products in **Product catalog → Products**, edit the product's tax settings, and select **Artificial Intelligence as a Service (AIaaS) — Cloud Based — Personal Use** (`txcd_10105001`). The tax code belongs to the Product, so it covers the Price attached to that Product.

Apply the code to Credit Pack, Pro Monthly, and Pro Annual. Saving a tax code does not create a purchase or charge a customer. After saving all three, verify that each pricing button reaches Stripe Checkout and shows the expected amount; stop before entering or confirming payment details.

## 2. Test-mode webhook workflow

Do not point a Test-mode Stripe destination at the production URL because Test and Live destinations have different `whsec_...` signing secrets while production uses only the Live secret.

For local testing:

1. Sign the Stripe CLI into the product-owning account.
2. Run the local app.
3. Run `stripe listen --forward-to http://127.0.0.1:8787/api/stripe/webhook/`.
4. Copy the temporary `whsec_...` value printed by Stripe CLI into local `.dev.vars` as `STRIPE_WEBHOOK_SECRET`, then restart the local app.
5. Use the three Test Price IDs for Checkout tests.

## 3. Live webhook destination

Create this only after the reviewed Worker containing `/api/stripe/webhook/` has been deployed with `AUTH_ENABLED=false`.

1. In Stripe, switch to **Live mode**.
2. Open **Workbench → Webhooks** or **Event destinations**.
3. Choose **Create destination**.
4. Event source: **Your account**. Do not select Connected accounts.
5. Destination type: **Webhook endpoint**.
6. Endpoint URL: `https://mossimage.run/api/stripe/webhook/`
7. Description: `MOSS Image production billing`
8. Use the account default/current API version.
9. Select exactly these events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
   - `charge.dispute.created`
10. Create the destination, reveal its signing secret beginning with `whsec_`, and store it interactively with `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.
11. Send a test event from Stripe and confirm an HTTP 200 response in the destination delivery log.

The webhook signing secret is separate from both API keys and is unique to this destination.

## 4. Cloudflare Email

The Cloudflare account is on Workers Paid. Email Sending is active for `mossimage.run`, and Email Routing forwards `support@mossimage.run` to the private Gmail destination.

### Outbound login codes

1. Open **Compute → Email Service → Email Sending**.
2. Choose **Onboard Domain** and select `mossimage.run`.
3. Review the Cloudflare-managed SPF, DKIM, bounce MX, and DMARC records, then complete onboarding.
4. Wait for the domain status to become Active.
5. The Worker binding is already restricted to `login@mossimage.run`.

### Incoming support mail

1. Open **Compute → Email Service → Email Routing → Destination Addresses**.
2. Add the private Gmail destination and complete the verification link delivered to that inbox.
3. Onboard `mossimage.run` for Email Routing if it is not already Active.
4. Create the routing rule `support@mossimage.run` → the verified Gmail destination.
5. Send a message from a different mailbox to `support@mossimage.run` and confirm delivery and reply behavior.

The Gmail address is suitable as the private forwarding destination. It should not be used as the public OTP sender; login mail will come from `MOSS Image <login@mossimage.run>` through Cloudflare Email Sending.

## 5. Live Customer Portal

Open `https://dashboard.stripe.com/settings/billing/portal` while the Dashboard is in Live mode. Under the portal's feature settings:

1. Enable payment-method updates.
2. Keep invoice history visible.
3. Enable subscription cancellation and apply cancellation at the end of the billing period.
4. Leave plan switching and quantity updates disabled because MOSS Image does not currently implement mid-cycle plan changes.
5. Set the return URL to `https://mossimage.run/pricing/`.
6. Set the terms URL to `https://mossimage.run/terms/` and the privacy URL to `https://mossimage.run/privacy/`, then save the Live configuration.

## 6. Remaining business details

The site now identifies Moxion Labs LLC and labels `30 N Gould St, Ste N, Sheridan, WY 82801, USA` as its registered agent address. Stripe separately requires the physical address where most business activity occurs and may request proof. Use the address already verified by Stripe for KYC rather than substituting a registered agent address.

Confirm the timezone for the weekday 09:00–18:00 support hours before publishing those hours.
