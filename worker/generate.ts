import type { Env } from './env';
import { stateCall } from './state';
const NextResponse = Response;
import { submitImage } from './fal-submit';
import { generationSchema, sizes, validateLayout } from '../lib/generation';
import { configured, identity, signJob } from '../lib/server';
import { randomBytes } from 'node:crypto';
import { sessionAccount } from './account';
export async function generate(request: Request, env: Env) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== env.APP_ORIGIN) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!configured(env)) return NextResponse.json({ error: 'Generation is not enabled yet. Please try again after the service is configured.' }, { status: 503 });
  if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'JSON required.' }, { status: 415 });
  let input;
  try {
    const reader = request.body?.getReader(); if (!reader) throw new Error('Missing request body.');
    let bytes = 0; const chunks: Uint8Array[] = [];
    while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 32768) { await reader.cancel(); throw new Error('Request is too large.'); } chunks.push(value); }
    const parsed = generationSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString()));
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    input = parsed.data;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid input.' }, { status: 400 }); }
  let owner: string;
  try { owner = identity(request, env); } catch { return NextResponse.json({ error: 'Client address could not be verified.' }, { status: 503 }); }
  const account = env.AUTH_ENABLED === 'true' ? await sessionAccount(request, env) : null;
  const preview = env.AUTH_ENABLED === 'true' && !account;
  if (preview && input.mode === 'layout') return NextResponse.json({ code: 'preview_requires_account', error: 'Sign in to use JSON layout control and full-size canvases.' }, { status: 401 });
  if (input.mode === 'layout') {
    try { validateLayout(input.prompt, input.size); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid layout.' }, { status: 400 }); }
  }
  const { width, height } = preview ? { width: 512, height: 512 } : sizes[input.size];
  const reservationId = randomBytes(16).toString('hex');
  try {
    const reservation = await stateCall<{ allowed: boolean; code?: string; remaining?: number; account?: unknown }>(env, '/reserve', { owner, userId: account?.id, reservationId, pixels: width * height });
    if (!reservation.allowed) {
      const messages: Record<string, string> = {
        cooldown: 'Please wait 30 seconds between generations.',
        free_limit: 'Your 3 daily generations have been used. Quota resets at 00:00 UTC.',
        preview_limit: 'You have used today’s free preview. Sign in for three starter images.',
        budget: 'Today’s community generation budget is used up. Please come back tomorrow.',
        credits: 'You have no image credits left. Choose a plan or credit pack to continue.',
        frozen: 'This account is temporarily unable to generate. Contact support.',
        auth: 'Sign in to use your image credits.',
      };
      const codes: Record<string, string> = {
        cooldown: 'cooldown',
        free_limit: 'starter_limit',
        preview_limit: 'preview_limit',
        budget: 'daily_budget_exhausted',
        credits: 'credits_exhausted',
        frozen: 'account_frozen',
        auth: 'sign_in_required',
      };
      return NextResponse.json({ code: codes[reservation.code || ''] || 'generation_unavailable', error: messages[reservation.code || ''] || 'Generation is unavailable.' }, { status: reservation.code === 'auth' ? 401 : 429, headers: { 'Retry-After': reservation.code === 'cooldown' ? '30' : '3600' } });
    }
    const result = await submitImage(env.FAL_KEY!, {
      prompt: input.prompt,
      image_size: { width, height },
      seed: input.seed,
      num_images: 1,
      num_inference_steps: input.steps ?? 50,
      guidance_scale: input.guidanceScale ?? 3,
      enable_prompt_expansion: input.mode === 'text',
      enable_safety_checker: true,
      output_format: 'png',
    });
    if (account) await stateCall(env, '/job/link', {
      reservationId, requestId: result.request_id, prompt: input.prompt,
      mode: input.mode, size: input.size, seed: input.seed,
    });
    else if (preview) await stateCall(env, '/preview/link', { reservationId, requestId: result.request_id });
    console.info(JSON.stringify({ event: 'generation_submitted', requestId: result.request_id, pixels: width * height }));
    const updated = reservation.account as { starterCredits?: number; subscriptionCredits?: number; packCredits?: number } | undefined;
    const remaining = updated ? (updated.starterCredits || 0) + (updated.subscriptionCredits || 0) + (updated.packCredits || 0) : reservation.remaining;
    return NextResponse.json({ token: signJob(result.request_id, account?.id || owner, env), remaining, account: reservation.account, preview }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    if (account) await stateCall(env, '/job/refund', { reservationId }).catch(() => undefined);
    else if (preview) await stateCall(env, '/preview/refund', { reservationId }).catch(() => undefined);
    console.error(JSON.stringify({ event: 'generation_submit_failed' }));
    return NextResponse.json(account
      ? { code: 'generation_failed_refunded', creditRestored: true, error: 'The generation service is unavailable. Your image credit has been restored.' }
      : { code: 'generation_failed_refunded', creditRestored: true, error: 'Generation failed. This preview did not count toward your daily limit. Please try again.' }, { status: 502 });
  }
}
