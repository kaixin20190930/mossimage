import { createFalClient } from '@fal-ai/client';
import type { Env } from './env';
import { stateCall } from './state';

type PendingIntent = {
  provider_request_id: string;
  user_id: string | null;
  write_ahead_at: number;
};

export async function reconcileGenerationIntents(env: Env) {
  if (!env.FAL_KEY) return;
  const { intents } = await stateCall<{ intents: PendingIntent[] }>(env, '/intent/reconcile-list', {});
  const fal = createFalClient({ credentials: env.FAL_KEY });
  let completed = 0;
  let failed = 0;
  let unresolved = 0;

  for (const intent of intents) {
    const requestId = intent.provider_request_id;
    try {
      const providerStatus = await fal.queue.status('fal-ai/moss-image', { requestId, logs: false });
      await stateCall(env, '/intent/polled', { requestId, providerStatus: providerStatus.status });
      if (providerStatus.status !== 'COMPLETED') {
        unresolved++;
        continue;
      }

      const result = await fal.queue.result('fal-ai/moss-image', { requestId });
      const data = result.data as { images?: { url: string }[]; seed?: number; has_nsfw_concepts?: boolean[] };
      if (data.has_nsfw_concepts?.some(Boolean)) {
        await stateCall(env, intent.user_id ? '/job/refund' : '/preview/refund', { requestId });
        await stateCall(env, '/intent/resolve', {
          requestId, outcome: 'safety_refunded', reason: 'safety_block', creditAction: 'restored', resolutionSource: 'reconciler',
        });
        failed++;
        continue;
      }

      const image = data.images?.[0]?.url;
      if (!image || new URL(image).protocol !== 'https:') {
        await stateCall(env, intent.user_id ? '/job/refund' : '/preview/refund', { requestId });
        await stateCall(env, '/intent/resolve', {
          requestId, outcome: 'no_image_refunded', reason: 'no_usable_image', creditAction: 'restored', resolutionSource: 'reconciler',
        });
        failed++;
        continue;
      }

      let archivedImage: string | undefined;
      if (intent.user_id && env.GENERATIONS) {
        try {
          const source = await fetch(image);
          if (!source.ok || !source.body) throw new Error('Image download failed');
          const key = `${intent.user_id}/${encodeURIComponent(requestId)}.png`;
          await env.GENERATIONS.put(key, source.body, { httpMetadata: { contentType: source.headers.get('content-type') || 'image/png' } });
          await stateCall(env, '/generation/complete', { requestId, imageKey: key, seed: data.seed });
          archivedImage = `/api/account/generations/image/?id=${encodeURIComponent(requestId)}`;
        } catch {
          await stateCall(env, '/generation/complete', { requestId, seed: data.seed });
        }
      }
      await stateCall(env, '/job/complete', { requestId });
      await stateCall(env, '/intent/resolve', { requestId, outcome: 'completed', creditAction: 'consumed', resolutionSource: 'reconciler' });
      await stateCall(env, '/result', { requestId, result: { status: 'COMPLETED', image: archivedImage || image, seed: data.seed } });
      completed++;
    } catch {
      await stateCall(env, '/intent/uncertain', { requestId, reason: 'poll_uncertain' }).catch(() => undefined);
      unresolved++;
    }
  }

  console.info(JSON.stringify({ event: 'generation_reconcile', scanned: intents.length, completed, failed, unresolved }));
}
