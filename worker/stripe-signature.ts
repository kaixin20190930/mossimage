import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyStripeSignature(payload: string, header: string, secret: string) {
  const fields = header.split(',').map(part => part.split('=', 2));
  const timestamp = fields.find(([key]) => key === 't')?.[1];
  const signatures = fields.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest();
  return signatures.some(signature => {
    const actual = Buffer.from(signature, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}
