import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyStripeSignature } from '../worker/stripe-signature';

test('Stripe webhook signatures require an authentic recent v1 signature', () => {
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
  const secret = 'whsec_test_only';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret), true);
  assert.equal(verifyStripeSignature(`${payload} `, `t=${timestamp},v1=${signature}`, secret), false);
  assert.equal(verifyStripeSignature(payload, `t=${timestamp - 301},v1=${signature}`, secret), false);
  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=not-hex`, secret), false);
});
