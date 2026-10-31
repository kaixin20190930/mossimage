'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Account = {
  email: string; plan: string; starterCredits: number; subscriptionCredits: number;
  packCredits: number; subscriptionExpires: number | null; stripeCustomerId: string | null;
};
type Generation = {
  request_id: string; prompt: string; mode: 'text' | 'layout'; size: string;
  requested_seed: number | null; result_seed: number | null; image_key: string | null;
  status: string; created: number; completed: number | null;
};
type Ledger = { id: number; kind: string; bucket: string; delta: number; created: number };
type Dashboard = {
  account: Account | null; generations: Generation[]; ledger: Ledger[];
  billing: {
    subscription: { plan: string; status: string; period_end: number | null } | null;
    lastPayment: { plan: string; status: string; created: number } | null;
    usage: { usedThisCycle: number; cycleStart: number | null };
  } | null;
};

const labels: Record<string, string> = {
  generation_reserved: 'Image generation', generation_refunded: 'Generation credit restored',
  credit_pack: 'Credit pack purchased', subscription_start: 'Subscription started',
  subscription_renew: 'Subscription renewed', payment_refunded: 'Payment refunded',
};

export function AccountDashboard() {
  const [data, setData] = useState<Dashboard>();
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/account/dashboard/', { credentials: 'same-origin' });
    if (response.status === 401) { setData({ account: null, generations: [], ledger: [], billing: null }); return; }
    if (!response.ok) { setError('Your account could not be loaded. Please try again.'); return; }
    setData(await response.json() as Dashboard);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const credits = useMemo(() => data?.account
    ? data.account.starterCredits + data.account.subscriptionCredits + data.account.packCredits : 0, [data]);

  async function remove(id: string) {
    if (!window.confirm('Delete this image from your history? This cannot be undone.')) return;
    setBusyId(id);
    const response = await fetch('/api/account/generations/delete/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    if (response.ok) setData(current => current ? { ...current, generations: current.generations.filter(item => item.request_id !== id) } : current);
    else setError('The image could not be deleted.');
    setBusyId('');
  }

  async function portal() {
    const response = await fetch('/api/billing/portal/', { method: 'POST' });
    const body = await response.json() as { url?: string; error?: string };
    if (body.url) window.location.assign(body.url);
    else setError(body.error || 'Billing management is unavailable.');
  }

  async function deleteAccount() {
    if (!data?.account) return;
    const confirmation = window.prompt(`This permanently deletes saved images and account data. Any active subscription is canceled immediately without an automatic refund. Enter DELETE ${data.account.email} to continue.`);
    if (confirmation === null) return;
    setDeletingAccount(true);
    setError('');
    const response = await fetch('/api/account/delete/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }),
    });
    const body = await response.json() as { deleted?: boolean; error?: string };
    if (response.ok && body.deleted) {
      window.location.assign('/');
      return;
    }
    setError(body.error || 'The account could not be deleted.');
    setDeletingAccount(false);
  }

  if (!data) return <div className="account-page"><p className="account-loading">Loading your account…</p></div>;
  if (!data.account) return <div className="account-page account-signed-out"><span className="eyebrow">YOUR ACCOUNT</span><h1>Sign in to see your work.</h1><p>Your saved images, credit balance, and billing details will appear here.</p><button onClick={() => window.dispatchEvent(new Event('moss-open-account'))}>Sign in</button></div>;

  return <div className="account-page">
    <header className="account-page-header"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Your Account</h1><p>{data.account.email}</p></div><Link href="/#studio" className="account-open-studio">Open studio</Link></header>
    {error && <p className="error" role="alert">{error}</p>}
    <section className={`account-credit-card ${credits < 5 ? 'low' : ''}`} id="credits">
      <div><span>Remaining credits</span><strong>{credits}</strong><small>{data.account.plan === 'free' ? 'Free account' : `${data.account.plan} plan`}</small></div>
      <dl><div><dt>Subscription</dt><dd>{data.account.subscriptionCredits}</dd></div><div><dt>Starter</dt><dd>{data.account.starterCredits}</dd></div><div><dt>Credit pack</dt><dd>{data.account.packCredits}</dd></div></dl>
      {credits < 5 && <Link href="/pricing/">{credits === 0 ? 'Choose a plan to continue' : 'Credits are running low — add more'}</Link>}
    </section>

    <section className="account-section" id="images"><div className="account-section-heading"><div><span className="eyebrow">MY IMAGES</span><h2>Your recent generations</h2></div><span>{data.generations.length} saved</span></div>
      <p className="account-history-note">Images generated after account history was enabled appear here. Your images are private and can be deleted at any time.</p>
      {data.generations.length ? <div className="account-image-grid">{data.generations.map(item => <article key={item.request_id}>
        <div className="account-image-preview">{item.image_key ? <img src={`/api/account/generations/image/?id=${encodeURIComponent(item.request_id)}`} alt="Saved MOSS-Image generation" loading="lazy"/> : <span>{item.status === 'pending' ? 'Generation pending' : 'Image archive unavailable'}</span>}</div>
        <div className="account-image-body"><time>{new Date(item.created).toLocaleDateString()}</time><p>{item.prompt}</p><small>{item.mode === 'layout' ? 'JSON layout' : 'Text prompt'} · {item.size} · Seed {item.result_seed ?? item.requested_seed ?? 'random'}</small><div>
          {item.image_key && <><a href={`/api/account/generations/image/?id=${encodeURIComponent(item.request_id)}&download=1`}>Download</a><button onClick={() => void navigator.clipboard.writeText(item.prompt)}>Copy prompt</button></>}
          <button disabled={busyId === item.request_id} onClick={() => void remove(item.request_id)}>Delete</button>
        </div></div>
      </article>)}</div> : <div className="account-empty"><h3>You haven&apos;t saved any images yet.</h3><p>Your next completed generation will appear here automatically.</p><Link href="/#studio">Generate your first image</Link></div>}
    </section>

    <div className="account-lower-grid">
      <section className="account-section" id="activity"><span className="eyebrow">CREDIT ACTIVITY</span><h2>Recent changes</h2>{data.ledger.length ? <ul className="credit-ledger">{data.ledger.map(item => <li key={item.id}><div><strong>{labels[item.kind] || item.kind.replaceAll('_', ' ')}</strong><time>{new Date(item.created).toLocaleString()}</time></div><span className={item.delta > 0 ? 'positive' : ''}>{item.delta > 0 ? '+' : ''}{item.delta}</span></li>)}</ul> : <p>No credit activity yet.</p>}</section>
      <section className="account-section" id="billing"><span className="eyebrow">BILLING</span><h2>{data.billing?.subscription ? `${data.billing.subscription.plan} subscription` : data.billing?.lastPayment?.plan === 'pack' ? 'Credit pack' : 'Free account'}</h2><p>{data.billing?.subscription ? `Status: ${data.billing.subscription.status}${data.billing.subscription.period_end ? ` · next renewal ${new Date(data.billing.subscription.period_end).toLocaleDateString()}` : ''}` : 'Buy credits only when you need more room to create.'}</p>{data.billing?.subscription && <dl className="billing-cycle"><div><dt>Used this billing cycle</dt><dd>{data.billing.usage.usedThisCycle} images</dd></div><div><dt>Subscription balance</dt><dd>{data.account.subscriptionCredits} images remaining</dd></div>{data.account.plan === 'monthly' && <div><dt>Next rollover</dt><dd>Up to 80 unused credits carry over, then 80 new credits are added; maximum 160.</dd></div>}</dl>}{data.account.stripeCustomerId ? <button onClick={() => void portal()}>Manage billing and invoices</button> : <Link href="/pricing/">View plans</Link>}</section>
    </div>
    <section className="account-section account-data-controls" id="data"><span className="eyebrow">YOUR DATA</span><h2>Export or delete your account</h2><p>Download a JSON copy of your account, prompts, credit activity, and seven-day image download links.</p><div><a href="/api/account/export/">Export my data</a><button type="button" className="danger" disabled={deletingAccount} onClick={() => void deleteAccount()}>{deletingAccount ? 'Deleting…' : 'Delete my account'}</button></div><small>Deleting the account also deletes the Stripe customer profile and immediately cancels active subscriptions. It does not automatically issue a refund. Required transaction history may remain with Stripe under its retention policies.</small></section>
  </div>;
}
