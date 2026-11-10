import { DurableObject } from 'cloudflare:workers';
import type { Env } from './env';

export type Account = {
  id: string;
  email: string;
  frozen: boolean;
  plan: 'free' | 'monthly' | 'annual';
  starterCredits: number;
  subscriptionCredits: number;
  packCredits: number;
  subscriptionExpires: number | null;
  stripeCustomerId: string | null;
};

type UserRow = {
  id: string; email: string; frozen: number; plan: Account['plan'];
  starter_credits: number; subscription_credits: number; pack_credits: number;
  subscription_expires: number | null; stripe_customer_id: string | null;
};

/** One global instance keeps the provider budget and every credit mutation in the
 * same SQLite transaction. This is intentionally simple for the initial scale.
 */
export class GenerationState extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS entries (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS entries_expiry ON entries(expires)');
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created INTEGER NOT NULL,
      frozen INTEGER NOT NULL DEFAULT 0, plan TEXT NOT NULL DEFAULT 'free',
      starter_credits INTEGER NOT NULL DEFAULT 3,
      subscription_credits INTEGER NOT NULL DEFAULT 0,
      pack_credits INTEGER NOT NULL DEFAULT 0,
      subscription_expires INTEGER,
      stripe_customer_id TEXT
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires)');
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS auth_codes (
      email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS deleted_identities (
      email_hash TEXT PRIMARY KEY, created INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS jobs (
      reservation_id TEXT PRIMARY KEY, request_id TEXT UNIQUE, user_id TEXT NOT NULL,
      bucket TEXT NOT NULL, pixels INTEGER NOT NULL, resolved INTEGER NOT NULL DEFAULT 0,
      created INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS subscriptions (
      stripe_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan TEXT NOT NULL,
      status TEXT NOT NULL, period_end INTEGER
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS payments (
      stripe_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan TEXT NOT NULL,
      subscription_id TEXT, status TEXT NOT NULL, created INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL,
      source_id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, bucket TEXT NOT NULL,
      delta INTEGER NOT NULL, created INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS generations (
      request_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, prompt TEXT NOT NULL,
      mode TEXT NOT NULL, size TEXT NOT NULL, requested_seed INTEGER,
      result_seed INTEGER, image_key TEXT, status TEXT NOT NULL DEFAULT 'pending',
      created INTEGER NOT NULL, completed INTEGER
    )`);
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS generations_user_created ON generations(user_id, created DESC)');
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS generation_intents (
      intent_id TEXT PRIMARY KEY, reservation_id TEXT NOT NULL UNIQUE,
      provider_request_id TEXT UNIQUE, owner_hash TEXT NOT NULL, user_id TEXT,
      attempt_number INTEGER NOT NULL, pixels INTEGER NOT NULL,
      write_ahead_at INTEGER NOT NULL, provider_accepted_at INTEGER, resolved_at INTEGER,
      outcome TEXT NOT NULL DEFAULT 'submitting', failure_reason TEXT,
      credit_action TEXT NOT NULL DEFAULT 'reserved'
    )`);
    const intentColumns = new Set(ctx.storage.sql.exec<{ name: string }>('PRAGMA table_info(generation_intents)').toArray().map(column => column.name));
    const addIntentColumn = (name: string, definition: string) => {
      if (!intentColumns.has(name)) ctx.storage.sql.exec(`ALTER TABLE generation_intents ADD COLUMN ${name} ${definition}`);
    };
    addIntentColumn('last_polled_at', 'INTEGER');
    addIntentColumn('poll_attempts', 'INTEGER NOT NULL DEFAULT 0');
    addIntentColumn('poll_error_count', 'INTEGER NOT NULL DEFAULT 0');
    addIntentColumn('last_provider_status', 'TEXT');
    addIntentColumn('first_uncertain_at', 'INTEGER');
    addIntentColumn('resolution_source', 'TEXT');
    addIntentColumn('mode', 'TEXT');
    addIntentColumn('size', 'TEXT');
    addIntentColumn('prompt_length_bucket', 'TEXT');
    addIntentColumn('measurement_version', "TEXT NOT NULL DEFAULT 'legacy'");
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS generation_intents_owner_time ON generation_intents(owner_hash, write_ahead_at DESC)');
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY, created INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS analytics_events (
      day TEXT NOT NULL, event TEXT NOT NULL, visitor_hash TEXT NOT NULL,
      dimension TEXT NOT NULL DEFAULT '', count INTEGER NOT NULL DEFAULT 1,
      first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL,
      PRIMARY KEY(day, event, visitor_hash, dimension)
    )`);
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS analytics_events_day ON analytics_events(day)');
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS editing_interest (
      visitor_hash TEXT PRIMARY KEY, style_change INTEGER NOT NULL DEFAULT 0,
      selective_repaint INTEGER NOT NULL DEFAULT 0, text_replacement INTEGER NOT NULL DEFAULT 0,
      composition_change INTEGER NOT NULL DEFAULT 0, other_choice INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '', email_hash TEXT, email_cipher TEXT,
      created INTEGER NOT NULL, updated INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS editing_interest_updated ON editing_interest(updated)');
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS daily_funnel_snapshots (
      day TEXT PRIMARY KEY, generated_at INTEGER NOT NULL, payload TEXT NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS gsc_search_rows (
      day TEXT NOT NULL, query TEXT NOT NULL, page TEXT NOT NULL,
      clicks REAL NOT NULL, impressions REAL NOT NULL, ctr REAL NOT NULL,
      position REAL NOT NULL, fetched_at INTEGER NOT NULL,
      PRIMARY KEY(day, query, page)
    )`);
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS gsc_search_rows_day ON gsc_search_rows(day)');
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS gsc_daily_totals (
      day TEXT PRIMARY KEY, clicks REAL NOT NULL, impressions REAL NOT NULL,
      ctr REAL NOT NULL, position REAL NOT NULL, fetched_at INTEGER NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS gsc_sync_status (
      id INTEGER PRIMARY KEY CHECK (id = 1), last_attempt_at INTEGER,
      last_success_at INTEGER, status TEXT NOT NULL DEFAULT 'never',
      rows_written INTEGER NOT NULL DEFAULT 0, totals_written INTEGER NOT NULL DEFAULT 0,
      inspected_urls INTEGER NOT NULL DEFAULT 0, inspection_errors INTEGER NOT NULL DEFAULT 0,
      sitemaps_checked INTEGER NOT NULL DEFAULT 0, last_error TEXT
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS gsc_url_inspections (
      url TEXT PRIMARY KEY, inspected_at INTEGER NOT NULL, payload TEXT NOT NULL
    )`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS gsc_sitemaps (
      path TEXT PRIMARY KEY, checked_at INTEGER NOT NULL, payload TEXT NOT NULL
    )`);
  }

  protected now() { return Date.now(); }

  private read<T>(key: string, now: number): T | undefined {
    const rows = this.ctx.storage.sql.exec<{ value: string }>(
      'SELECT value FROM entries WHERE key = ? AND expires > ?', key, now,
    ).toArray();
    return rows.length ? JSON.parse(rows[0].value) as T : undefined;
  }

  private write(key: string, value: unknown, expires: number) {
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO entries(key, value, expires) VALUES (?, ?, ?)',
      key, JSON.stringify(value), expires,
    );
  }

  private account(row: UserRow): Account {
    return {
      id: row.id, email: row.email, frozen: !!row.frozen, plan: row.plan,
      starterCredits: row.starter_credits,
      subscriptionCredits: row.subscription_credits,
      packCredits: row.pack_credits,
      subscriptionExpires: row.subscription_expires,
      stripeCustomerId: row.stripe_customer_id,
    };
  }

  private user(id: string) {
    return this.ctx.storage.sql.exec<UserRow>('SELECT * FROM users WHERE id = ?', id).toArray()[0];
  }

  private addLedger(userId: string, sourceId: string, kind: string, bucket: string, delta: number, now: number) {
    this.ctx.storage.sql.exec(
      'INSERT INTO ledger(user_id, source_id, kind, bucket, delta, created) VALUES (?, ?, ?, ?, ?, ?)',
      userId, sourceId, kind, bucket, delta, now,
    );
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const input = await request.json() as Record<string, unknown>;
    const path = new URL(request.url).pathname;
    const now = this.now();
    if (await this.ctx.storage.getAlarm() === null) await this.ctx.storage.setAlarm(now + 60000);

    const result = this.ctx.storage.transactionSync(() => {
      if (path === '/analytics/record') {
        const allowed = new Set([
          'generate_submit','generate_success','generate_fail','verify_email_sent','verify_success',
          'pricing_view','plan_click','checkout_open','checkout_complete',
          'upgrade_impression','upgrade_pack_click','upgrade_pricing_click',
          'generation_error_view','generation_retry','refunded_retry_cta_view','uncertain_recheck_click',
          'verified_landing_view','quick_start_eligible','quick_start_rendered',
          'quick_start_view','quick_start_select','studio_view','editing_early_access_view',
        ]);
        const event = String(input.event || '');
        const visitorHash = String(input.visitorHash || '');
        const properties = input.properties && typeof input.properties === 'object' ? input.properties as Record<string, unknown> : {};
        if (!allowed.has(event) || !/^[a-f0-9]{64}$/.test(visitorHash)) throw new Error('Invalid analytics event');
        const dimension = JSON.stringify({
          ...(typeof properties.plan === 'string' ? { plan: properties.plan } : {}),
          ...(typeof properties.mode === 'string' ? { mode: properties.mode } : {}),
          ...(typeof properties.size === 'string' ? { size: properties.size } : {}),
          ...(typeof properties.errorCode === 'string' ? { errorCode: properties.errorCode } : {}),
          ...(typeof properties.example === 'string' ? { example: properties.example } : {}),
          ...(typeof properties.source === 'string' ? { source: properties.source } : {}),
        });
        const day = new Date(now).toISOString().slice(0, 10);
        this.ctx.storage.sql.exec(
          `INSERT INTO analytics_events(day, event, visitor_hash, dimension, count, first_seen, last_seen)
           VALUES (?, ?, ?, ?, 1, ?, ?)
           ON CONFLICT(day, event, visitor_hash, dimension)
           DO UPDATE SET count = MIN(count + 1, 1000), last_seen = excluded.last_seen`,
          day, event, visitorHash, dimension, now, now,
        );
        return { ok: true };
      }

      if (path === '/editing-interest/record') {
        const visitorHash = String(input.visitorHash || '');
        const choices = input.choices && typeof input.choices === 'object' ? input.choices as Record<string, unknown> : {};
        const note = String(input.note || '').trim().slice(0, 280);
        const emailHash = input.emailHash ? String(input.emailHash) : null;
        const emailCipher = input.emailCipher ? String(input.emailCipher) : null;
        if (!/^[a-f0-9]{64}$/.test(visitorHash) || (emailHash && !/^[a-f0-9]{64}$/.test(emailHash)) || (emailCipher && !/^[a-f0-9]{24}\.[a-f0-9]+$/.test(emailCipher))) throw new Error('Invalid editing interest');
        const values = ['styleChange','selectiveRepaint','textReplacement','compositionChange','other'].map(key => choices[key] === true ? 1 : 0);
        if (!values.some(Boolean)) throw new Error('No editing choice');
        this.ctx.storage.sql.exec(
          `INSERT INTO editing_interest(visitor_hash, style_change, selective_repaint, text_replacement, composition_change, other_choice, note, email_hash, email_cipher, created, updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(visitor_hash) DO UPDATE SET style_change = excluded.style_change, selective_repaint = excluded.selective_repaint,
             text_replacement = excluded.text_replacement, composition_change = excluded.composition_change, other_choice = excluded.other_choice,
             note = excluded.note, email_hash = COALESCE(excluded.email_hash, editing_interest.email_hash),
             email_cipher = COALESCE(excluded.email_cipher, editing_interest.email_cipher), updated = excluded.updated`,
          visitorHash, ...values, note, emailHash, emailCipher, now, now,
        );
        return { recorded: true };
      }

      if (path === '/analytics/summary') {
        const days = Math.min(90, Math.max(1, Number(input.days) || 30));
        const since = new Date(now - (days - 1) * 86400000).toISOString().slice(0, 10);
        const totals = this.ctx.storage.sql.exec<{ event: string; events: number; visitors: number }>(
          `SELECT event, SUM(count) AS events, COUNT(DISTINCT visitor_hash) AS visitors
           FROM analytics_events WHERE day >= ? GROUP BY event ORDER BY event`, since,
        ).toArray();
        const daily = this.ctx.storage.sql.exec<{ day: string; event: string; events: number; visitors: number }>(
          `SELECT day, event, SUM(count) AS events, COUNT(DISTINCT visitor_hash) AS visitors
           FROM analytics_events WHERE day >= ? GROUP BY day, event ORDER BY day DESC, event`, since,
        ).toArray();
        const breakdowns = this.ctx.storage.sql.exec<{ event: string; dimension: string; events: number; visitors: number }>(
          `SELECT event, dimension, SUM(count) AS events, COUNT(DISTINCT visitor_hash) AS visitors
           FROM analytics_events WHERE day >= ? AND dimension != '{}' GROUP BY event, dimension ORDER BY event, events DESC`, since,
        ).toArray().map(row => ({ ...row, properties: JSON.parse(row.dimension), dimension: undefined }));
        const generationFrequency = this.ctx.storage.sql.exec<{ bucket: string; visitors: number }>(
          `SELECT CASE WHEN generations = 1 THEN '1' WHEN generations BETWEEN 2 AND 3 THEN '2-3' ELSE '4+' END AS bucket,
                  COUNT(*) AS visitors
           FROM (
             SELECT visitor_hash, SUM(count) AS generations
             FROM analytics_events WHERE day >= ? AND event = 'generate_success'
             GROUP BY visitor_hash
           ) GROUP BY bucket ORDER BY MIN(generations)`, since,
        ).toArray();
        const recoveryV2Since = this.ctx.storage.sql.exec<{ first_seen: number | null }>(
          `SELECT MIN(first_seen) AS first_seen FROM analytics_events
           WHERE event IN ('refunded_retry_cta_view','uncertain_recheck_click','verified_landing_view','quick_start_eligible','quick_start_rendered')`,
        ).one().first_seen;
        const generationOutcomes = this.ctx.storage.sql.exec<{ outcome: string; failure_reason: string | null; credit_action: string; attempts: number }>(
          `SELECT outcome, failure_reason, credit_action, COUNT(*) AS attempts
           FROM generation_intents WHERE write_ahead_at >= ?
           GROUP BY outcome, failure_reason, credit_action ORDER BY attempts DESC`, now - days * 86400000,
        ).toArray();
        const generationReliability = this.ctx.storage.sql.exec<{ matured: number; completed: number; failed: number; unresolved: number; safety: number }>(
          `SELECT COUNT(*) AS matured,
             COALESCE(SUM(CASE WHEN outcome = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
             COALESCE(SUM(CASE WHEN outcome IN ('provider_failed_refunded','no_image_refunded') THEN 1 ELSE 0 END), 0) AS failed,
             COALESCE(SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END), 0) AS unresolved,
             COALESCE(SUM(CASE WHEN outcome = 'safety_refunded' THEN 1 ELSE 0 END), 0) AS safety
           FROM generation_intents
           WHERE measurement_version = 'reliability_v1' AND write_ahead_at >= ? AND write_ahead_at <= ?`,
          now - days * 86400000, now - 30 * 60000,
        ).one();
        const dailySnapshots = this.ctx.storage.sql.exec<{ day: string; generated_at: number; payload: string }>(
          'SELECT day, generated_at, payload FROM daily_funnel_snapshots WHERE day >= ? ORDER BY day DESC', since,
        ).toArray().map(row => ({ day: row.day, generatedAt: new Date(row.generated_at).toISOString(), ...JSON.parse(row.payload) }));
        const gscDaily = this.ctx.storage.sql.exec<{ day: string; clicks: number; impressions: number; ctr: number; position: number }>(
          `SELECT day, clicks, impressions, ctr, position
           FROM gsc_daily_totals WHERE day >= ? ORDER BY day DESC`, since,
        ).toArray();
        const gscTopQueries = this.ctx.storage.sql.exec<{ query: string; clicks: number; impressions: number; position: number }>(
          `SELECT query, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
                  CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
           FROM gsc_search_rows WHERE day >= ? GROUP BY query ORDER BY clicks DESC, impressions DESC LIMIT 20`, since,
        ).toArray();
        const syncRow = this.ctx.storage.sql.exec<{
          last_attempt_at: number | null; last_success_at: number | null; status: string;
          rows_written: number; totals_written: number; inspected_urls: number;
          inspection_errors: number; sitemaps_checked: number; last_error: string | null;
        }>('SELECT last_attempt_at, last_success_at, status, rows_written, totals_written, inspected_urls, inspection_errors, sitemaps_checked, last_error FROM gsc_sync_status WHERE id = 1').toArray()[0];
        const gscSync = syncRow ? {
          lastAttemptAt: syncRow.last_attempt_at ? new Date(syncRow.last_attempt_at).toISOString() : null,
          lastSuccessAt: syncRow.last_success_at ? new Date(syncRow.last_success_at).toISOString() : null,
          status: syncRow.status, rowsWritten: syncRow.rows_written, totalsWritten: syncRow.totals_written,
          inspectedUrls: syncRow.inspected_urls, inspectionErrors: syncRow.inspection_errors,
          sitemapsChecked: syncRow.sitemaps_checked, lastError: syncRow.last_error,
        } : { lastAttemptAt: null, lastSuccessAt: null, status: 'never', rowsWritten: 0, totalsWritten: 0, inspectedUrls: 0, inspectionErrors: 0, sitemapsChecked: 0, lastError: null };
        const gscInspections = this.ctx.storage.sql.exec<{ url: string; inspected_at: number; payload: string }>(
          'SELECT url, inspected_at, payload FROM gsc_url_inspections ORDER BY url',
        ).toArray().map(row => ({ url: row.url, inspectedAt: new Date(row.inspected_at).toISOString(), ...JSON.parse(row.payload) }));
        const gscSitemaps = this.ctx.storage.sql.exec<{ path: string; checked_at: number; payload: string }>(
          'SELECT path, checked_at, payload FROM gsc_sitemaps ORDER BY path',
        ).toArray().map(row => ({ path: row.path, checkedAt: new Date(row.checked_at).toISOString(), ...JSON.parse(row.payload) }));
        const editingInterest = this.ctx.storage.sql.exec<{
          submissions: number; emails: number; style_change: number; selective_repaint: number;
          text_replacement: number; composition_change: number; other_choice: number;
        }>(`SELECT COUNT(*) AS submissions, COUNT(email_hash) AS emails, SUM(style_change) AS style_change,
                   SUM(selective_repaint) AS selective_repaint, SUM(text_replacement) AS text_replacement,
                   SUM(composition_change) AS composition_change, SUM(other_choice) AS other_choice
            FROM editing_interest WHERE updated >= ?`, now - days * 86400000).one();
        return {
          days, since, generatedAt: new Date(now).toISOString(), totals, daily, breakdowns,
          generationFrequency, generationOutcomes, generationReliability,
          recoveryV2Since: recoveryV2Since ? new Date(recoveryV2Since).toISOString() : null,
          dailySnapshots, gscDaily, gscTopQueries, gscSync,
          gscLastSync: gscSync.lastSuccessAt, gscInspections, gscSitemaps, editingInterest,
        };
      }

      if (path === '/analytics/snapshot') {
        const day = String(input.day || '');
        const generatedAt = Number(input.generatedAt || now);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(generatedAt)) throw new Error('Invalid snapshot');
        const metrics = this.ctx.storage.sql.exec<{ event: string; events: number; visitors: number }>(
          `SELECT event, SUM(count) AS events, COUNT(DISTINCT visitor_hash) AS visitors
           FROM analytics_events WHERE day = ? GROUP BY event ORDER BY event`, day,
        ).toArray();
        const sources = this.ctx.storage.sql.exec<{ dimension: string; events: number; visitors: number }>(
          `SELECT dimension, SUM(count) AS events, COUNT(DISTINCT visitor_hash) AS visitors
           FROM analytics_events WHERE day = ? AND event = 'generate_success' GROUP BY dimension ORDER BY events DESC`, day,
        ).toArray().map(row => ({ ...row, properties: JSON.parse(row.dimension), dimension: undefined }));
        const payload = JSON.stringify({ metrics, generationSources: sources });
        this.ctx.storage.sql.exec(
          `INSERT INTO daily_funnel_snapshots(day, generated_at, payload) VALUES (?, ?, ?)
           ON CONFLICT(day) DO UPDATE SET generated_at = excluded.generated_at, payload = excluded.payload`,
          day, generatedAt, payload,
        );
        return { ok: true, day };
      }

      if (path === '/gsc/replace') {
        const startDate = String(input.startDate || '');
        const endDate = String(input.endDate || '');
        const fetchedAt = Number(input.fetchedAt || now);
        const rows = Array.isArray(input.rows) ? input.rows as Array<Record<string, unknown>> : [];
        const totals = Array.isArray(input.totals) ? input.totals as Array<Record<string, unknown>> : [];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || rows.length > 25000 || totals.length > 31) throw new Error('Invalid GSC sync');
        this.ctx.storage.sql.exec('DELETE FROM gsc_search_rows WHERE day BETWEEN ? AND ?', startDate, endDate);
        this.ctx.storage.sql.exec('DELETE FROM gsc_daily_totals WHERE day BETWEEN ? AND ?', startDate, endDate);
        let insertedRows = 0;
        for (const row of rows) {
          const day = String(row.day || '');
          const query = String(row.query || '').slice(0, 1000);
          const page = String(row.page || '').slice(0, 2048);
          const clicks = Number(row.clicks || 0), impressions = Number(row.impressions || 0);
          const ctr = Number(row.ctr || 0), position = Number(row.position || 0);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < startDate || day > endDate || !page || ![clicks, impressions, ctr, position].every(Number.isFinite)) continue;
          this.ctx.storage.sql.exec(
            `INSERT INTO gsc_search_rows(day, query, page, clicks, impressions, ctr, position, fetched_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            day, query, page, clicks, impressions, ctr, position, fetchedAt,
          );
          insertedRows++;
        }
        let insertedTotals = 0;
        for (const row of totals) {
          const day = String(row.day || '');
          const clicks = Number(row.clicks || 0), impressions = Number(row.impressions || 0);
          const ctr = Number(row.ctr || 0), position = Number(row.position || 0);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < startDate || day > endDate || ![clicks, impressions, ctr, position].every(Number.isFinite)) continue;
          this.ctx.storage.sql.exec(
            'INSERT INTO gsc_daily_totals(day, clicks, impressions, ctr, position, fetched_at) VALUES (?, ?, ?, ?, ?, ?)',
            day, clicks, impressions, ctr, position, fetchedAt,
          );
          insertedTotals++;
        }
        return { ok: true, rows: insertedRows, totals: insertedTotals };
      }

      if (path === '/gsc/sync-status') {
        const status = String(input.status || '');
        const timestamp = Number(input.timestamp || now);
        if (!['running', 'success', 'success_with_warnings', 'failed', 'skipped'].includes(status) || !Number.isFinite(timestamp)) throw new Error('Invalid GSC status');
        const error = typeof input.error === 'string' ? input.error.slice(0, 500) : null;
        this.ctx.storage.sql.exec(
          `INSERT INTO gsc_sync_status(id, last_attempt_at, last_success_at, status, rows_written, totals_written, inspected_urls, inspection_errors, sitemaps_checked, last_error)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             last_attempt_at = CASE WHEN excluded.status = 'running' THEN excluded.last_attempt_at ELSE gsc_sync_status.last_attempt_at END,
             last_success_at = CASE WHEN excluded.status IN ('success','success_with_warnings') THEN excluded.last_success_at ELSE gsc_sync_status.last_success_at END,
             status = excluded.status, rows_written = excluded.rows_written, totals_written = excluded.totals_written,
             inspected_urls = excluded.inspected_urls, inspection_errors = excluded.inspection_errors,
             sitemaps_checked = excluded.sitemaps_checked, last_error = excluded.last_error`,
          timestamp,
          status === 'success' || status === 'success_with_warnings' ? timestamp : null,
          status, Number(input.rowsWritten || 0), Number(input.totalsWritten || 0),
          Number(input.inspectedUrls || 0), Number(input.inspectionErrors || 0),
          Number(input.sitemapsChecked || 0), error,
        );
        return { ok: true };
      }

      if (path === '/gsc/inspections/replace') {
        const inspectedAt = Number(input.inspectedAt || now);
        const rows = Array.isArray(input.rows) ? input.rows as Array<Record<string, unknown>> : [];
        if (!Number.isFinite(inspectedAt) || rows.length > 500) throw new Error('Invalid URL inspections');
        let written = 0;
        for (const row of rows) {
          const url = String(row.url || '').slice(0, 2048);
          if (!url.startsWith(this.env.APP_ORIGIN + '/')) continue;
          const payload = JSON.stringify(row.payload || {});
          if (payload.length > 16000) continue;
          this.ctx.storage.sql.exec(
            `INSERT INTO gsc_url_inspections(url, inspected_at, payload) VALUES (?, ?, ?)
             ON CONFLICT(url) DO UPDATE SET inspected_at = excluded.inspected_at, payload = excluded.payload`,
            url, inspectedAt, payload,
          );
          written++;
        }
        return { ok: true, rows: written };
      }

      if (path === '/gsc/sitemaps/replace') {
        const checkedAt = Number(input.checkedAt || now);
        const rows = Array.isArray(input.rows) ? input.rows as Array<Record<string, unknown>> : [];
        if (!Number.isFinite(checkedAt) || rows.length > 100) throw new Error('Invalid sitemap status');
        this.ctx.storage.sql.exec('DELETE FROM gsc_sitemaps');
        let written = 0;
        for (const row of rows) {
          const sitemapPath = String(row.path || '').slice(0, 2048);
          if (!sitemapPath.startsWith(this.env.APP_ORIGIN + '/')) continue;
          const payload = JSON.stringify(row.payload || {});
          if (payload.length > 16000) continue;
          this.ctx.storage.sql.exec('INSERT INTO gsc_sitemaps(path, checked_at, payload) VALUES (?, ?, ?)', sitemapPath, checkedAt, payload);
          written++;
        }
        return { ok: true, rows: written };
      }

      if (path === '/auth/request') {
        const email = String(input.email || '');
        const codeHash = String(input.codeHash || '');
        const owner = String(input.owner || '');
        if (!email || email.length > 320 || !/^[a-f0-9]{64}$/.test(codeHash) || !/^[a-f0-9]{64}$/.test(owner)) throw new Error('Invalid login request');
        if (this.read(`auth-email:${email}`, now) || this.read(`auth-owner:${owner}`, now)) return { accepted: false, retryAfter: 60 };
        this.ctx.storage.sql.exec(
          `INSERT INTO auth_codes(email, code_hash, expires, attempts) VALUES (?, ?, ?, 0)
           ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires = excluded.expires, attempts = 0`,
          email, codeHash, now + 10 * 60 * 1000,
        );
        this.write(`auth-email:${email}`, true, now + 60000);
        this.write(`auth-owner:${owner}`, true, now + 60000);
        return { accepted: true };
      }

      if (path === '/auth/verify') {
        const email = String(input.email || '');
        const codeHash = String(input.codeHash || '');
        const userId = String(input.userId || '');
        const sessionHash = String(input.sessionHash || '');
        const row = this.ctx.storage.sql.exec<{ code_hash: string; expires: number; attempts: number }>(
          'SELECT code_hash, expires, attempts FROM auth_codes WHERE email = ?', email,
        ).toArray()[0];
        if (!row || row.expires <= now || row.attempts >= 5 || row.code_hash !== codeHash) {
          if (row) this.ctx.storage.sql.exec('UPDATE auth_codes SET attempts = attempts + 1 WHERE email = ?', email);
          return { verified: false };
        }
        if (!/^[a-f0-9]{64}$/.test(userId) || !/^[a-f0-9]{64}$/.test(sessionHash)) throw new Error('Invalid session');
        this.ctx.storage.sql.exec('DELETE FROM auth_codes WHERE email = ?', email);
        const starterCredits = this.ctx.storage.sql.exec<{ count: number }>(
          'SELECT COUNT(*) AS count FROM deleted_identities WHERE email_hash = ?', userId,
        ).one().count ? 0 : 3;
        const existing = this.ctx.storage.sql.exec<{ id: string }>('SELECT id FROM users WHERE email = ?', email).toArray()[0];
        this.ctx.storage.sql.exec(
          `INSERT INTO users(id, email, created, starter_credits) VALUES (?, ?, ?, ?)
           ON CONFLICT(email) DO NOTHING`, userId, email, now,
          starterCredits,
        );
        const actual = this.ctx.storage.sql.exec<UserRow>('SELECT * FROM users WHERE email = ?', email).one();
        this.ctx.storage.sql.exec(
          'INSERT OR REPLACE INTO sessions(token_hash, user_id, expires) VALUES (?, ?, ?)',
          sessionHash, actual.id, now + 30 * 86400000,
        );
        return { verified: true, account: this.account(actual), starterGranted: !existing && starterCredits > 0 };
      }

      if (path === '/session') {
        const sessionHash = String(input.sessionHash || '');
        const session = this.ctx.storage.sql.exec<{ user_id: string }>(
          'SELECT user_id FROM sessions WHERE token_hash = ? AND expires > ?', sessionHash, now,
        ).toArray()[0];
        if (!session) return { account: null };
        const user = this.user(session.user_id);
        return { account: user ? this.account(user) : null };
      }

      if (path === '/logout') {
        this.ctx.storage.sql.exec('DELETE FROM sessions WHERE token_hash = ?', String(input.sessionHash || ''));
        return { ok: true };
      }

      if (path === '/reserve') {
        const owner = String(input.owner || '');
        const userId = typeof input.userId === 'string' ? input.userId : undefined;
        const reservationId = String(input.reservationId || crypto.randomUUID().replaceAll('-', ''));
        const intentId = String(input.intentId || crypto.randomUUID());
        const pixels = Number(input.pixels);
        const cap = Number(this.env.DAILY_PIXEL_LIMIT);
        if (!/^[a-f0-9]{64}$/.test(owner) || !/^[0-9a-f-]{36}$/.test(intentId) || !/^[a-f0-9]{32}$/.test(reservationId) || !Number.isSafeInteger(pixels) || pixels < 1 || pixels > 1048576 || !Number.isSafeInteger(cap) || cap < 1) throw new Error('Invalid reservation');
        const day = new Date(now).toISOString().slice(0, 10);
        const dayStart = Date.parse(`${day}T00:00:00Z`);
        const midnight = Date.parse(`${day}T00:00:00Z`) + 86400000;
        const existingIntent = this.ctx.storage.sql.exec<{ owner_hash: string; user_id: string | null; provider_request_id: string | null; outcome: string }>(
          'SELECT owner_hash, user_id, provider_request_id, outcome FROM generation_intents WHERE intent_id = ?', intentId,
        ).toArray()[0];
        if (existingIntent) {
          if (existingIntent.owner_hash !== owner || (existingIntent.user_id || undefined) !== userId) throw new Error('Invalid generation intent owner');
          return { allowed: false, code: 'duplicate_intent', providerRequestId: existingIntent.provider_request_id, outcome: existingIntent.outcome };
        }
        const total = this.read<number>(`pixels:${day}`, now) ?? 0;
        if (total + pixels > cap) return { allowed: false, code: 'budget' };

        if (!userId) {
          const previewLimit = this.env.AUTH_ENABLED === 'true' ? 1 : 3;
          const used = this.read<number>(`quota:${day}:${owner}`, now) ?? 0;
          if (used >= previewLimit) return { allowed: false, code: this.env.AUTH_ENABLED === 'true' ? 'preview_limit' : 'free_limit' };
          if (this.read(`cooldown:${owner}`, now)) return { allowed: false, code: 'cooldown' };
          const attempts = this.ctx.storage.sql.exec<{ count: number }>(
            'SELECT COUNT(*) AS count FROM generation_intents WHERE owner_hash = ? AND user_id IS NULL AND write_ahead_at >= ?', owner, dayStart,
          ).one().count;
          if (attempts >= 3) return { allowed: false, code: 'attempts' };
          this.write(`quota:${day}:${owner}`, used + 1, midnight);
          this.write(`pixels:${day}`, total + pixels, midnight);
          this.write(`cooldown:${owner}`, true, now + 30000);
          if (this.env.AUTH_ENABLED === 'true') this.write(`preview-reservation:${reservationId}`, { owner, day, pixels }, midnight);
          this.ctx.storage.sql.exec(
            `INSERT INTO generation_intents(intent_id, reservation_id, owner_hash, attempt_number, pixels, write_ahead_at, measurement_version)
             VALUES (?, ?, ?, ?, ?, ?, 'reliability_v1')`, intentId, reservationId, owner, attempts + 1, pixels, now,
          );
          return { allowed: true, remaining: previewLimit - used - 1, mode: this.env.AUTH_ENABLED === 'true' ? 'preview' : 'legacy' };
        }

        const user = this.user(userId);
        if (!/^[a-f0-9]{32}$/.test(reservationId)) throw new Error('Invalid reservation ID');
        if (!user || user.frozen) return { allowed: false, code: user?.frozen ? 'frozen' : 'auth' };
        if (this.read(`cooldown-user:${userId}`, now)) return { allowed: false, code: 'cooldown' };
        let bucket: 'subscription' | 'starter' | 'pack' | undefined;
        if (user.subscription_credits > 0 && (!user.subscription_expires || user.subscription_expires > now)) bucket = 'subscription';
        else if (user.starter_credits > 0) bucket = 'starter';
        else if (user.pack_credits > 0) bucket = 'pack';
        if (!bucket) return { allowed: false, code: 'credits' };
        const column = `${bucket}_credits`;
        this.ctx.storage.sql.exec(`UPDATE users SET ${column} = ${column} - 1 WHERE id = ?`, userId);
        this.ctx.storage.sql.exec(
          'INSERT INTO jobs(reservation_id, user_id, bucket, pixels, created) VALUES (?, ?, ?, ?, ?)',
          reservationId, userId, bucket, pixels, now,
        );
        this.addLedger(userId, `reserve:${reservationId}`, 'generation_reserved', bucket, -1, now);
        this.write(`pixels:${day}`, total + pixels, midnight);
        this.write(`cooldown-user:${userId}`, true, now + 30000);
        const attempts = this.ctx.storage.sql.exec<{ count: number }>(
          'SELECT COUNT(*) AS count FROM generation_intents WHERE owner_hash = ? AND write_ahead_at >= ?', owner, dayStart,
        ).one().count;
        this.ctx.storage.sql.exec(
          `INSERT INTO generation_intents(intent_id, reservation_id, owner_hash, user_id, attempt_number, pixels, write_ahead_at, measurement_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'reliability_v1')`, intentId, reservationId, owner, userId, attempts + 1, pixels, now,
        );
        return { allowed: true, mode: 'account', account: this.account(this.user(userId)!) };
      }

      if (path === '/submission/link') {
        const intentId = String(input.intentId || '');
        const requestId = String(input.requestId || '');
        if (!/^[0-9a-f-]{36}$/.test(intentId) || !requestId || requestId.length > 256) throw new Error('Invalid generation intent');
        this.ctx.storage.sql.exec(
          `UPDATE generation_intents SET provider_request_id = ?, provider_accepted_at = ?, outcome = 'provider_accepted'
           WHERE intent_id = ?`, requestId, now, intentId,
        );
        const reservationId = String(input.reservationId || '');
        const prompt = String(input.prompt || '');
        const mode = String(input.mode || '');
        const size = String(input.size || '');
        const promptLengthBucket = prompt.length < 250 ? 'short' : prompt.length < 1000 ? 'medium' : 'long';
        this.ctx.storage.sql.exec(
          `UPDATE generation_intents SET mode = ?, size = ?, prompt_length_bucket = ?, measurement_version = 'reliability_v1'
           WHERE intent_id = ?`, mode, size, promptLengthBucket, intentId,
        );
        const preview = input.preview === true;
        if (preview) {
          const reservation = this.read<{ owner: string; day: string; pixels: number }>(`preview-reservation:${reservationId}`, now);
          if (!reservation) throw new Error('Invalid preview job');
          const expires = Date.parse(`${reservation.day}T00:00:00Z`) + 86400000;
          this.write(`preview-request:${requestId}`, reservationId, expires);
        } else {
          this.ctx.storage.sql.exec('UPDATE jobs SET request_id = ? WHERE reservation_id = ?', requestId, reservationId);
          const job = this.ctx.storage.sql.exec<{ user_id: string }>('SELECT user_id FROM jobs WHERE reservation_id = ?', reservationId).toArray()[0];
          if (job && prompt.length >= 3 && prompt.length <= 6000 && (mode === 'text' || mode === 'layout') && ['square', 'portrait', 'landscape'].includes(size)) {
            this.ctx.storage.sql.exec(
              `INSERT OR REPLACE INTO generations(request_id, user_id, prompt, mode, size, requested_seed, status, created)
               VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`, requestId, job.user_id, prompt, mode, size,
              Number.isSafeInteger(input.seed) ? Number(input.seed) : null, now,
            );
          }
        }
        return { ok: true };
      }

      if (path === '/intent/uncertain') {
        const intentId = typeof input.intentId === 'string' ? input.intentId : undefined;
        const requestId = typeof input.requestId === 'string' ? input.requestId : undefined;
        const reason = String(input.reason || 'submit_uncertain').slice(0, 64);
        this.ctx.storage.sql.exec(
          `UPDATE generation_intents SET outcome = ?, failure_reason = ?, first_uncertain_at = COALESCE(first_uncertain_at, ?),
             last_polled_at = ?, poll_attempts = poll_attempts + 1, poll_error_count = poll_error_count + 1
           WHERE ${requestId ? 'provider_request_id = ?' : 'intent_id = ?'} AND resolved_at IS NULL`,
          reason, reason, now, now, requestId || intentId || '',
        );
        return { ok: true };
      }

      if (path === '/intent/polled') {
        const requestId = String(input.requestId || '');
        const providerStatus = String(input.providerStatus || '').slice(0, 64);
        this.ctx.storage.sql.exec(
          `UPDATE generation_intents SET last_polled_at = ?, poll_attempts = poll_attempts + 1,
             last_provider_status = ? WHERE provider_request_id = ? AND resolved_at IS NULL`,
          now, providerStatus, requestId,
        );
        return { ok: true };
      }

      if (path === '/intent/reconcile-list') {
        return { intents: this.ctx.storage.sql.exec<{ provider_request_id: string; user_id: string | null; write_ahead_at: number }>(
          `SELECT provider_request_id, user_id, write_ahead_at FROM generation_intents
           WHERE resolved_at IS NULL AND provider_request_id IS NOT NULL
             AND outcome IN ('provider_accepted','poll_uncertain','link_uncertain')
             AND write_ahead_at <= ? AND (last_polled_at IS NULL OR last_polled_at <= ?)
           ORDER BY write_ahead_at LIMIT 50`, now - 2 * 60000, now - 5 * 60000,
        ).toArray() };
      }

      if (path === '/intent/resolve') {
        const requestId = typeof input.requestId === 'string' ? input.requestId : undefined;
        const intentId = typeof input.intentId === 'string' ? input.intentId : undefined;
        const outcome = String(input.outcome || '').slice(0, 64);
        const reason = typeof input.reason === 'string' ? input.reason.slice(0, 64) : null;
        const creditAction = String(input.creditAction || 'consumed').slice(0, 32);
        this.ctx.storage.sql.exec(
          `UPDATE generation_intents SET outcome = ?, failure_reason = ?, credit_action = ?, resolved_at = ?, resolution_source = ?
           WHERE ${requestId ? 'provider_request_id = ?' : 'intent_id = ?'}`,
          outcome, reason, creditAction, now, String(input.resolutionSource || 'foreground').slice(0, 32), requestId || intentId || '',
        );
        return { ok: true };
      }

      if (path === '/intent/get') {
        const intentId = String(input.intentId || '');
        const owner = String(input.owner || '');
        const userId = typeof input.userId === 'string' ? input.userId : undefined;
        const row = this.ctx.storage.sql.exec<{
          provider_request_id: string | null; outcome: string; failure_reason: string | null;
          credit_action: string; write_ahead_at: number; attempt_number: number;
        }>(
          `SELECT provider_request_id, outcome, failure_reason, credit_action, write_ahead_at, attempt_number
           FROM generation_intents WHERE intent_id = ? AND (owner_hash = ? OR user_id = ?)`, intentId, owner, userId || '',
        ).toArray()[0];
        return { intent: row || null };
      }

      if (path === '/preview/link') {
        const reservationId = String(input.reservationId || '');
        const requestId = String(input.requestId || '');
        const reservation = this.read<{ owner: string; day: string; pixels: number }>(`preview-reservation:${reservationId}`, now);
        if (!reservation || !requestId || requestId.length > 256) throw new Error('Invalid preview job');
        const expires = Date.parse(`${reservation.day}T00:00:00Z`) + 86400000;
        this.write(`preview-request:${requestId}`, reservationId, expires);
        return { ok: true };
      }

      if (path === '/preview/refund') {
        const requestId = typeof input.requestId === 'string' ? input.requestId : undefined;
        const mapped = requestId ? this.read<string>(`preview-request:${requestId}`, now) : undefined;
        const reservationId = mapped || String(input.reservationId || '');
        const key = `preview-reservation:${reservationId}`;
        const reservation = this.read<{ owner: string; day: string; pixels: number }>(key, now);
        if (!reservation) return { refunded: false };
        const quotaKey = `quota:${reservation.day}:${reservation.owner}`;
        const pixelKey = `pixels:${reservation.day}`;
        const used = this.read<number>(quotaKey, now) ?? 0;
        const pixels = this.read<number>(pixelKey, now) ?? 0;
        const expires = Date.parse(`${reservation.day}T00:00:00Z`) + 86400000;
        this.write(quotaKey, Math.max(0, used - 1), expires);
        this.write(pixelKey, Math.max(0, pixels - reservation.pixels), expires);
        this.ctx.storage.sql.exec('DELETE FROM entries WHERE key = ?', key);
        this.ctx.storage.sql.exec('DELETE FROM entries WHERE key = ?', `cooldown:${reservation.owner}`);
        if (requestId) this.ctx.storage.sql.exec('DELETE FROM entries WHERE key = ?', `preview-request:${requestId}`);
        return { refunded: true };
      }

      if (path === '/job/link') {
        const reservationId = String(input.reservationId || '');
        const requestId = String(input.requestId || '');
        if (!requestId || requestId.length > 256) throw new Error('Invalid job ID');
        this.ctx.storage.sql.exec('UPDATE jobs SET request_id = ? WHERE reservation_id = ?', requestId, reservationId);
        const job = this.ctx.storage.sql.exec<{ user_id: string }>('SELECT user_id FROM jobs WHERE reservation_id = ?', reservationId).toArray()[0];
        const prompt = String(input.prompt || '');
        const mode = String(input.mode || '');
        const size = String(input.size || '');
        const promptLengthBucket = prompt.length < 250 ? 'short' : prompt.length < 1000 ? 'medium' : 'long';
        this.ctx.storage.sql.exec(
          `UPDATE generation_intents SET mode = ?, size = ?, prompt_length_bucket = ?, measurement_version = 'reliability_v1'
           WHERE reservation_id = ?`, mode, size, promptLengthBucket, reservationId,
        );
        if (job && prompt.length >= 3 && prompt.length <= 6000 && (mode === 'text' || mode === 'layout') && ['square', 'portrait', 'landscape'].includes(size)) {
          this.ctx.storage.sql.exec(
            `INSERT OR REPLACE INTO generations(request_id, user_id, prompt, mode, size, requested_seed, status, created)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            requestId, job.user_id, prompt, mode, size,
            Number.isSafeInteger(input.seed) ? Number(input.seed) : null, now,
          );
        }
        return { ok: true };
      }

      if (path === '/job/complete') {
        this.ctx.storage.sql.exec('UPDATE jobs SET resolved = 1 WHERE request_id = ?', String(input.requestId || ''));
        return { ok: true };
      }

      if (path === '/job/refund') {
        const requestId = typeof input.requestId === 'string' ? input.requestId : undefined;
        const reservationId = typeof input.reservationId === 'string' ? input.reservationId : undefined;
        const job = this.ctx.storage.sql.exec<{ reservation_id: string; user_id: string; bucket: string; resolved: number }>(
          requestId ? 'SELECT reservation_id, user_id, bucket, resolved FROM jobs WHERE request_id = ?' : 'SELECT reservation_id, user_id, bucket, resolved FROM jobs WHERE reservation_id = ?',
          requestId || reservationId || '',
        ).toArray()[0];
        if (!job || job.resolved) return { refunded: false };
        this.ctx.storage.sql.exec(`UPDATE users SET ${job.bucket}_credits = ${job.bucket}_credits + 1 WHERE id = ?`, job.user_id);
        this.ctx.storage.sql.exec('UPDATE jobs SET resolved = 1 WHERE reservation_id = ?', job.reservation_id);
        this.addLedger(job.user_id, `refund:${job.reservation_id}`, 'generation_refunded', job.bucket, 1, now);
        if (requestId) this.ctx.storage.sql.exec("UPDATE generations SET status = 'failed', completed = ? WHERE request_id = ?", now, requestId);
        return { refunded: true };
      }

      if (path === '/generation/complete') {
        const requestId = String(input.requestId || '');
        const imageKey = typeof input.imageKey === 'string' ? input.imageKey : null;
        this.ctx.storage.sql.exec(
          `UPDATE generations SET status = 'completed', result_seed = ?, image_key = ?, completed = ? WHERE request_id = ?`,
          Number.isSafeInteger(input.seed) ? Number(input.seed) : null, imageKey, now, requestId,
        );
        return { ok: true };
      }

      if (path === '/account/dashboard') {
        const userId = String(input.userId || '');
        const user = this.user(userId);
        if (!user) return { account: null, generations: [], ledger: [], billing: null };
        const generations = this.ctx.storage.sql.exec<{
          request_id: string; prompt: string; mode: string; size: string; requested_seed: number | null;
          result_seed: number | null; image_key: string | null; status: string; created: number; completed: number | null;
        }>(`SELECT request_id, prompt, mode, size, requested_seed, result_seed, image_key, status, created, completed
            FROM generations WHERE user_id = ? ORDER BY created DESC LIMIT 60`, userId).toArray();
        const ledger = this.ctx.storage.sql.exec<{ id: number; kind: string; bucket: string; delta: number; created: number }>(
          'SELECT id, kind, bucket, delta, created FROM ledger WHERE user_id = ? ORDER BY created DESC LIMIT 80', userId,
        ).toArray();
        const subscription = this.ctx.storage.sql.exec<{ plan: string; status: string; period_end: number | null }>(
          'SELECT plan, status, period_end FROM subscriptions WHERE user_id = ? ORDER BY period_end DESC LIMIT 1', userId,
        ).toArray()[0] || null;
        const lastPayment = this.ctx.storage.sql.exec<{ plan: string; status: string; created: number }>(
          'SELECT plan, status, created FROM payments WHERE user_id = ? ORDER BY created DESC LIMIT 1', userId,
        ).toArray()[0] || null;
        const cycleStart = this.ctx.storage.sql.exec<{ started: number | null }>(
          `SELECT MAX(created) AS started FROM ledger
           WHERE user_id = ? AND kind IN ('subscription_start', 'subscription_renew')`, userId,
        ).one().started;
        const usedThisCycle = cycleStart ? this.ctx.storage.sql.exec<{ used: number }>(
          `SELECT COALESCE(SUM(-delta), 0) AS used FROM ledger
           WHERE user_id = ? AND kind = 'generation_reserved' AND bucket = 'subscription' AND created >= ?`, userId, cycleStart,
        ).one().used : 0;
        return { account: this.account(user), generations, ledger, billing: { subscription, lastPayment, usage: { usedThisCycle, cycleStart } } };
      }

      if (path === '/account/export') {
        const userId = String(input.userId || '');
        const user = this.user(userId);
        if (!user) return { account: null, generations: [], ledger: [], billing: null, pendingJobs: 0 };
        const generations = this.ctx.storage.sql.exec<{
          request_id: string; prompt: string; mode: string; size: string; requested_seed: number | null;
          result_seed: number | null; image_key: string | null; status: string; created: number; completed: number | null;
        }>(`SELECT request_id, prompt, mode, size, requested_seed, result_seed, image_key, status, created, completed
            FROM generations WHERE user_id = ? ORDER BY created DESC`, userId).toArray();
        const ledger = this.ctx.storage.sql.exec<{ id: number; kind: string; bucket: string; delta: number; created: number }>(
          'SELECT id, kind, bucket, delta, created FROM ledger WHERE user_id = ? ORDER BY created DESC', userId,
        ).toArray();
        const subscription = this.ctx.storage.sql.exec<{ plan: string; status: string; period_end: number | null }>(
          'SELECT plan, status, period_end FROM subscriptions WHERE user_id = ? ORDER BY period_end DESC LIMIT 1', userId,
        ).toArray()[0] || null;
        const payments = this.ctx.storage.sql.exec<{ plan: string; status: string; created: number }>(
          'SELECT plan, status, created FROM payments WHERE user_id = ? ORDER BY created DESC', userId,
        ).toArray();
        const pendingJobs = this.ctx.storage.sql.exec<{ count: number }>(
          'SELECT COUNT(*) AS count FROM jobs WHERE user_id = ? AND resolved = 0', userId,
        ).one().count;
        return { account: this.account(user), generations, ledger, billing: { subscription, payments }, pendingJobs };
      }

      if (path === '/account/delete') {
        const userId = String(input.userId || '');
        const user = this.user(userId);
        if (!user) return { deleted: false, reason: 'missing' };
        const activeSubscription = this.ctx.storage.sql.exec<{ count: number }>(
          `SELECT COUNT(*) AS count FROM subscriptions
           WHERE user_id = ? AND status IN ('active', 'trialing', 'past_due', 'unpaid')`, userId,
        ).one().count;
        const pendingJobs = this.ctx.storage.sql.exec<{ count: number }>(
          'SELECT COUNT(*) AS count FROM jobs WHERE user_id = ? AND resolved = 0', userId,
        ).one().count;
        if (activeSubscription && input.stripeCustomerDeleted !== true) return { deleted: false, reason: 'active_subscription' };
        if (pendingJobs) return { deleted: false, reason: 'pending_generation' };
        this.ctx.storage.sql.exec('INSERT OR IGNORE INTO deleted_identities(email_hash, created) VALUES (?, ?)', userId, now);
        this.ctx.storage.sql.exec('DELETE FROM sessions WHERE user_id = ?', userId);
        this.ctx.storage.sql.exec('DELETE FROM auth_codes WHERE email = ?', user.email);
        this.ctx.storage.sql.exec('DELETE FROM jobs WHERE user_id = ?', userId);
        this.ctx.storage.sql.exec('DELETE FROM generations WHERE user_id = ?', userId);
        this.ctx.storage.sql.exec('DELETE FROM ledger WHERE user_id = ?', userId);
        this.ctx.storage.sql.exec('DELETE FROM payments WHERE user_id = ?', userId);
        this.ctx.storage.sql.exec('DELETE FROM subscriptions WHERE user_id = ?', userId);
        this.ctx.storage.sql.exec('DELETE FROM users WHERE id = ?', userId);
        return { deleted: true };
      }

      if (path === '/generation/get') {
        const generation = this.ctx.storage.sql.exec<{ request_id: string; image_key: string | null }>(
          'SELECT request_id, image_key FROM generations WHERE request_id = ? AND user_id = ?',
          String(input.requestId || ''), String(input.userId || ''),
        ).toArray()[0];
        return { generation: generation || null };
      }

      if (path === '/generation/delete') {
        const requestId = String(input.requestId || '');
        const userId = String(input.userId || '');
        const generation = this.ctx.storage.sql.exec<{ image_key: string | null }>(
          'SELECT image_key FROM generations WHERE request_id = ? AND user_id = ?', requestId, userId,
        ).toArray()[0];
        if (!generation) return { deleted: false, imageKey: null };
        this.ctx.storage.sql.exec('DELETE FROM generations WHERE request_id = ? AND user_id = ?', requestId, userId);
        return { deleted: true, imageKey: generation.image_key };
      }

      if (path === '/billing/event') {
        const eventId = String(input.eventId || '');
        const action = String(input.action || '');
        if (!eventId || eventId.length > 255) throw new Error('Invalid billing event');
        if (this.ctx.storage.sql.exec('SELECT id FROM webhook_events WHERE id = ?', eventId).toArray().length) return { duplicate: true };
        const userId = typeof input.userId === 'string' ? input.userId : undefined;
        const subscriptionId = typeof input.subscriptionId === 'string' ? input.subscriptionId : undefined;
        const paymentId = typeof input.paymentId === 'string' ? input.paymentId : undefined;
        const foundSub = subscriptionId ? this.ctx.storage.sql.exec<{ user_id: string; plan: string }>('SELECT user_id, plan FROM subscriptions WHERE stripe_id = ?', subscriptionId).toArray()[0] : undefined;
        const foundPayment = paymentId ? this.ctx.storage.sql.exec<{ user_id: string; plan: string; subscription_id: string | null }>('SELECT user_id, plan, subscription_id FROM payments WHERE stripe_id = ?', paymentId).toArray()[0] : undefined;
        const targetUser = userId || foundSub?.user_id || foundPayment?.user_id;
        if (!targetUser || !this.user(targetUser)) {
          this.ctx.storage.sql.exec('INSERT INTO webhook_events(id, created) VALUES (?, ?)', eventId, now);
          return { ignored: true };
        }
        if (action === 'pack') {
          if (!paymentId) throw new Error('Missing payment ID');
          this.ctx.storage.sql.exec('UPDATE users SET pack_credits = pack_credits + 30, stripe_customer_id = COALESCE(?, stripe_customer_id) WHERE id = ?', input.customerId || null, targetUser);
          this.ctx.storage.sql.exec(
            `INSERT INTO payments(stripe_id, user_id, plan, subscription_id, status, created) VALUES (?, ?, 'pack', NULL, 'paid', ?)`,
            paymentId, targetUser, now,
          );
          this.addLedger(targetUser, `stripe:${eventId}`, 'credit_pack', 'pack', 30, now);
        } else if (action === 'subscription_start' || action === 'subscription_renew') {
          const plan = String(input.plan || foundSub?.plan || '');
          const amount = plan === 'monthly' ? 80 : plan === 'annual' ? 800 : 0;
          const max = plan === 'monthly' ? 160 : 800;
          if (!amount || !subscriptionId) throw new Error('Invalid subscription grant');
          const current = this.user(targetUser)!;
          const unexpiredCredits = current.subscription_expires && current.subscription_expires > now ? current.subscription_credits : 0;
          const credits = action === 'subscription_renew' && plan === 'monthly'
            ? Math.min(unexpiredCredits + amount, max) : amount;
          this.ctx.storage.sql.exec(
            'UPDATE users SET plan = ?, subscription_credits = ?, subscription_expires = ?, stripe_customer_id = COALESCE(?, stripe_customer_id), frozen = 0 WHERE id = ?',
            plan, credits, Number(input.periodEnd) || null, input.customerId || null, targetUser,
          );
          this.ctx.storage.sql.exec(
            `INSERT INTO subscriptions(stripe_id, user_id, plan, status, period_end) VALUES (?, ?, ?, 'active', ?)
             ON CONFLICT(stripe_id) DO UPDATE SET plan = excluded.plan, status = 'active', period_end = excluded.period_end`,
            subscriptionId, targetUser, plan, Number(input.periodEnd) || null,
          );
          if (paymentId) this.ctx.storage.sql.exec(
            `INSERT INTO payments(stripe_id, user_id, plan, subscription_id, status, created) VALUES (?, ?, ?, ?, 'paid', ?)
             ON CONFLICT(stripe_id) DO UPDATE SET subscription_id = excluded.subscription_id, status = 'paid'`,
            paymentId, targetUser, plan, subscriptionId, now,
          );
          this.addLedger(targetUser, `stripe:${eventId}`, action, 'subscription', amount, now);
        } else if (action === 'subscription_sync') {
          const plan = String(input.plan || foundSub?.plan || '');
          if ((plan !== 'monthly' && plan !== 'annual') || !subscriptionId) throw new Error('Invalid subscription');
          this.ctx.storage.sql.exec(
            `INSERT INTO subscriptions(stripe_id, user_id, plan, status, period_end) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(stripe_id) DO UPDATE SET plan = excluded.plan, status = excluded.status, period_end = excluded.period_end`,
            subscriptionId, targetUser, plan, String(input.status || 'active'), Number(input.periodEnd) || null,
          );
          this.ctx.storage.sql.exec(
            'UPDATE users SET subscription_expires = COALESCE(?, subscription_expires), stripe_customer_id = COALESCE(?, stripe_customer_id) WHERE id = ?',
            Number(input.periodEnd) || null, input.customerId || null, targetUser,
          );
        } else if (action === 'subscription_cancel') {
          if (subscriptionId) this.ctx.storage.sql.exec(`UPDATE subscriptions SET status = 'canceled' WHERE stripe_id = ?`, subscriptionId);
          this.ctx.storage.sql.exec(`UPDATE users SET plan = 'free', subscription_credits = 0, subscription_expires = NULL WHERE id = ?`, targetUser);
        } else if (action === 'refund_purchase') {
          if (!foundPayment) throw new Error('Unknown payment');
          if (foundPayment.plan === 'pack') {
            const current = this.user(targetUser)!;
            const removed = Math.min(current.pack_credits, 30);
            this.ctx.storage.sql.exec('UPDATE users SET pack_credits = pack_credits - ?, frozen = CASE WHEN ? < 30 THEN 1 ELSE frozen END WHERE id = ?', removed, removed, targetUser);
            this.addLedger(targetUser, `stripe:${eventId}`, 'payment_refunded', 'pack', -removed, now);
          } else {
            const current = this.user(targetUser)!;
            this.ctx.storage.sql.exec(`UPDATE users SET plan = 'free', subscription_credits = 0, subscription_expires = NULL WHERE id = ?`, targetUser);
            if (foundPayment.subscription_id) this.ctx.storage.sql.exec(`UPDATE subscriptions SET status = 'refunded' WHERE stripe_id = ?`, foundPayment.subscription_id);
            this.addLedger(targetUser, `stripe:${eventId}`, 'payment_refunded', 'subscription', -current.subscription_credits, now);
          }
          this.ctx.storage.sql.exec(`UPDATE payments SET status = 'refunded' WHERE stripe_id = ?`, paymentId!);
        } else if (action === 'freeze') {
          this.ctx.storage.sql.exec('UPDATE users SET frozen = 1 WHERE id = ?', targetUser);
        } else throw new Error('Unknown billing action');
        this.ctx.storage.sql.exec('INSERT INTO webhook_events(id, created) VALUES (?, ?)', eventId, now);
        return { ok: true, account: this.account(this.user(targetUser)!) };
      }

      if (!input.requestId || String(input.requestId).length > 256) throw new Error('Invalid job ID');
      const requestId = String(input.requestId);
      const key = `result:${requestId}`;
      if (path === '/poll') {
        const cached = this.read(key, now);
        if (cached) return { cached };
        if (this.read(`poll:${requestId}`, now)) return { acquired: false };
        this.write(`poll:${requestId}`, true, now + 15000);
        return { acquired: true };
      }
      if (path === '/release') {
        this.write(`poll:${requestId}`, true, now + 2000);
        return { ok: true };
      }
      if (path === '/result') {
        if (!input.result || JSON.stringify(input.result).length > 16384) throw new Error('Invalid result');
        this.write(key, input.result, now + 3600000);
        return { ok: true };
      }
      throw new Error('Unknown state operation');
    });
    return Response.json(result);
  }

  async alarm() {
    const now = this.now();
    this.ctx.storage.sql.exec('DELETE FROM entries WHERE expires <= ?', now);
    this.ctx.storage.sql.exec('DELETE FROM sessions WHERE expires <= ?', now);
    this.ctx.storage.sql.exec('DELETE FROM auth_codes WHERE expires <= ?', now);
    this.ctx.storage.sql.exec('DELETE FROM analytics_events WHERE day < ?', new Date(now - 90 * 86400000).toISOString().slice(0, 10));
    this.ctx.storage.sql.exec('DELETE FROM generation_intents WHERE write_ahead_at < ?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM daily_funnel_snapshots WHERE day < ?', new Date(now - 365 * 86400000).toISOString().slice(0, 10));
    this.ctx.storage.sql.exec('DELETE FROM gsc_search_rows WHERE day < ?', new Date(now - 365 * 86400000).toISOString().slice(0, 10));
    this.ctx.storage.sql.exec('DELETE FROM gsc_daily_totals WHERE day < ?', new Date(now - 730 * 86400000).toISOString().slice(0, 10));
    const remaining = this.ctx.storage.sql.exec<{ n: number }>('SELECT count(*) AS n FROM entries').one().n;
    if (remaining) await this.ctx.storage.setAlarm(now + 60000);
  }
}

export async function stateCall<T>(env: Env, path: string, body: unknown): Promise<T> {
  const id = env.GENERATION_STATE.idFromName('generation-ledger-v1');
  const response = await env.GENERATION_STATE.get(id).fetch(`https://state.internal${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Generation state unavailable');
  return response.json() as Promise<T>;
}
