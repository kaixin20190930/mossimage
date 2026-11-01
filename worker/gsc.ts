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

type InspectionPayload = {
  verdict?: string;
  coverageState?: string;
  robotsTxtState?: string;
  indexingState?: string;
  pageFetchState?: string;
  lastCrawlTime?: string;
  googleCanonical?: string;
  userCanonical?: string;
  crawledAs?: string;
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

async function searchAnalytics(token: string, endpoint: string, startDate: string, endDate: string, dimensions: string[]) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 25000, dataState: 'final', aggregationType: 'auto' }),
  });
  if (!response.ok) throw new Error(`GSC query failed (${response.status})`);
  return response.json() as Promise<{ rows?: SearchRow[] }>;
}

function sitemapUrls(xml: string, origin: string) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => match[1].replace(/&amp;/g, '&'))
    .filter(url => url.startsWith(origin + '/'));
}

async function inspectUrls(token: string, siteUrl: string, urls: string[]) {
  const rows: Array<{ url: string; payload: InspectionPayload }> = [];
  let errors = 0;
  for (let index = 0; index < urls.length; index += 5) {
    const batch = await Promise.all(urls.slice(index, index + 5).map(async url => {
      try {
        const response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inspectionUrl: url, siteUrl, languageCode: 'en-US' }),
        });
        if (!response.ok) throw new Error(`inspection ${response.status}`);
        const body = await response.json() as { inspectionResult?: { indexStatusResult?: InspectionPayload } };
        return { url, payload: body.inspectionResult?.indexStatusResult || {} };
      } catch {
        return null;
      }
    }));
    for (const row of batch) row ? rows.push(row) : errors++;
  }
  return { rows, errors };
}

export async function runDailyReporting(env: Env, scheduledTime = Date.now()) {
  const snapshotDay = isoDay(scheduledTime - 86400000);
  await stateCall(env, '/analytics/snapshot', { day: snapshotDay, generatedAt: scheduledTime });

  await stateCall(env, '/gsc/sync-status', { status: 'running', timestamp: scheduledTime });

  if (!env.GSC_SERVICE_ACCOUNT_JSON || !env.GSC_SITE_URL) {
    await stateCall(env, '/gsc/sync-status', { status: 'skipped', timestamp: scheduledTime, error: 'GSC is not configured.' });
    console.warn(JSON.stringify({ event: 'gsc_sync_skipped', reason: 'not_configured' }));
    return;
  }

  try {
    // Search Console final data normally trails real time. Re-fetch a seven-day
    // window ending three days ago so late adjustments replace earlier rows.
    const endDate = isoDay(scheduledTime - 3 * 86400000);
    const startDate = isoDay(scheduledTime - 9 * 86400000);
    const token = await accessToken(env.GSC_SERVICE_ACCOUNT_JSON);
    const encodedSite = encodeURIComponent(env.GSC_SITE_URL);
    const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;
    const [detailData, totalData, publicSitemap, sitemapResponse] = await Promise.all([
      searchAnalytics(token, endpoint, startDate, endDate, ['date', 'query', 'page']),
      searchAnalytics(token, endpoint, startDate, endDate, ['date']),
      fetch(`${env.APP_ORIGIN}/sitemap.xml`),
      fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    if (!publicSitemap.ok) throw new Error(`Public sitemap failed (${publicSitemap.status})`);
    const urls = sitemapUrls(await publicSitemap.text(), env.APP_ORIGIN);
    const details = (detailData.rows || []).flatMap(row => {
      if (!row.keys || row.keys.length !== 3) return [];
      return [{ day: row.keys[0], query: row.keys[1], page: row.keys[2], clicks: Number(row.clicks || 0), impressions: Number(row.impressions || 0), ctr: Number(row.ctr || 0), position: Number(row.position || 0) }];
    });
    const totals = (totalData.rows || []).flatMap(row => {
      if (!row.keys || row.keys.length !== 1) return [];
      return [{ day: row.keys[0], clicks: Number(row.clicks || 0), impressions: Number(row.impressions || 0), ctr: Number(row.ctr || 0), position: Number(row.position || 0) }];
    });
    const stored = await stateCall<{ rows: number; totals: number }>(env, '/gsc/replace', { startDate, endDate, fetchedAt: scheduledTime, rows: details, totals });

    const inspection = await inspectUrls(token, env.GSC_SITE_URL, urls);
    await stateCall(env, '/gsc/inspections/replace', { inspectedAt: scheduledTime, rows: inspection.rows.map(row => ({ url: row.url, payload: row.payload })) });

    let sitemapRows: Array<{ path: string; payload: Record<string, unknown> }> = [];
    let sitemapErrors = 0;
    if (sitemapResponse.ok) {
      const body = await sitemapResponse.json() as { sitemap?: Array<Record<string, unknown> & { path?: string }> };
      sitemapRows = (body.sitemap || []).flatMap(row => row.path ? [{ path: row.path, payload: row }] : []);
      await stateCall(env, '/gsc/sitemaps/replace', { checkedAt: scheduledTime, rows: sitemapRows });
    } else {
      sitemapErrors = 1;
    }

    const warnings = inspection.errors + sitemapErrors;
    await stateCall(env, '/gsc/sync-status', {
      status: warnings ? 'success_with_warnings' : 'success', timestamp: scheduledTime,
      rowsWritten: stored.rows, totalsWritten: stored.totals, inspectedUrls: inspection.rows.length,
      inspectionErrors: inspection.errors, sitemapsChecked: sitemapRows.length,
      ...(warnings ? { error: `${warnings} secondary check${warnings === 1 ? '' : 's'} failed.` } : {}),
    });
    console.log(JSON.stringify({ event: 'gsc_sync_complete', startDate, endDate, rows: stored.rows, totals: stored.totals, inspectedUrls: inspection.rows.length, warnings }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown GSC sync error';
    await stateCall(env, '/gsc/sync-status', { status: 'failed', timestamp: scheduledTime, error: message }).catch(() => undefined);
    console.error(JSON.stringify({ event: 'gsc_sync_failed', error: message }));
    throw error;
  }
}
