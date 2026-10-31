import test from 'node:test';
import assert from 'node:assert/strict';
import { submitImage } from '../worker/fal-submit';
test('paid submission does not retry HTTP failures or ambiguous network failures', async () => {
  const original = globalThis.fetch;
  try {
    for (const failure of ['http','network']) {
      let calls = 0;
      globalThis.fetch = async () => { calls++; if(failure==='network') throw new TypeError('fetch failed'); return new Response('{}',{status:503}); };
      await assert.rejects(submitImage('fake-test-key', {prompt:'test'}));
      assert.equal(calls,1);
    }
  } finally { globalThis.fetch = original; }
});
