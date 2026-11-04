import { randomBytes, randomInt } from 'node:crypto';
import { z } from 'zod';
import type { Env } from './env';
import { identity, signValue } from '../lib/server';
import { stateCall, type Account } from './state';

const emailSchema = z.string().trim().toLowerCase().email().max(320);
const verifySchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/),
}).strict();

export function authConfigured(env: Env) {
  return env.AUTH_ENABLED === 'true' && !!env.EMAIL && !!env.AUTH_EMAIL_FROM;
}

function sameOrigin(request: Request, env: Env) {
  return request.headers.get('origin') === env.APP_ORIGIN;
}

function cookie(request: Request, name: string) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
}

function sessionHash(request: Request, env: Env) {
  const token = cookie(request, 'moss_session');
  return token ? signValue(token, 'session', env) : undefined;
}

export async function sessionAccount(request: Request, env: Env): Promise<Account | null> {
  const hash = sessionHash(request, env);
  if (!hash) return null;
  const result = await stateCall<{ account: Account | null }>(env, '/session', { sessionHash: hash });
  return result.account;
}

export async function account(request: Request, env: Env) {
  const current = authConfigured(env) ? await sessionAccount(request, env) : null;
  return Response.json({
    authEnabled: authConfigured(env),
    paymentsEnabled: paymentsConfigured(env),
    account: current,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function requestCode(request: Request, env: Env) {
  if (!authConfigured(env)) return Response.json({ error: 'Account sign-in is not available yet.' }, { status: 503 });
  if (!sameOrigin(request, env)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  let email: string;
  try { email = emailSchema.parse((await request.json() as { email?: unknown }).email); }
  catch { return Response.json({ error: 'Enter a valid email address.' }, { status: 400 }); }
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const codeHash = signValue(`${email}:${code}`, 'email-code', env);
  let owner: string;
  try { owner = identity(request, env); }
  catch { return Response.json({ error: 'Client address could not be verified.' }, { status: 503 }); }
  const reserved = await stateCall<{ accepted: boolean; retryAfter?: number }>(env, '/auth/request', { email, codeHash, owner });
  if (!reserved.accepted) return Response.json({ error: 'Please wait before requesting another code.' }, { status: 429, headers: { 'Retry-After': String(reserved.retryAfter || 60) } });

  const local = env.LOCAL_DEV === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(request.url).hostname);
  if (local) return Response.json({ sent: true, debugCode: code });
  try {
    await env.EMAIL!.send({
      from: { email: env.AUTH_EMAIL_FROM!, name: 'MOSS Image' },
      to: email,
      subject: `${code} is your MOSS Image sign-in code`,
      text: `Your MOSS Image sign-in code is ${code}. It expires in 10 minutes. If you did not request it, you can ignore this email.`,
      html: `<p>Your MOSS Image sign-in code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
    });
  } catch {
    console.error(JSON.stringify({ event: 'auth_email_failed' }));
    return Response.json({ error: 'The sign-in email could not be sent. Please try again later.' }, { status: 502 });
  }
  return Response.json({ sent: true });
}

export async function verifyCode(request: Request, env: Env) {
  if (!authConfigured(env)) return Response.json({ error: 'Account sign-in is not available yet.' }, { status: 503 });
  if (!sameOrigin(request, env)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  let input: z.infer<typeof verifySchema>;
  try { input = verifySchema.parse(await request.json()); }
  catch { return Response.json({ error: 'Enter the six-digit code from your email.' }, { status: 400 }); }
  const token = randomBytes(32).toString('base64url');
  const result = await stateCall<{ verified: boolean; account?: Account; starterGranted?: boolean }>(env, '/auth/verify', {
    email: input.email,
    codeHash: signValue(`${input.email}:${input.code}`, 'email-code', env),
    userId: signValue(input.email, 'user', env),
    sessionHash: signValue(token, 'session', env),
  });
  if (!result.verified) return Response.json({ error: 'That code is invalid or has expired.' }, { status: 401 });
  const local = env.LOCAL_DEV === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(request.url).hostname);
  return Response.json({ account: result.account, starterGranted: result.starterGranted === true }, {
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': `moss_session=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; HttpOnly${local ? '' : '; Secure'}; SameSite=Lax`,
    },
  });
}

export async function logout(request: Request, env: Env) {
  if (!sameOrigin(request, env)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const hash = sessionHash(request, env);
  if (hash) await stateCall(env, '/logout', { sessionHash: hash });
  const local = env.LOCAL_DEV === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(request.url).hostname);
  return Response.json({ ok: true }, {
    headers: { 'Set-Cookie': `moss_session=; Path=/; Max-Age=0; HttpOnly${local ? '' : '; Secure'}; SameSite=Lax` },
  });
}

export function paymentsConfigured(env: Env) {
  return !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WEBHOOK_SECRET &&
    !!env.STRIPE_PRICE_CREDIT_PACK_30 && !!env.STRIPE_PRICE_PRO_MONTHLY_80 &&
    !!env.STRIPE_PRICE_PRO_ANNUAL_800;
}
