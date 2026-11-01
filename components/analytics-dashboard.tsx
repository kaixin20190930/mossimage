'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Metric = { event: string; events: number; visitors: number };
type Summary = {
  days: number;
  since: string;
  generatedAt: string;
  totals: Metric[];
  daily: Array<Metric & { day: string }>;
  breakdowns: Array<Metric & { properties: Record<string, string> }>;
  generationFrequency: Array<{ bucket: string; visitors: number }>;
  dailySnapshots: Array<{ day: string; generatedAt: string; metrics: Metric[] }>;
  gscDaily: Array<{ day: string; clicks: number; impressions: number; ctr: number; position: number }>;
  gscTopQueries: Array<{ query: string; clicks: number; impressions: number; position: number }>;
  gscLastSync: string | null;
  gscSync: {
    lastAttemptAt: string | null; lastSuccessAt: string | null; status: string;
    rowsWritten: number; totalsWritten: number; inspectedUrls: number;
    inspectionErrors: number; sitemapsChecked: number; lastError: string | null;
  };
  gscInspections: Array<{
    url: string; inspectedAt: string; verdict?: string; coverageState?: string;
    lastCrawlTime?: string; googleCanonical?: string; userCanonical?: string;
  }>;
  gscSitemaps: Array<{
    path: string; checkedAt: string; lastSubmitted?: string; lastDownloaded?: string;
    isPending?: boolean; errors?: string; warnings?: string;
  }>;
};

const labels: Record<string, string> = {
  studio_view: 'Studio opened',
  generate_submit: 'Generation submitted',
  generate_success: 'Generation completed',
  generate_fail: 'Generation failed',
  verify_email_sent: 'Verification email sent',
  verify_success: 'Email verified',
  pricing_view: 'Pricing viewed',
  plan_click: 'Plan selected',
  checkout_open: 'Checkout opened',
  checkout_complete: 'Checkout completed',
  upgrade_impression: 'Upgrade shown',
  upgrade_pack_click: 'Upgrade pack selected',
  upgrade_pricing_click: 'Upgrade pricing opened',
  generation_error_view: 'Generation recovery shown',
  generation_retry: 'Generation retried',
  quick_start_view: 'Quick starts shown',
  quick_start_select: 'Quick start selected',
};

