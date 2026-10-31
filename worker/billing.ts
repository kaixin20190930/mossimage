import { z } from 'zod';
import type { Env } from './env';
import { paymentsConfigured, sessionAccount } from './account';
import { stateCall } from './state';
import { verifyStripeSignature } from './stripe-signature';

type Plan = 'pack' | 'monthly' | 'annual';
const checkoutSchema = z.object({ plan: z.enum(['pack', 'monthly', 'annual']) }).strict();

const catalog: Record<Plan, { envKey: keyof Env; mode: 'payment' | 'subscription' }> = {
  pack: { envKey: 'STRIPE_PRICE_CREDIT_PACK_30', mode: 'payment' },
  monthly: { envKey: 'STRIPE_PRICE_PRO_MONTHLY_80', mode: 'subscription' },
  annual: { envKey: 'STRIPE_PRICE_PRO_ANNUAL_800', mode: 'subscription' },
};

function sameOrigin(request: Request, env: Env) {
  return request.headers.get('origin') === env.APP_ORIGIN;
}

async function stripe(env: Env, path: string, form: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.STRIPE_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  const body = await response.json() as {
    id?: string;
    url?: string;
    error?: { message?: string; type?: string; code?: string; param?: string };
  };
  if (!response.ok) {
    console.error(JSON.stringify({
      event: 'stripe_api_failed', path, status: response.status,
      type: body.error?.type, code: body.error?.code, param: body.error?.param,
      message: body.error?.message,
    }));
    throw new Error(body.error?.message || 'Stripe request failed');
  }
  return body;
}

