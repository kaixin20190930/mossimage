import type { Env } from './env';
import { stateCall } from './state';
const NextResponse = Response;
import { createFalClient } from '@fal-ai/client';
import { configured, identity, verifyJob } from '../lib/server';
import { sessionAccount } from './account';
export async function status(request: Request, env: Env) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!configured(env)) return reply({ error: 'Generation is unavailable.' }, 503);
  let requestId: string;
  let owner: string;
  let account: Awaited<ReturnType<typeof sessionAccount>> = null;
  try {
    account = env.AUTH_ENABLED === 'true' ? await sessionAccount(request, env) : null;
    owner = account?.id || identity(request, env);
    requestId = verifyJob(new URL(request.url).searchParams.get('token') || '', owner, env);
  } catch { return reply({ code: 'invalid_job', error: 'This job is invalid, expired, or belongs to another account.' }, 403); }
  try {
    const poll = await stateCall<{ cached?: unknown; acquired?: boolean }>(env, '/poll', { requestId });
    if (poll.cached) return reply(poll.cached);
    if (!poll.acquired) return reply({ status: 'IN_PROGRESS' });
    const fal = createFalClient({ credentials: env.FAL_KEY });
    const status = await fal.queue.status('fal-ai/moss-image', { requestId, logs: false });
    if (status.status !== 'COMPLETED') {
      await stateCall(env, '/release', { requestId });
      return reply({ status: status.status });
    }
    const result = await fal.queue.result('fal-ai/moss-image', { requestId });
    const data = result.data as { images?: { url: string }[]; seed?: number; has_nsfw_concepts?: boolean[] };
    if (data.has_nsfw_concepts?.some(Boolean)) {
      const body = { status: 'FAILED', code: 'generation_safety_refunded', creditRestored: true, error: account ? 'This image was blocked by the safety checker. Your credit was restored.' : 'This image was blocked by the safety checker. The preview did not count toward your daily limit.' };
      await stateCall(env, account ? '/job/refund' : '/preview/refund', { requestId });
      await stateCall(env, '/intent/resolve', { requestId, outcome: 'safety_refunded', reason: 'safety_block', creditAction: 'restored' });
      await stateCall(env, '/result', { requestId, result: body });
      return reply(body);
    }
    const image = data.images?.[0]?.url;
    if (!image || new URL(image).protocol !== 'https:') {
      const body = { status: 'FAILED', code: 'generation_no_image_refunded', creditRestored: true, error: account ? 'The provider returned no usable image. Your credit was restored.' : 'The provider returned no usable image. The preview did not count toward your daily limit.' };
      await stateCall(env, account ? '/job/refund' : '/preview/refund', { requestId });
      await stateCall(env, '/intent/resolve', { requestId, outcome: 'no_image_refunded', reason: 'no_usable_image', creditAction: 'restored' });
      await stateCall(env, '/result', { requestId, result: body });
      return reply(body);
    }
    let archivedImage: string | undefined;
    if (account && env.GENERATIONS) {
      try {
        const source = await fetch(image);
        if (!source.ok || !source.body) throw new Error('Image download failed');
        const key = `${owner}/${encodeURIComponent(requestId)}.png`;
        await env.GENERATIONS.put(key, source.body, {
          httpMetadata: { contentType: source.headers.get('content-type') || 'image/png' },
        });
        await stateCall(env, '/generation/complete', { requestId, imageKey: key, seed: data.seed });
        archivedImage = `/api/account/generations/image/?id=${encodeURIComponent(requestId)}`;
      } catch {
        console.error(JSON.stringify({ event: 'generation_archive_failed', requestId }));
        await stateCall(env, '/generation/complete', { requestId, seed: data.seed });
      }
    } else {
      await stateCall(env, '/generation/complete', { requestId, seed: data.seed });
    }
    const body = { status: 'COMPLETED', image: archivedImage || image, seed: data.seed };
    await stateCall(env, '/job/complete', { requestId });
    await stateCall(env, '/intent/resolve', { requestId, outcome: 'completed', creditAction: 'consumed' });
    await stateCall(env, '/result', { requestId, result: body });
    return reply(body);
  } catch {
    await stateCall(env, '/intent/uncertain', { requestId, reason: 'poll_uncertain' }).catch(() => undefined);
    return reply({ code: 'generation_poll_uncertain', creditRestored: false, error: 'This generation is still being checked. Check this job again before submitting another one.' }, 502);
  }
}
