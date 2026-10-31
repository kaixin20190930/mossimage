/** A paid queue submission must never be retried after an uncertain response. */
export async function submitImage(key: string, input: Record<string, unknown>) {
  const response = await fetch('https://queue.fal.run/fal-ai/moss-image', {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`Provider submit HTTP ${response.status}`);
  const data = await response.json() as { request_id?: unknown };
  if (typeof data.request_id !== 'string' || !data.request_id) throw new Error('Missing provider job ID');
  return { request_id: data.request_id };
}
