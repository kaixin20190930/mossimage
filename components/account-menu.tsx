'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

type Account = {
  email: string;
  plan: string;
  starterCredits: number;
  subscriptionCredits: number;
  packCredits: number;
  stripeCustomerId: string | null;
};

type AccountResponse = {
  authEnabled: boolean;
  paymentsEnabled: boolean;
  account: Account | null;
};

const dialogId = 'moss-account-dialog';
const focusableSelector = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function AccountMenu() {
  const [data, setData] = useState<AccountResponse>();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/account/', { credentials: 'same-origin' });
      if (response.ok) setData(await response.json() as AccountResponse);
    } catch {
      // The static UI can load before the local Worker/API is ready. Keep the
      // account control hidden and retry on the next account-change event.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const show = () => setOpen(true);
    const update = () => void refresh();
    window.addEventListener('moss-open-account', show);
    window.addEventListener('moss-account-change', update);
    return () => {
      window.removeEventListener('moss-open-account', show);
      window.removeEventListener('moss-account-change', update);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) || []);
    requestAnimationFrame(() => focusable()[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
      else triggerRef.current?.focus();
    };
  }, [open]);

  if (!data?.authEnabled) return null;
  const credits = data.account
    ? data.account.starterCredits + data.account.subscriptionCredits + data.account.packCredits
    : 0;

  async function request(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await response.json() as { error?: string; debugCode?: string };
      if (!response.ok) throw new Error(body.error);
      track('verify_email_sent');
      setSent(true);
      if (body.debugCode) setCode(body.debugCode);
      setMessage('Check your email for a six-digit code.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error);
      track('verify_success');
      await refresh();
      window.dispatchEvent(new Event('moss-account-change'));
      window.location.assign('/?verified=1#studio');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout/', { method: 'POST' });
    setData(previous => previous ? { ...previous, account: null } : previous);
    setSent(false);
    setCode('');
    window.dispatchEvent(new Event('moss-account-change'));
  }

  async function portal() {
    setBusy(true);
    const response = await fetch('/api/billing/portal/', { method: 'POST' });
    const body = await response.json() as { url?: string; error?: string };
    if (body.url) window.location.assign(body.url);
    else setMessage(body.error || 'Billing management is unavailable.');
    setBusy(false);
  }

  return <>
    <button
      ref={triggerRef}
      className={`account-trigger ${data.account && credits < 5 ? 'credits-low' : ''}`}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={dialogId}
      onClick={() => setOpen(true)}
    >
      <UserRound size={14}/>{data.account ? `${credits} credits` : 'Sign in · 3 free'}
    </button>
    {open && <div className="account-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section
        ref={dialogRef}
        id={dialogId}
        className="account-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        aria-busy={busy}
      >
        <button className="dialog-close" type="button" aria-label="Close account dialog" onClick={() => setOpen(false)}><X size={17}/></button>
        {data.account ? <>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h2 id="account-title">Ready when inspiration arrives.</h2>
          <p className="account-email">{data.account.email}</p>
          <div className="credit-total"><strong>{credits}</strong><span>images available</span></div>
          <dl className="credit-breakdown">
            <div><dt>Plan</dt><dd>{data.account.plan}</dd></div>
            <div><dt>Subscription</dt><dd>{data.account.subscriptionCredits}</dd></div>
            <div><dt>Starter</dt><dd>{data.account.starterCredits}</dd></div>
            <div><dt>Credit pack</dt><dd>{data.account.packCredits}</dd></div>
          </dl>
          {message && <p role="alert" className="form-message">{message}</p>}
          <Link className="account-primary account-link" href="/account/" onClick={() => setOpen(false)}>My images and credits</Link>
          {data.account.stripeCustomerId && <button className="account-primary" type="button" onClick={portal} disabled={busy}>Manage billing</button>}
          <button className="account-secondary" type="button" onClick={signOut} disabled={busy}>Sign out</button>
        </> : <>
          <span className="eyebrow">THREE IMAGES TO BEGIN</span>
          <h2 id="account-title">A small code, then a blank canvas.</h2>
          <p>Sign in by email. New accounts receive three starter images.</p>
          {!sent ? <form onSubmit={request}>
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)}/>
            <button className="account-primary" disabled={busy}>{busy ? 'Sending…' : 'Send sign-in code'}</button>
          </form> : <form onSubmit={verify}>
            <label htmlFor="account-code">Six-digit code</label>
            <input id="account-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))}/>
            <button className="account-primary" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
            <button type="button" className="account-secondary" onClick={() => { setSent(false); setCode(''); setMessage(''); }}>Use another email</button>
          </form>}
          {message && <p role="status" className="form-message">{message}</p>}
        </>}
      </section>
    </div>}
  </>;
}