const funnel = [
  ['generate_submit', 'generate_success'],
  ['verify_email_sent', 'verify_success'],
  ['pricing_view', 'plan_click'],
  ['plan_click', 'checkout_open'],
  ['checkout_open', 'checkout_complete'],
  ['upgrade_impression', 'upgrade_pack_click'],
  ['upgrade_impression', 'upgrade_pricing_click'],
  ['generation_error_view', 'generation_retry'],
] as const;

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary>();
  const [status, setStatus] = useState('Loading anonymous funnel data…');

  const load = useCallback(async () => {
    setStatus('Loading anonymous funnel data…');
    try {
      const response = await fetch(`/api/analytics/summary/?days=${days}`, { credentials: 'same-origin' });
      if (response.status === 403) {
        setData(undefined);
        setStatus('Sign in with the administrator email address to view this report.');
        return;
      }
      if (!response.ok) throw new Error();
      setData(await response.json() as Summary);
      setStatus('');
    } catch {
      setData(undefined);
      setStatus('The report could not be loaded. Try again shortly.');
    }
  }, [days]);

  useEffect(() => {
    void load();
    window.addEventListener('moss-account-change', load);
    return () => window.removeEventListener('moss-account-change', load);
  }, [load]);

  const totals = useMemo(() => new Map(data?.totals.map(metric => [metric.event, metric]) || []), [data]);
  const syncStale = data?.gscSync.lastSuccessAt ? Date.now() - new Date(data.gscSync.lastSuccessAt).getTime() > 26 * 60 * 60 * 1000 : true;

  return <div className="analytics-dashboard">
    <div className="analytics-toolbar">
      <div>{[7, 30, 90].map(value => <button key={value} type="button" className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} days</button>)}</div>
      <button type="button" onClick={() => void load()}>Refresh</button>
    </div>
    {status && <div className="analytics-empty"><p>{status}</p>{status.startsWith('Sign in') && <button type="button" onClick={() => window.dispatchEvent(new Event('moss-open-account'))}>Sign in</button>}</div>}
    {data && <>
      <p className="analytics-note">Anonymous first-party events since {data.since}. “People” counts distinct browser IDs; no email, prompt, image, or IP is stored.</p>
      <div className="analytics-metrics">{Object.entries(labels).map(([event, label]) => {
        const metric = totals.get(event);
        return <article key={event}><span>{label}</span><strong>{metric?.events || 0}</strong><small>{metric?.visitors || 0} people</small></article>;
      })}</div>
      <section className="analytics-funnel">
        <h2>Step conversion</h2>
        <div>{funnel.map(([from, to]) => {
          const start = totals.get(from)?.visitors || 0;
          const end = totals.get(to)?.visitors || 0;
          const rate = start ? Math.min(100, end / start * 100) : 0;
          return <article key={`${from}-${to}`}><span>{labels[from]} → {labels[to]}</span><strong>{rate.toFixed(1)}%</strong><small>{end} / {start} people</small></article>;
        })}</div>
      </section>
      <section className="analytics-funnel">
        <h2>Successful generations per person</h2>
        <div>{data.generationFrequency.map(row => <article key={row.bucket}><span>{row.bucket} successful {row.bucket === '1' ? 'generation' : 'generations'}</span><strong>{row.visitors}</strong><small>anonymous browser IDs</small></article>)}</div>
      </section>
      <section className="analytics-breakdowns">
        <h2>Search Console</h2>
        <div className={`analytics-health ${syncStale || data.gscSync.status === 'failed' ? 'warning' : ''}`}>
          <strong>{data.gscSync.status === 'never' ? 'Waiting for first sync' : `Sync ${data.gscSync.status.replaceAll('_', ' ')}`}</strong>
          <span>Last success: {data.gscSync.lastSuccessAt ? new Date(data.gscSync.lastSuccessAt).toLocaleString() : 'none'}</span>
          <span>{data.gscSync.rowsWritten} query rows · {data.gscSync.totalsWritten} daily totals · {data.gscSync.inspectedUrls} URLs inspected</span>
          {data.gscSync.lastError && <small>{data.gscSync.lastError}</small>}
        </div>
        <p className="analytics-note">Final Google Search data, refreshed daily with a three-day reporting delay. Daily totals are queried separately from privacy-filtered query details.</p>
        {data.gscDaily.length > 0 && <table><thead><tr><th>Date</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Average position</th></tr></thead><tbody>{data.gscDaily.map(row => <tr key={row.day}><td>{row.day}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{(row.ctr * 100).toFixed(1)}%</td><td>{row.position.toFixed(1)}</td></tr>)}</tbody></table>}
        <h3>Top queries</h3>
        {data.gscTopQueries.length > 0 ? <table><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>Average position</th></tr></thead><tbody>{data.gscTopQueries.map(row => <tr key={row.query}><td>{row.query || '(anonymous query)'}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{row.position.toFixed(1)}</td></tr>)}</tbody></table> : <p className="analytics-note">No Search Console rows have been stored yet.</p>}
      </section>
      <section className="analytics-breakdowns">
        <h2>Google index status</h2>
        <p className="analytics-note">Latest indexed-version result from the URL Inspection API. This is not a live-page test.</p>
        {data.gscInspections.length > 0 ? <table><thead><tr><th>URL</th><th>Verdict</th><th>Coverage</th><th>Last crawl</th></tr></thead><tbody>{data.gscInspections.map(row => <tr key={row.url}><td><a href={row.url}>{new URL(row.url).pathname}</a></td><td>{row.verdict || 'Unknown'}</td><td>{row.coverageState || 'Unknown'}</td><td>{row.lastCrawlTime ? new Date(row.lastCrawlTime).toLocaleString() : '—'}</td></tr>)}</tbody></table> : <p className="analytics-note">No URL inspections have been stored yet.</p>}
        <h3>Sitemaps</h3>
        {data.gscSitemaps.length > 0 ? <table><thead><tr><th>Sitemap</th><th>Last downloaded</th><th>Errors</th><th>Warnings</th></tr></thead><tbody>{data.gscSitemaps.map(row => <tr key={row.path}><td>{row.path}</td><td>{row.lastDownloaded ? new Date(row.lastDownloaded).toLocaleString() : '—'}</td><td>{row.errors || '0'}</td><td>{row.warnings || '0'}</td></tr>)}</tbody></table> : <p className="analytics-note">No sitemap status has been stored yet.</p>}
      </section>
      <section className="analytics-breakdowns">
        <h2>Daily snapshots</h2>
        <p className="analytics-note">Immutable daily funnel summaries stored in the existing Durable Object. {data.dailySnapshots.length} snapshot{data.dailySnapshots.length === 1 ? '' : 's'} in this window.</p>
      </section>
      {data.breakdowns.length > 0 && <section className="analytics-breakdowns"><h2>Breakdowns</h2><table><thead><tr><th>Event</th><th>Properties</th><th>Events</th><th>People</th></tr></thead><tbody>{data.breakdowns.map((row, index) => <tr key={`${row.event}-${index}`}><td>{labels[row.event] || row.event}</td><td>{Object.entries(row.properties).map(([key, value]) => `${key}: ${value}`).join(' · ')}</td><td>{row.events}</td><td>{row.visitors}</td></tr>)}</tbody></table></section>}
    </>}
  </div>;
}
