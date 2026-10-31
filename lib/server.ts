import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
export type Settings = {
  FAL_KEY?: string; APP_SECRET?: string; APP_ORIGIN?: string;
  GENERATION_ENABLED?: string; LOCAL_DEV?: string; AUTH_ENABLED?: string;
};
export function configured(env: Settings) {
  return env.GENERATION_ENABLED === 'true' && !!env.FAL_KEY &&
    (env.APP_SECRET?.length ?? 0) >= 32 && !!env.APP_ORIGIN;
}
export function secret(env: Settings) {
  if (!env.APP_SECRET || env.APP_SECRET.length < 32) throw new Error('Missing application secret');
  return env.APP_SECRET;
}
export function signValue(value: string, purpose: string, env: Settings) {
  return createHmac('sha256', secret(env)).update(`${purpose}:${value}`).digest('hex');
}
export function identity(request: Request, env: Settings) {
  const host = new URL(request.url).hostname;
  // Local identity is fixed, not taken from a spoofable browser header.
  // Both the explicit dev flag and a loopback URL are required.
  const local = env.LOCAL_DEV === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(host);
  const ip = local ? '127.0.0.1' : request.headers.get('cf-connecting-ip')?.trim();
  if (!ip || !isIP(ip)) throw new Error('Missing Cloudflare client address');
  return createHmac('sha256', secret(env)).update(ip).digest('hex');
}
export function signJob(requestId: string, owner: string, env: Settings, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ requestId, owner, expires: now + 3600000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret(env)).update(payload).digest('base64url')}`;
}
export function verifyJob(token: string, owner: string, env: Settings, now = Date.now()): string {
  if (token.length > 2048) throw new Error('Invalid job');
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) throw new Error('Invalid job');
  const expected = createHmac('sha256', secret(env)).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid job');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (data.owner !== owner || !Number.isFinite(data.expires) || data.expires <= now || typeof data.requestId !== 'string') throw new Error('Expired or unauthorized job');
  return data.requestId;
}

export function signExportImage(imageKey: string, filename: string, env: Settings, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ imageKey, filename, expires: now + 7 * 86400000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret(env)).update(`export-image:${payload}`).digest('base64url')}`;
}

export function verifyExportImage(token: string, env: Settings, now = Date.now()) {
  if (!token || token.length > 4096) throw new Error('Invalid export token');
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) throw new Error('Invalid export token');
  const expected = createHmac('sha256', secret(env)).update(`export-image:${payload}`).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid export token');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { imageKey?: unknown; filename?: unknown; expires?: unknown };
  if (typeof data.imageKey !== 'string' || !data.imageKey || data.imageKey.length > 1024 || typeof data.filename !== 'string' || data.filename.length > 256 || !Number.isFinite(data.expires) || Number(data.expires) <= now) throw new Error('Expired export token');
  return { imageKey: data.imageKey, filename: data.filename };
}
