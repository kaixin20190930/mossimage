import type { Env } from './env';
import { stateCall } from './state';

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type SearchRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

function base64Url(input: string | ArrayBuffer) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function privateKeyBytes(pem: string) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(body);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function accessToken(rawCredentials: string) {
  const credentials = JSON.parse(rawCredentials) as ServiceAccount;
  if (!credentials.client_email || !credentials.private_key) throw new Error('Invalid GSC service account secret');
  const now = Math.floor(Date.now() / 1000);
  const encoded = `${base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: credentials.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', privateKeyBytes(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(encoded));
  const response = await fetch(credentials.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${encoded}.${base64Url(signature)}`,
    }),
  });
  if (!response.ok) throw new Error(`GSC token request failed (${response.status})`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error('GSC token response missing access token');
  return body.access_token;
}

function isoDay(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export async function runDailyReporting(env: Env, scheduledTime = Date.now()) {
  const snapshotDay = isoDay(scheduledTime - 86400000);
  await stateCall(env, '/analytics/snapshot', { day: snapshotDay, generatedAt: scheduledTime });

  if (!env.GSC_SERVICE_ACCOUNT_JSON || !env.GSC_SITE_URL) {
    console.warn(JSON.stringify({ event: 'gsc_sync_skipped', reason: 'not_configured' }));
    return;
  }

  // Search Console final data normally trails real time. Re-fetch a seven-day
  // window ending three days ago so late adjustments replace earlier rows.
  const endDate = isoDay(scheduledTime - 3 * 86400000);
  const startDate = isoDay(scheduledTime - 9 * 86400000);
  const token = await accessToken(env.GSC_SERVICE_ACCOUNT_JSON);
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(env.GSC_SITE_URL)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate, endDate, dimensions: ['date', 'query', 'page'],
      rowLimit: 25000, dataState: 'final', aggregationType: 'auto',
    }),
  });
  if (!response.ok) throw new Error(`GSC query failed (${response.status})`);
  const data = await response.json() as { rows?: SearchRow[] };
  const rows = (data.rows || []).flatMap(row => {
    if (!row.keys || row.keys.length !== 3) return [];
    return [{
      day: row.keys[0], query: row.keys[1], page: row.keys[2],
      clicks: Number(row.clicks || 0), impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0), position: Number(row.position || 0),
    }];
  });
  await stateCall(env, '/gsc/replace', { startDate, endDate, fetchedAt: scheduledTime, rows });
  console.log(JSON.stringify({ event: 'gsc_sync_complete', startDate, endDate, rows: rows.length }));
}
