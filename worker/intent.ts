import type { Env } from './env';
import { sessionAccount } from './account';
import { identity, signJob } from '../lib/server';
import { stateCall } from './state';

export async function generationIntent(request: Request, env: Env) {
  let owner: string;
  try { owner = identity(request, env); }
  catch { return Response.json({ error: 'Client address could not be verified.' }, { status: 503 }); }
  const intentId = new URL(request.url).searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/.test(intentId)) return Response.json({ error: 'Invalid generation intent.' }, { status: 400 });
  const account = env.AUTH_ENABLED === 'true' ? await sessionAccount(request, env) : null;
  const result = await stateCall<{ intent: { provider_request_id: string | null; outcome: string; failure_reason: string | null; credit_action: string; write_ahead_at: number; attempt_number: number } | null }>(
    env, '/intent/get', { intentId, owner, userId: account?.id },
  );
  if (!result.intent) return Response.json({ error: 'Generation intent not found.' }, { status: 404 });
  return Response.json({
    intentId,
    outcome: result.intent.outcome,
    failureReason: result.intent.failure_reason,
    creditAction: result.intent.credit_action,
    writeAheadAt: result.intent.write_ahead_at,
    attemptNumber: result.intent.attempt_number,
    token: result.intent.provider_request_id ? signJob(result.intent.provider_request_id, account?.id || owner, env) : undefined,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
