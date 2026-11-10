'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, LoaderCircle, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import { layoutExample, sizes, validateLayout } from '@/lib/generation';
import { featuredImageById, featuredImages, type FeaturedImage } from '@/lib/featured-images';
import { track } from '@/lib/analytics';

const examples = featuredImages.filter(image => image.featured);
const quickStarts = ['bilingual-menu', 'jazz-poster', 'botanical-poster', 'product-showcase', 'g25', 'g29']
  .map(id => featuredImageById(id)).filter((image): image is FeaturedImage => Boolean(image));

type ErrorCode =
  | 'credits_exhausted' | 'starter_limit' | 'generation_failed_refunded'
  | 'generation_provider_failed_refunded' | 'generation_safety_refunded' | 'generation_no_image_refunded'
  | 'generation_status_uncertain' | 'generation_submit_uncertain' | 'generation_poll_uncertain'
  | 'cooldown' | 'daily_budget_exhausted' | 'preview_attempt_limit'
  | 'account_frozen' | 'sign_in_required' | 'preview_limit' | 'preview_requires_account' | 'invalid_job'
  | 'generation_unavailable' | 'unknown';

type GenerationBody = {
  intentId?: string;
  token?: string;
  remaining?: number;
  account?: { plan?: 'free' | 'monthly' | 'annual'; starterCredits?: number; subscriptionCredits?: number; packCredits?: number };
  status?: string;
  image?: string;
  seed?: number;
  code?: ErrorCode;
  error?: string;
  creditRestored?: boolean;
  preview?: boolean;
};

type PendingGeneration = { intentId: string; token?: string };
const pendingGenerationKey = 'moss-pending-generation';
const statusRetryDelays = [0, 2000, 4000, 8000];

type GenerationIssue = {
  kind: 'refunded' | 'uncertain' | 'generic';
  code: ErrorCode;
  message: string;
};

class GenerationRequestError extends Error {
  code: ErrorCode;
  creditRestored: boolean;

  constructor(body: GenerationBody, fallback: string) {
    super(body.error || fallback);
    this.code = body.code || 'unknown';
    this.creditRestored = body.creditRestored === true;
  }
}

