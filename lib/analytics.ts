'use client';

export type FunnelEvent =
  | 'studio_view'
  | 'generate_submit'
  | 'generate_success'
  | 'generate_fail'
  | 'verify_email_sent'
  | 'verify_success'
  | 'pricing_view'
  | 'plan_click'
  | 'checkout_open'
  | 'checkout_complete'
  | 'upgrade_impression'
  | 'upgrade_pack_click'
  | 'upgrade_pricing_click'
  | 'generation_error_view'
  | 'generation_retry'
  | 'quick_start_view'
  | 'quick_start_select';

let memoryVisitorId = '';

function visitorId() {
  if (memoryVisitorId) return memoryVisitorId;
  try {
    const stored = window.localStorage.getItem('moss_visitor_id');
    if (stored) return (memoryVisitorId = stored);
    const created = crypto.randomUUID();
    window.localStorage.setItem('moss_visitor_id', created);
    return (memoryVisitorId = created);
  } catch {
    return (memoryVisitorId = crypto.randomUUID());
  }
}

export function track(event: FunnelEvent, properties?: Record<string, string | number | boolean | null>) {
  const payload = JSON.stringify({ event, visitorId: visitorId(), properties });
  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon('/api/analytics/', new Blob([payload], { type: 'application/json' }));
      if (sent) return;
    }
    void fetch('/api/analytics/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => undefined);
  } catch {
    // Analytics must never interrupt a product action.
  }
}
