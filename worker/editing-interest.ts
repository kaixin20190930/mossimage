import { z } from 'zod';
import type { Env } from './env';
import { signValue } from '../lib/server';
import { stateCall } from './state';

const schema = z.object({
  visitorId: z.string().uuid(),
  choices: z.object({ styleChange: z.boolean(), selectiveRepaint: z.boolean(), textReplacement: z.boolean(), compositionChange: z.boolean(), other: z.boolean() }).strict(),
  note: z.string().trim().max(280),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]),
}).strict().refine(value => Object.values(value.choices).some(Boolean), 'Select at least one workflow.');

async function encryptEmail(email: string, secret: string) {
  if (!email) return null;
  const keyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:editing-interest`));
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(email)));
  return `${Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join('')}.${Array.from(encrypted, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function recordEditingInterest(request: Request, env: Env) {
  if (request.headers.get('origin') !== env.APP_ORIGIN) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 2048) return Response.json({ error: 'Payload too large.' }, { status: 413 });
  try {
    const raw = await request.text();
    if (raw.length > 2048) return Response.json({ error: 'Payload too large.' }, { status: 413 });
    const input = schema.parse(JSON.parse(raw));
    const visitorHash = signValue(input.visitorId, 'editing-interest-visitor', env);
    const emailHash = input.email ? signValue(input.email, 'editing-interest-email', env) : null;
    const emailCipher = input.email ? await encryptEmail(input.email, env.APP_SECRET || '') : null;
    await stateCall(env, '/editing-interest/record', { visitorHash, choices: input.choices, note: input.note, emailHash, emailCipher });
    return Response.json({ recorded: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid request.';
    return Response.json({ error: message || 'Invalid request.' }, { status: 400 });
  }
}