export async function deleteStripeCustomer(env: Env, customerId: string) {
  if (!env.STRIPE_SECRET_KEY || !/^cus_[a-zA-Z0-9]+$/.test(customerId)) throw new Error('Billing account cannot be deleted.');
  const response = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Basic ${Buffer.from(`${env.STRIPE_SECRET_KEY}:`).toString('base64')}` },
  });
  const body = await response.json() as { deleted?: boolean; error?: { message?: string; type?: string; code?: string } };
  if (!response.ok || !body.deleted) {
    console.error(JSON.stringify({ event: 'stripe_customer_delete_failed', status: response.status, type: body.error?.type, code: body.error?.code }));
    throw new Error(body.error?.message || 'Billing account could not be deleted.');
  }
}

export async function createCheckout(request: Request, env: Env) {
  if (!paymentsConfigured(env)) return Response.json({ error: 'Payments are not available yet.' }, { status: 503 });
  if (!sameOrigin(request, env)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await sessionAccount(request, env);
  if (!user) return Response.json({ error: 'Sign in before purchasing credits.' }, { status: 401 });
  if (user.frozen) return Response.json({ error: 'Purchases are unavailable for this account. Contact support.' }, { status: 403 });
  let input: z.infer<typeof checkoutSchema>;
  try { input = checkoutSchema.parse(await request.json()); }
  catch { return Response.json({ error: 'Unknown plan.' }, { status: 400 }); }
  const item = catalog[input.plan];
  const price = String(env[item.envKey] || '');
  const form = new URLSearchParams({
    mode: item.mode,
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    client_reference_id: user.id,
    success_url: `${env.APP_ORIGIN}/pricing/?checkout=success`,
    cancel_url: `${env.APP_ORIGIN}/pricing/?checkout=cancelled`,
    'metadata[user_id]': user.id,
    'metadata[plan]': input.plan,
  });
  if (user.stripeCustomerId) form.set('customer', user.stripeCustomerId);
  else form.set('customer_email', user.email);
  if (item.mode === 'payment') {
    form.set('payment_intent_data[metadata][user_id]', user.id);
    form.set('payment_intent_data[metadata][plan]', input.plan);
  } else {
    form.set('subscription_data[metadata][user_id]', user.id);
    form.set('subscription_data[metadata][plan]', input.plan);
  }
  try {
    const session = await stripe(env, 'checkout/sessions', form);
    if (!session.url) throw new Error('Missing Checkout URL');
    return Response.json({ url: session.url });
  } catch {
    return Response.json({ error: 'Checkout could not be started. Please try again.' }, { status: 502 });
  }
}

export async function createPortal(request: Request, env: Env) {
  if (!paymentsConfigured(env)) return Response.json({ error: 'Billing management is not available yet.' }, { status: 503 });
  if (!sameOrigin(request, env)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await sessionAccount(request, env);
  if (!user?.stripeCustomerId) return Response.json({ error: 'No billing account was found.' }, { status: 404 });
  try {
    const session = await stripe(env, 'billing_portal/sessions', new URLSearchParams({
      customer: user.stripeCustomerId,
      return_url: `${env.APP_ORIGIN}/pricing/`,
    }));
    if (!session.url) throw new Error('Missing portal URL');
    return Response.json({ url: session.url });
  } catch {
    return Response.json({ error: 'Billing management could not be opened.' }, { status: 502 });
  }
}

type StripeObject = {
  id?: string; mode?: string; payment_status?: string; customer?: string;
  subscription?: string | { id?: string }; payment_intent?: string | { id?: string };
  invoice?: string | { id?: string }; billing_reason?: string; current_period_end?: number;
  amount?: number; amount_refunded?: number;
  metadata?: Record<string, string>; status?: string;
  lines?: { data?: Array<{ period?: { end?: number } }> };
  parent?: { subscription_details?: { subscription?: string; metadata?: Record<string, string> } };
};
type StripeEvent = { id: string; type: string; data: { object: StripeObject } };

function stripeId(value: string | { id?: string } | undefined) {
  return typeof value === 'string' ? value : value?.id;
}

export async function stripeWebhook(request: Request, env: Env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response('Webhook not configured', { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  if (!verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET)) return new Response('Invalid signature', { status: 400 });
  let event: StripeEvent;
  try { event = JSON.parse(payload) as StripeEvent; }
  catch { return new Response('Invalid event', { status: 400 }); }
  const object = event.data.object;
  try {
    if (event.type === 'checkout.session.completed' && object.payment_status === 'paid') {
      const userId = object.metadata?.user_id;
      const plan = object.metadata?.plan as Plan | undefined;
      if (plan === 'pack') {
        await stateCall(env, '/billing/event', { eventId: event.id, action: 'pack', userId, customerId: object.customer, paymentId: stripeId(object.payment_intent) });
      } else if (plan === 'monthly' || plan === 'annual') {
        const duration = plan === 'monthly' ? 31 * 86400000 : 366 * 86400000;
        await stateCall(env, '/billing/event', { eventId: event.id, action: 'subscription_start', userId, plan, customerId: object.customer, subscriptionId: stripeId(object.subscription), paymentId: stripeId(object.invoice), periodEnd: Date.now() + duration });
      }
    } else if (event.type === 'invoice.paid' && object.billing_reason !== 'subscription_create') {
      const subscriptionId = object.parent?.subscription_details?.subscription || stripeId(object.subscription);
      const periodEnd = object.lines?.data?.[0]?.period?.end || object.current_period_end;
      await stateCall(env, '/billing/event', { eventId: event.id, action: 'subscription_renew', subscriptionId, paymentId: object.id, periodEnd: periodEnd ? periodEnd * 1000 : undefined });
    } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const plan = object.metadata?.plan as Plan | undefined;
      if (plan !== 'monthly' && plan !== 'annual') return Response.json({ received: true, ignored: true });
      await stateCall(env, '/billing/event', {
        eventId: event.id, action: 'subscription_sync', userId: object.metadata?.user_id,
        subscriptionId: object.id, plan, customerId: object.customer,
        status: object.status, periodEnd: object.current_period_end ? object.current_period_end * 1000 : undefined,
      });
    } else if (event.type === 'customer.subscription.deleted') {
      await stateCall(env, '/billing/event', { eventId: event.id, action: 'subscription_cancel', subscriptionId: object.id });
    } else if (event.type === 'charge.refunded' && object.amount && object.amount_refunded && object.amount_refunded >= object.amount) {
      await stateCall(env, '/billing/event', { eventId: event.id, action: 'refund_purchase', paymentId: stripeId(object.invoice) || stripeId(object.payment_intent) });
    } else if (event.type === 'charge.dispute.created') {
      await stateCall(env, '/billing/event', { eventId: event.id, action: 'freeze', userId: object.metadata?.user_id, paymentId: stripeId(object.payment_intent) });
    } else {
      return Response.json({ received: true, ignored: true });
    }
    return Response.json({ received: true });
  } catch {
    console.error(JSON.stringify({ event: 'stripe_webhook_failed', type: event.type, eventId: event.id }));
    return new Response('Webhook processing failed', { status: 500 });
  }
}
