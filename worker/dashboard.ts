import type { Env } from './env';
import { sessionAccount } from './account';
import { deleteStripeCustomer } from './billing';
import { signExportImage, verifyExportImage } from '../lib/server';
import { stateCall } from './state';

function noStore(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function dashboard(request: Request, env: Env) {
  const account = await sessionAccount(request, env);
  if (!account) return noStore({ error: 'Sign in to view your account.' }, 401);
  const data = await stateCall<Record<string, unknown>>(env, '/account/dashboard', { userId: account.id });
  return noStore(data);
}

export async function exportAccount(request: Request, env: Env) {
  const account = await sessionAccount(request, env);
  if (!account) return noStore({ error: 'Sign in to export your data.' }, 401);
  const data = await stateCall<{
    account: typeof account | null;
    generations: Array<Record<string, unknown> & { request_id: string }>;
    ledger: Array<Record<string, unknown>>;
    billing: Record<string, unknown> | null;
  }>(env, '/account/export', { userId: account.id });
  const payload = {
    exportedAt: new Date().toISOString(),
    account: data.account ? {
      email: data.account.email,
      plan: data.account.plan,
      starterCredits: data.account.starterCredits,
      subscriptionCredits: data.account.subscriptionCredits,
      packCredits: data.account.packCredits,
      subscriptionExpires: data.account.subscriptionExpires,
    } : null,
    generations: data.generations.map(({ image_key: imageKey, ...generation }) => ({
      ...generation,
      imageDownloadUrl: typeof imageKey === 'string' ? `${env.APP_ORIGIN}/api/account/export/image/?token=${encodeURIComponent(signExportImage(imageKey, generation.request_id, env))}` : null,
    })),
    creditActivity: data.ledger,
    billing: data.billing,
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="moss-image-account-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function deleteAccount(request: Request, env: Env) {
  if (request.headers.get('origin') !== env.APP_ORIGIN) return noStore({ error: 'Invalid request origin.' }, 403);
  const account = await sessionAccount(request, env);
  if (!account) return noStore({ error: 'Sign in to delete your account.' }, 401);
  const body = await request.json().catch(() => ({})) as { confirmation?: unknown };
  if (body.confirmation !== `DELETE ${account.email}`) {
    return noStore({ error: `Enter DELETE ${account.email} to confirm.` }, 400);
  }
  const data = await stateCall<{
    generations: Array<{ image_key: string | null }>;
    billing: { subscription?: { status?: string } | null } | null;
    pendingJobs: number;
  }>(env, '/account/export', { userId: account.id });
  if (data.pendingJobs) return noStore({ error: `${data.pendingJobs} generation${data.pendingJobs === 1 ? ' is' : 's are'} still running. This usually clears within 30–60 seconds; try again after it finishes.` }, 409);
  if (account.stripeCustomerId) {
    try { await deleteStripeCustomer(env, account.stripeCustomerId); }
    catch { return noStore({ error: 'The Stripe billing profile could not be deleted. No account data was removed; try again or contact support.' }, 502); }
  }
  const imageKeys = data.generations.map(item => item.image_key).filter((key): key is string => Boolean(key));
  if (imageKeys.length && env.GENERATIONS) await env.GENERATIONS.delete(imageKeys);
  const result = await stateCall<{ deleted: boolean; reason?: string }>(env, '/account/delete', { userId: account.id, stripeCustomerDeleted: Boolean(account.stripeCustomerId) });
  if (!result.deleted) return noStore({ error: result.reason === 'active_subscription' ? 'Cancel the active subscription before deleting your account.' : 'The account could not be deleted yet.' }, 409);
  const local = env.LOCAL_DEV === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(request.url).hostname);
  return Response.json({ deleted: true }, {
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': `moss_session=; Path=/; Max-Age=0; HttpOnly${local ? '' : '; Secure'}; SameSite=Lax`,
    },
  });
}

export async function exportedGenerationImage(request: Request, env: Env) {
  if (!env.GENERATIONS) return noStore({ error: 'Image storage is unavailable.' }, 503);
  const token = new URL(request.url).searchParams.get('token') || '';
  let exported: { imageKey: string; filename: string };
  try { exported = verifyExportImage(token, env); }
  catch { return noStore({ error: 'This image export link is invalid or has expired.' }, 403); }
  const object = await env.GENERATIONS.get(exported.imageKey);
  if (!object) return noStore({ error: 'Image not found.' }, 404);
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="moss-image-${exported.filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)}.png"`,
    'X-Content-Type-Options': 'nosniff',
  });
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}

export async function generationImage(request: Request, env: Env) {
  const account = await sessionAccount(request, env);
  if (!account) return noStore({ error: 'Sign in to view this image.' }, 401);
  if (!env.GENERATIONS) return noStore({ error: 'Image history storage is unavailable.' }, 503);
  const requestId = new URL(request.url).searchParams.get('id') || '';
  if (!requestId || requestId.length > 256) return noStore({ error: 'Invalid image.' }, 400);
  const { generation } = await stateCall<{ generation: { image_key: string | null } | null }>(
    env, '/generation/get', { userId: account.id, requestId },
  );
  if (!generation?.image_key) return noStore({ error: 'Image not found.' }, 404);
  const object = await env.GENERATIONS.get(generation.image_key);
  if (!object) return noStore({ error: 'Image not found.' }, 404);
  const headers = new Headers({ 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
  object.writeHttpMetadata(headers);
  if (new URL(request.url).searchParams.get('download') === '1') {
    headers.set('Content-Disposition', `attachment; filename="moss-image-${requestId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)}.png"`);
  }
  return new Response(object.body, { headers });
}

export async function deleteGeneration(request: Request, env: Env) {
  if (request.headers.get('origin') !== env.APP_ORIGIN) return noStore({ error: 'Invalid request origin.' }, 403);
  const account = await sessionAccount(request, env);
  if (!account) return noStore({ error: 'Sign in to delete this image.' }, 401);
  const body = await request.json().catch(() => ({})) as { id?: unknown };
  const requestId = typeof body.id === 'string' ? body.id : '';
  if (!requestId || requestId.length > 256) return noStore({ error: 'Invalid image.' }, 400);
  const found = await stateCall<{ generation: { image_key: string | null } | null }>(
    env, '/generation/get', { userId: account.id, requestId },
  );
  if (!found.generation) return noStore({ deleted: false }, 404);
  if (found.generation.image_key && env.GENERATIONS) await env.GENERATIONS.delete(found.generation.image_key);
  const result = await stateCall<{ deleted: boolean; imageKey: string | null }>(env, '/generation/delete', { userId: account.id, requestId });
  return noStore({ deleted: result.deleted }, result.deleted ? 200 : 404);
}
