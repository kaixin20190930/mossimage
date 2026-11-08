'use client';

import { FormEvent, useEffect, useState } from 'react';

const choices = [
  ['styleChange', 'Change the style of an image I already have'],
  ['selectiveRepaint', 'Repaint one area while keeping the rest as stable as possible'],
  ['textReplacement', 'Replace text inside an image'],
  ['compositionChange', 'Keep the composition but change its contents'],
  ['other', 'Something else'],
] as const;

function visitorId() {
  const key = 'moss_visitor_id';
  const stored = window.localStorage.getItem(key);
  if (stored) return stored;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export function EditingInterestForm() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch('/api/analytics/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ event: 'editing_early_access_view', visitorId: visitorId(), properties: {} }) }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!choices.some(([key]) => selected[key])) { setStatus('Select at least one workflow.'); return; }
    setBusy(true); setStatus('');
    try {
      const response = await fetch('/api/editing-interest/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ visitorId: visitorId(), choices: Object.fromEntries(choices.map(([key]) => [key, !!selected[key]])), note, email }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Could not save your request.');
      setStatus('Thanks — your request has been recorded.');
      setNote(''); setEmail('');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save your request.'); }
    finally { setBusy(false); }
  }

  return <form className="editing-interest-form" onSubmit={submit}>
    <fieldset><legend>Select every option that applies.</legend>{choices.map(([key, label]) => <label key={key}><input type="checkbox" checked={!!selected[key]} onChange={event => setSelected(current => ({ ...current, [key]: event.target.checked }))}/><span>{label}</span></label>)}</fieldset>
    <label htmlFor="editing-note">Tell us more — optional</label><input id="editing-note" maxLength={280} value={note} onChange={event => setNote(event.target.value)} placeholder="One short line about the edit you need"/>
    <label htmlFor="editing-email">Email — optional, only for an early-access invitation</label><input id="editing-email" type="email" maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/>
    <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Submit my request'}</button>
    <p className="form-message" aria-live="polite">{status}</p>
  </form>;
}
