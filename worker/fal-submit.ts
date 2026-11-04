export class FalSubmitError extends Error {
  constructor(message: string, readonly uncertain: boolean) {
    super(message);
  }
}

/** A paid queue submission must never be retried after an uncertain response. */
export async function submitImage(key: string, input: Record<string, unknown>) {
  let response: Response;
  try {
    response = await fetch('https://queue.fal.run/fal-ai/moss-image', {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new FalSubmitError('Provider submission status is uncertain', true);
  }
  if (!response.ok) throw new FalSubmitError(`Provider submit HTTP ${response.status}`, false);
  let data: { request_id?: unknown };
  try { data = await response.json() as { request_id?: unknown }; }
  catch { throw new FalSubmitError('Provider response could not be read', true); }
  if (typeof data.request_id !== 'string' || !data.request_id) throw new FalSubmitError('Missing provider job ID', true);
  return { request_id: data.request_id };
}