export function Studio() {
  const [model, setModel] = useState<'sft' | 'base'>('sft');
  const [mode, setMode] = useState<'text' | 'layout'>('text');
  const [prompt, setPrompt] = useState(examples[0]?.prompt || '');
  const [layout, setLayout] = useState(layoutExample);
  const [size, setSize] = useState<keyof typeof sizes>('square');
  const [seed, setSeed] = useState(examples[0] ? String(examples[0].seed) : '');
  const [guidanceScale, setGuidanceScale] = useState(3);
  const [steps, setSteps] = useState(50);
  const [localOnlyPreset, setLocalOnlyPreset] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [issue, setIssue] = useState<GenerationIssue>();
  const [image, setImage] = useState('');
  const [resultSeed, setResultSeed] = useState<number>();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [previewExhausted, setPreviewExhausted] = useState(false);
  const [previewComplete, setPreviewComplete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [starterComplete, setStarterComplete] = useState(false);
  const [verifiedWelcome, setVerifiedWelcome] = useState(false);
  const alive = useRef(true);
  const upgradeTracked = useRef(false);
  const generationSource = useRef<'default' | 'example' | 'quick_start' | 'shared' | 'manual'>('default');
  const pendingGeneration = useRef<PendingGeneration | undefined>(undefined);

  function currentUtcDay() {
    return new Date().toISOString().slice(0, 10);
  }

  function markPreviewUsed(used: boolean) {
    setPreviewExhausted(used);
    if (used) window.localStorage.setItem('moss-preview-day', currentUtcDay());
    else if (window.localStorage.getItem('moss-preview-day') === currentUtcDay()) window.localStorage.removeItem('moss-preview-day');
  }

  useEffect(() => {
    alive.current = true;
    const params = new URLSearchParams(window.location.search);
    const cfgParam = Number(params.get('cfg'));
    const stepsParam = Number(params.get('steps'));
    if (Number.isFinite(cfgParam) && cfgParam >= 1 && cfgParam <= 6) setGuidanceScale(cfgParam);
    if (Number.isInteger(stepsParam) && stepsParam >= 4 && stepsParam <= 50) setSteps(stepsParam);
    // shift and SLG are local ComfyUI controls. The hosted fal.ai endpoint
    // does not expose them, so shared links explain the boundary instead of
    // silently pretending those values were applied.
    setLocalOnlyPreset(params.has('shift') || params.has('slg'));
    const eligible = window.sessionStorage.getItem('moss-quick-start-eligible') === '1';
    const verified = eligible || params.get('verified') === '1';
    window.sessionStorage.removeItem('moss-quick-start-eligible');
    setVerifiedWelcome(verified);
    if (verified) track('verified_landing_view');
    if (params.has('verified')) {
      params.delete('verified');
      const query = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    }
    if (params.get('model') === 'base') setModel('base');
    else if (params.get('model') === 'sft') setModel('sft');
    const selected = featuredImageById(params.get('example'));
    if (selected) {
      generationSource.current = 'example';
      setMode(selected.mode);
      setSize(selected.size);
      setSeed(String(selected.seed));
      if (selected.mode === 'layout') setLayout(selected.prompt);
      else setPrompt(selected.prompt);
    } else if (params.get('prompt')) {
      generationSource.current = 'shared';
      setMode('text');
      setPrompt(params.get('prompt') || '');
    } else if (params.get('layout')) {
      generationSource.current = 'shared';
      setMode('layout');
      setLayout(params.get('layout') || layoutExample);
    } else if (params.get('mode') === 'layout') {
      setMode('layout');
    }
    track('studio_view', { source: generationSource.current });
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(pendingGenerationKey) || 'null') as PendingGeneration | null;
      if (saved?.intentId) {
        pendingGeneration.current = saved;
        setIssue({ kind: 'uncertain', code: 'generation_status_uncertain', message: 'A generation from this tab is still being checked.' });
      }
    } catch { window.sessionStorage.removeItem(pendingGenerationKey); }

    const refreshAccount = () => fetch('/api/account/')
      .then(response => response.json())
      .then(data => {
        if (!alive.current) return;
        setSignedIn(Boolean(data.account));
        if (!data.account) {
          setRemaining(null);
          setSize('square');
          setPreviewExhausted(window.localStorage.getItem('moss-preview-day') === currentUtcDay());
          return;
        }
        const credits = (data.account.starterCredits || 0) + (data.account.subscriptionCredits || 0) + (data.account.packCredits || 0);
        setRemaining(credits);
        setPreviewExhausted(false);
        setPreviewComplete(false);
        if (credits > 0) {
          setUpgradeVisible(false);
          upgradeTracked.current = false;
        }
      })
      .catch(() => undefined);

    fetch('/api/config/').then(response => response.json()).then(data => {
      if (alive.current) setEnabled(data.enabled);
    }).catch(() => {
      if (alive.current) setEnabled(false);
    });
    refreshAccount();
    window.addEventListener('moss-account-change', refreshAccount);
    return () => {
      alive.current = false;
      window.removeEventListener('moss-account-change', refreshAccount);
    };
  }, []);

  useEffect(() => {
    if (!verifiedWelcome) return;
    track('quick_start_view');
    track('quick_start_rendered');
  }, [verifiedWelcome]);

  function savePending(next?: PendingGeneration) {
    pendingGeneration.current = next;
    if (next) window.sessionStorage.setItem(pendingGenerationKey, JSON.stringify(next));
    else window.sessionStorage.removeItem(pendingGenerationKey);
  }

  function revealUpgrade(isStarterComplete = false) {
    setStarterComplete(isStarterComplete);
    setUpgradeVisible(true);
    if (!upgradeTracked.current) {
      track('upgrade_impression');
      upgradeTracked.current = true;
    }
  }

  function showIssue(next: GenerationIssue) {
    setIssue(next);
    setError('');
    track('generation_error_view', { errorCode: next.code });
    if (next.kind === 'refunded') track('refunded_retry_cta_view', { errorCode: next.code });
  }

  async function fetchGenerationStatus(token: string) {
    for (let attempt = 0; attempt < statusRetryDelays.length; attempt++) {
      if (statusRetryDelays[attempt]) await new Promise(resolve => setTimeout(resolve, statusRetryDelays[attempt]));
      try {
        return await fetch(`/api/generate/status/?token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(15000) });
      } catch (error) {
        if (attempt === statusRetryDelays.length - 1) throw error;
      }
    }
    throw new Error('Generation status could not be checked.');
  }

  async function generate(retryErrorCode?: ErrorCode) {
    setError('');
    setIssue(undefined);
    if (model === 'base') {
      setError('MOSS-Image Base is available through the local workflows below. This hosted studio generates with SFT.');
      return;
    }
    if (signedIn === false && mode === 'layout') {
      setError('Sign in to use JSON layout control and full-size canvases.');
      window.dispatchEvent(new Event('moss-open-account'));
      return;
    }
    const text = mode === 'text' ? prompt : layout;
    if (text.trim().length < 3) {
      setError('Add a few words about the image you have in mind.');
      return;
    }
    if (seed && (!/^\d+$/.test(seed) || Number(seed) > 2147483647)) {
      setError('Seed must be a whole number between 0 and 2147483647.');
      return;
    }
    try {
      if (mode === 'layout') validateLayout(text, size);
    } catch (caught) {
      setError((caught as Error).message);
      return;
    }

    if (retryErrorCode) track('generation_retry', { errorCode: retryErrorCode });
    track('generate_submit', { mode, size, source: generationSource.current });
    const intentId = crypto.randomUUID();
    savePending({ intentId });
    setBusy(true);
    setStatus('Submitting your idea…');

    try {
      let response: Response;
      try {
        response = await fetch('/api/generate/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intentId,
            prompt: text,
            size,
            mode,
            guidanceScale,
            steps,
            ...(seed ? { seed: Number(seed) } : {}),
          }),
          signal: AbortSignal.timeout(30000),
        });
      } catch {
        throw new GenerationRequestError({ code: 'generation_submit_uncertain' }, 'The request status could not be confirmed. Check this generation before submitting it again.');
      }

      const job = await response.json() as GenerationBody;
      if (job.intentId || job.token) savePending({ intentId: job.intentId || intentId, token: job.token });
      if (!response.ok) {
        if (job.code !== 'generation_submit_uncertain' && job.code !== 'generation_poll_uncertain' && job.code !== 'generation_status_uncertain') savePending();
        throw new GenerationRequestError(job, 'Could not start generation.');
      }
      if (!job.preview) {
        setRemaining(job.remaining ?? null);
      }
      window.dispatchEvent(new Event('moss-account-change'));

      let consecutivePollErrors = 0;
      for (let attempt = 0; attempt < 150; attempt++) {
        if (!alive.current) return;
        await new Promise(resolve => setTimeout(resolve, 3000));
        let poll: Response;
        try {
          poll = await fetchGenerationStatus(job.token || '');
        } catch {
          consecutivePollErrors++;
          if (consecutivePollErrors < 3) continue;
          throw new GenerationRequestError({ code: 'generation_poll_uncertain' }, 'This generation is still being checked. Avoid submitting it again immediately so you are not charged twice.');
        }
        const result = await poll.json() as GenerationBody;
        if (!poll.ok) {
          if (result.code === 'generation_poll_uncertain' && ++consecutivePollErrors < 3) continue;
          throw new GenerationRequestError(result, 'Could not check your generation.');
        }
        consecutivePollErrors = 0;
        if (result.status === 'COMPLETED') {
          track('generate_success', { mode, size, source: generationSource.current });
          savePending();
          setImage(result.image || '');
          setResultSeed(result.seed);
          setStatus('Your image is ready.');
          if (job.preview) {
            setPreviewComplete(true);
            markPreviewUsed(true);
            if (!upgradeTracked.current) {
              track('upgrade_impression');
              upgradeTracked.current = true;
            }
          }
          window.dispatchEvent(new Event('moss-account-change'));
          if (job.remaining === 0) {
            const account = job.account;
            revealUpgrade(Boolean(account && account.plan === 'free' && !account.packCredits));
          }
          return;
        }
        if (result.status === 'FAILED') {
          savePending();
          window.dispatchEvent(new Event('moss-account-change'));
          throw new GenerationRequestError(result, 'Generation failed.');
        }
        setStatus(result.status === 'IN_QUEUE' ? 'Your idea is in the queue…' : 'Bringing your idea to life…');
      }
      throw new GenerationRequestError({ code: 'generation_status_uncertain' }, 'This generation is still being checked. Avoid submitting it again immediately so you are not charged twice.');
    } catch (caught) {
      const generationError = caught instanceof GenerationRequestError
        ? caught
        : new GenerationRequestError({}, caught instanceof Error ? caught.message : 'Something went wrong. Please try again later.');
      track('generate_fail', { mode, size, errorCode: generationError.code });

      if (generationError.code === 'preview_limit') {
        markPreviewUsed(true);
        setPreviewComplete(true);
      } else if (generationError.code === 'credits_exhausted' || generationError.code === 'starter_limit') {
        setRemaining(0);
        revealUpgrade(false);
      } else if (generationError.code === 'sign_in_required' || generationError.code === 'preview_requires_account') {
        window.dispatchEvent(new Event('moss-open-account'));
        setError(generationError.message);
      } else if (generationError.creditRestored || generationError.code === 'generation_failed_refunded') {
        savePending();
        if (signedIn === false) {
          markPreviewUsed(false);
          setPreviewComplete(false);
        }
        showIssue({ kind: 'refunded', code: generationError.code, message: generationError.message });
        window.dispatchEvent(new Event('moss-account-change'));
      } else if (generationError.code === 'generation_status_uncertain') {
        showIssue({ kind: 'uncertain', code: generationError.code, message: generationError.message });
      } else if (generationError.code === 'generation_submit_uncertain' || generationError.code === 'generation_poll_uncertain') {
        showIssue({ kind: 'uncertain', code: generationError.code, message: generationError.message });
      } else {
        showIssue({ kind: 'generic', code: generationError.code, message: generationError.message });
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  async function checkPendingStatus() {
    const pending = pendingGeneration.current;
    if (!pending) return;
    track('uncertain_recheck_click', { errorCode: issue?.code || 'generation_status_uncertain' });
    setBusy(true);
    setStatus('Checking the original generation…');
    try {
      let token = pending.token;
      if (!token) {
        const intentResponse = await fetch(`/api/generate/intent/?id=${encodeURIComponent(pending.intentId)}`);
        const intent = await intentResponse.json() as { token?: string; outcome?: string; error?: string };
        if (intentResponse.status === 404) {
          savePending();
          setIssue({ kind: 'generic', code: 'generation_unavailable', message: 'This request did not reach the generation service. You can submit it again.' });
          return;
        }
        if (!intentResponse.ok) throw new Error(intent.error || 'This generation could not be checked.');
        token = intent.token;
        if (!token) {
          setIssue({ kind: 'uncertain', code: 'generation_submit_uncertain', message: 'The provider has not returned a job ID yet. Do not submit this prompt again yet.' });
          return;
        }
        savePending({ ...pending, token });
      }
      const response = await fetchGenerationStatus(token);
      const result = await response.json() as GenerationBody;
      if (!response.ok) throw new GenerationRequestError(result, 'Could not check your generation.');
      if (result.status === 'COMPLETED') {
        track('generate_success', { mode, size, source: generationSource.current });
        setImage(result.image || '');
        setResultSeed(result.seed);
        setIssue(undefined);
        setStatus('Your image is ready.');
        savePending();
        window.dispatchEvent(new Event('moss-account-change'));
        return;
      }
      if (result.status === 'FAILED') {
        savePending();
        throw new GenerationRequestError(result, 'Generation failed.');
      }
      setIssue({ kind: 'uncertain', code: 'generation_status_uncertain', message: 'The original generation is still running. Check it again shortly.' });
    } catch (caught) {
      const generationError = caught instanceof GenerationRequestError ? caught : new GenerationRequestError({}, caught instanceof Error ? caught.message : 'This generation could not be checked.');
      if (generationError.creditRestored) {
        savePending();
        showIssue({ kind: 'refunded', code: generationError.code, message: generationError.message });
      } else {
        setIssue({ kind: 'uncertain', code: generationError.code, message: generationError.message });
      }
    } finally {
      setBusy(false);
    }
  }

  async function buyCreditPack() {
    track('upgrade_pack_click', { plan: 'credit_pack' });
    setCheckoutBusy(true);
    setError('');
    try {
      const response = await fetch('/api/billing/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'credit_pack' }),
      });
      const body = await response.json() as { url?: string; error?: string };
      if (body.url) {
        track('checkout_open', { plan: 'credit_pack' });
        window.location.assign(body.url);
        return;
      }
      if (response.status === 401) window.dispatchEvent(new Event('moss-open-account'));
      setError(body.error || 'Checkout could not be started.');
    } catch {
      setError('Checkout could not be started. Check your connection and try again.');
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function download() {
    setDownloading(true);
    try {
      const response = await fetch(image);
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `moss-image-${resultSeed ?? Date.now()}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Download could not complete. Use “Open image” to save from a new tab.');
    } finally {
      setDownloading(false);
    }
  }

  async function copyCurrentPrompt() {
    await navigator.clipboard.writeText(mode === 'text' ? prompt : layout);
  }

  function tryAnotherPrompt() {
    setImage('');
    setResultSeed(undefined);
    setIssue(undefined);
    setError('');
    document.getElementById('prompt')?.focus();
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
  }

  function dismissWelcome() {
    setVerifiedWelcome(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('verified');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function applyExample(id: string, source: 'example' | 'quick_start' = 'example') {
    const selected = featuredImageById(id);
    if (!selected) return;
    setMode(selected.mode);
    setSize(selected.size);
    setSeed(String(selected.seed));
    setError('');
    setIssue(undefined);
    generationSource.current = source;
    if (selected.mode === 'layout') setLayout(selected.prompt);
    else setPrompt(selected.prompt);
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
  }

  function changeCanvasShape() {
    const order: Array<keyof typeof sizes> = ['square', 'portrait', 'landscape'];
    setSize(order[(order.indexOf(size) + 1) % order.length]);
    setIssue(undefined);
  }

  return <>
    {verifiedWelcome && <><div className="verified-welcome" role="status"><div><strong>Your 3 starter credits are ready.</strong><span>Choose a tested starting point, then make it yours.</span></div><Link href="/gallery/">Browse examples</Link><button type="button" onClick={dismissWelcome}>Dismiss</button></div><section className="verified-quick-starts" aria-label="Quick start prompts"><span className="eyebrow">QUICK START</span><div>{quickStarts.map(example => <button type="button" key={example.id} onClick={() => { track('quick_start_select', { example: example.id }); applyExample(example.id, 'quick_start'); setVerifiedWelcome(false); }}><span><Image src={example.src} alt="" fill sizes="120px"/></span><strong>{example.title}</strong><small>{example.mode === 'layout' ? 'JSON layout' : 'Text prompt'}</small></button>)}</div></section></>}
    <section id="studio" className="studio">
      <div className="controls">
        <div className="panel-title"><span><Sparkles size={17}/> Your imagination, a little wilder.</span><span className="tiny-tag">MOSS-Image {model === 'sft' ? 'SFT' : 'Base'}</span></div>
        <fieldset className="model-selector">
          <legend>Model</legend>
          <button type="button" className={model === 'sft' ? 'selected' : ''} aria-pressed={model === 'sft'} onClick={() => { setModel('sft'); setError(''); }}><span><strong>MOSS-Image SFT</strong><small>Hosted here · stronger text-led generation</small></span>{model === 'sft' && <Check size={14}/>}</button>
          <button type="button" className={model === 'base' ? 'selected' : ''} aria-pressed={model === 'base'} onClick={() => { setModel('base'); setError(''); }}><span><strong>MOSS-Image Base</strong><small>Foundation checkpoint · local setup</small></span>{model === 'base' && <Check size={14}/>}</button>
        </fieldset>
        {model === 'base' && <div className="base-model-notice"><strong>Base runs locally.</strong><p>The fal.ai endpoint connected to this studio serves MOSS-Image SFT. Use the official Base weights with a matching ComfyUI workflow.</p><div><Link href="/guide/local-deploy/">Local install guide</Link><Link href="/workflows/">Download workflows</Link></div></div>}
        <div className="tabs" aria-label="Prompt mode">
          <button type="button" aria-pressed={mode === 'text'} className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>Text to image</button>
          <button type="button" aria-pressed={mode === 'layout'} className={mode === 'layout' ? 'active' : ''} disabled={signedIn === false} title={signedIn === false ? 'Sign in to use JSON layout control' : undefined} onClick={() => setMode('layout')}><span className="code-icon">{'{ }'}</span> JSON layout <span className="tab-detail">Advanced</span></button>
        </div>
        <label className="field-label" htmlFor="prompt">{mode === 'text' ? 'Describe your image' : 'Define your layout'}<span>Make it yours.</span></label>
        <div className="prompt-wrap"><textarea id="prompt" maxLength={6000} className={mode === 'layout' ? 'json-input' : ''} placeholder="A quiet little cabin, tucked into a moss-covered forest. Morning light, a little mist, a world of possibility…" value={mode === 'text' ? prompt : layout} onChange={event => { generationSource.current = 'manual'; if (mode === 'text') setPrompt(event.target.value); else setLayout(event.target.value); }}/><span className="char-count">{(mode === 'text' ? prompt : layout).length} / 6000</span></div>
        <div className="prompt-ideas"><span>Try an idea</span>{examples.map(example => <button type="button" key={example.id} onClick={() => applyExample(example.id)}>{example.title}</button>)}</div>
        <fieldset className="size-options"><legend>Aspect ratio</legend>{Object.entries(sizes).map(([key, value]) => <button type="button" key={key} className={size === key ? 'selected' : ''} aria-pressed={size === key} disabled={signedIn === false && key !== 'square'} title={signedIn === false && key !== 'square' ? 'Sign in to unlock every canvas shape' : undefined} onClick={() => setSize(key as keyof typeof sizes)}><span className={`ratio-icon ${key}`}/><span>{value.label}<small>{value.ratio}</small></span>{size === key && <Check size={13}/>}</button>)}</fieldset>
        <button type="button" className="advanced" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}><SlidersHorizontal size={15}/> Advanced settings <span>{advanced ? '−' : '+'}</span></button>
        {advanced && <div className="advanced-content"><label htmlFor="seed">Seed <small>Leave blank for a new variation.</small></label><input id="seed" inputMode="numeric" placeholder="Random" value={seed} onChange={event => setSeed(event.target.value)}/><p>1 image · {steps} steps · CFG {guidanceScale} · {signedIn === false ? '512 × 512 px free preview' : `${sizes[size].width} × ${sizes[size].height} px`}</p>{localOnlyPreset && <p className="preset-boundary"><strong>Hosted settings applied where supported.</strong> Shift and SLG belong to local ComfyUI workflows and are not sent to fal.ai.</p>}</div>}
        {previewExhausted && signedIn === false ? <div className="preview-signup-cta"><strong>Ready for more?</strong><span>Sign in by email for 3 starter images. No credit card required.</span><div><button type="button" onClick={() => window.dispatchEvent(new Event('moss-open-account'))}>Sign in free</button><Link href="/pricing/">See pricing</Link></div></div> : <button type="button" className="generate" disabled={model === 'base' || busy || enabled !== true || (mode === 'text' ? prompt : layout).trim().length < 3} onClick={() => void generate()}>{busy ? <LoaderCircle className="spin" size={18}/> : <Sparkles size={18}/>} {model === 'base' ? 'Base requires local setup' : busy ? 'Creating your image…' : (mode === 'text' ? prompt : layout).trim().length < 3 ? 'Enter a prompt to generate' : signedIn === false && prompt === examples[0]?.prompt ? 'Generate bilingual menu preview' : signedIn === false ? 'Generate free preview' : 'Generate image'}</button>}
        <div className="quota">{model === 'base' ? 'Base is not sent to the hosted SFT endpoint.' : enabled === null ? 'Checking studio availability…' : enabled ? (signedIn === false ? (previewExhausted ? 'Free preview used · Sign in for 3 starter images' : '1 free 512 × 512 text preview · No sign-in required') : remaining === null ? 'Checking your image credits…' : `${remaining} credits available`) : 'Preview mode · Image generation is not connected yet'}</div>
        {error && <p role="alert" className="error">{error}</p>}
      </div>
      <div className="preview-panel">
        <div className="preview-top"><span><span className={`status-dot ${busy ? 'pulsing' : ''}`}/>{busy ? 'CREATING' : 'YOUR CANVAS'}</span><span>{signedIn === false ? '512 × 512 PREVIEW' : `${sizes[size].width} × ${sizes[size].height}`}</span></div>
        <div className="canvas" aria-live="polite">
          {image ? <img src={image} alt="Your MOSS-Image generation"/> : <div className="empty-canvas example-canvas"><Image className="empty-preview-image" src={examples[0].src} alt="Example MOSS-Image output" fill sizes="(max-width: 760px) 100vw, 50vw" priority/><div className="empty-example-card"><span className="canvas-note">REAL EXAMPLE OUTPUT</span><h2>Start with a prompt<br/><em>that already works.</em></h2><p>{prompt === examples[0].prompt ? 'This bilingual menu prompt is already filled in below. Edit it or generate the preview.' : 'Load this bilingual menu example, then make it your own.'}</p><button type="button" onClick={() => applyExample(examples[0].id)}>{prompt === examples[0].prompt ? 'Loaded in prompt' : 'Use this example'}</button></div></div>}
          {busy && <div className="loading-overlay"><LoaderCircle className="spin"/><p>{status}</p></div>}
        </div>
        <div className="preview-bottom"><span>{image ? `Seed ${resultSeed ?? 'random'}` : 'Use the example or write your own prompt.'}</span>{image ? <div className="result-actions"><a href={image} target="_blank" rel="noreferrer">Open image</a><button onClick={download} disabled={downloading}><ArrowDownToLine size={15}/> Download</button><button onClick={() => void copyCurrentPrompt()}>Copy prompt</button></div> : <span className="preview-mark">✳</span>}</div>
        {image && <div className="result-next"><span>What&apos;s next?</span><div><button type="button" onClick={tryAnotherPrompt}><RotateCcw size={15}/><strong>Try another prompt</strong><small>Return to your wording and refine it.</small></button><Link href="/json-layout/"><span className="code-icon">{'{ }'}</span><strong>Build a JSON layout</strong><small>Guide text and objects into regions.</small></Link><Link href="/account/#images"><span>▧</span><strong>Browse your images</strong><small>Return to saved work and prompts.</small></Link></div></div>}
        {previewComplete && signedIn === false && <div className="preview-complete" role="status"><div><strong>Free preview complete.</strong><span>Sign in by email for 3 full-size starter images and private generation history.</span></div><button type="button" onClick={() => window.dispatchEvent(new Event('moss-open-account'))}>Sign in free</button></div>}
        {issue && <div className={`generation-notice ${issue.kind}`} role="alert">
          <strong>{issue.kind === 'refunded' ? 'This generation didn’t complete.' : issue.kind === 'uncertain' ? 'This generation is still being checked.' : 'Generation could not continue.'}</strong>
          <p>{issue.kind === 'refunded' ? (signedIn === false ? 'This preview did not count toward your daily limit. Adjust the prompt and try again.' : 'Your credit has been restored. Adjust your prompt or canvas shape and try again.') : issue.message}</p>
          {issue.kind === 'refunded' && <div><button type="button" onClick={() => void generate(issue.code)}>Try again</button><button type="button" className="secondary" onClick={changeCanvasShape}>Change canvas shape</button></div>}
          {issue.kind === 'uncertain' && <button type="button" className="secondary" onClick={() => void checkPendingStatus()} disabled={busy}>Check status</button>}
        </div>}
        {upgradeVisible && <div className="upgrade-card" aria-live="polite">
          <span className="eyebrow">KEEP CREATING</span>
          <h3>{starterComplete ? 'Your starter images are complete.' : 'Ready for more room?'}</h3>
          <p>Continue with 30 non-expiring image credits, or compare subscriptions for regular use.</p>
          <div><button type="button" onClick={() => void buyCreditPack()} disabled={checkoutBusy}>{checkoutBusy ? 'Opening Checkout…' : 'Buy 30 credits — $9.99'}</button><Link href="/pricing/" onClick={() => track('upgrade_pricing_click')}>See all plans</Link></div>
        </div>}
      </div>
    </section>
    <p className="studio-early-access">Want to work from an existing image? <Link href="/image-editing-early-access/">Join image-editing early access</Link>.</p>
    <section className="inspiration" id="inspiration">
      <div className="section-heading"><div><span className="eyebrow">MADE IN THIS STUDIO</span><h2>What you can build.</h2></div><Link href="/gallery/" className="text-link">View all 31 creations</Link></div>
      <div className="inspiration-grid">{examples.map(example => <button type="button" key={example.id} className="inspiration-card" onClick={() => applyExample(example.id)}><div className="art featured-art"><Image src={example.src} alt={example.alt} fill sizes="(max-width: 760px) 100vw, 33vw"/><span className="art-label">MOSS-IMAGE SFT OUTPUT</span><span className="use-prompt">Try this prompt</span></div><div className="card-caption"><span>{example.title}<small>{example.label === 'BILINGUAL TEXT' ? 'Chinese + English text' : example.label === 'JSON LAYOUT' ? 'JSON layout control' : 'Visual quality'}</small></span></div></button>)}</div>
      <p className="concept-note">Generated with MOSS-Image SFT in this studio. Select a card to try its prompt.</p>
    </section>
  </>;
}
