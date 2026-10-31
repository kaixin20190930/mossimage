import { z } from 'zod';
import type { Env } from './env';
import { sessionAccount } from './account';
import { signValue } from '../lib/server';
import { stateCall } from './state';

const events = [
  'studio_view',
  'generate_submit', 'generate_success', 'generate_fail',
  'verify_email_sent', 'verify_success', 'pricing_view',
  'plan_click', 'checkout_open', 'checkout_complete',
  'upgrade_impression', 'upgrade_pack_click', 'upgrade_pricing_click',
  'generation_error_view', 'generation_retry',
  'quick_start_view', 'quick_start_select',
] as const;

const eventSchema = z.object({
  event: z.enum(events),
  visitorId: z.string().uuid(),
  properties: z.object({
    plan: z.enum(['credit_pack', 'monthly', 'annual']).optional(),
    mode: z.enum(['text', 'layout']).optional(),
    size: z.enum(['square', 'portrait', 'landscape']).optional(),
    errorCode: z.enum([
      'credits_exhausted', 'starter_limit', 'generation_failed_refunded',
      'generation_status_uncertain', 'cooldown', 'daily_budget_exhausted',
      'account_frozen', 'sign_in_required', 'invalid_job',
      'generation_unavailable', 'preview_limit', 'preview_requires_account', 'unknown',
    ]).optional(),
    source: z.enum(['default', 'example', 'quick_start', 'shared', 'manual']).optional(),
    example: z.string().regex(/^[a-z0-9-]{1,64}$/).optional(),
  }).strict().optional(),
}).strict();

function sameOrigin(request: Request, env: Env) {
  return request.headers.get('origin') === env.APP_ORIGIN;
}

export async function recordAnalytics(request: Request, env: Env) {
  if (!sameOrigin(request, env)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 2048) return Response.json({ error: 'Payload too large.' }, { status: 413 });
  let input: z.infer<typeof eventSchema>;
  try {
    const body = await request.text();
    if (body.length > 2048) return Response.json({ error: 'Payload too large.' }, { status: 413 });
    input = eventSchema.parse(JSON.parse(body));
  }
  catch { return Response.json({ error: 'Invalid analytics event.' }, { status: 400 }); }
  await stateCall(env, '/analytics/record', {
    event: input.event,
    visitorHash: signValue(input.visitorId, 'analytics-visitor', env),
    properties: input.properties || {},
  });
  return new Response(null, { status: 204 });
}

export async function analyticsSummary(request: Request, env: Env) {
  const current = await sessionAccount(request, env);
  if (!current || !env.ADMIN_EMAIL || current.email !== env.ADMIN_EMAIL.toLowerCase()) {
    return Response.json({ error: 'Not authorized.' }, { status: 403 });
  }
  const days = Math.floor(Math.min(90, Math.max(1, Number(new URL(request.url).searchParams.get('days')) || 30)));
  return Response.json(await stateCall(env, '/analytics/summary', { days }), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
