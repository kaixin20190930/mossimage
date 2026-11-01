import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions, Response as MFResponse, type Request as MFRequest } from 'miniflare';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Workers + SQLite Durable Objects integration (no real provider calls)', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'moss-worker-'));
  await build({ entryPoints: ['tests/worker-fixture.ts'], outfile: join(temp,'worker.mjs'), bundle: true, format: 'esm', platform: 'node', target: 'es2022', external: ['cloudflare:workers','node:*'] });
  let allowProvider = false;
  let providerCalls = 0;
  const outboundService = async (request: MFRequest) => {
    if (!allowProvider) throw new Error('External network blocked in tests');
    providerCalls++;
    const url = new URL(request.url);
    assert.equal(url.origin, 'https://queue.fal.run');
    if (request.method === 'POST' && url.pathname === '/fal-ai/moss-image') {
      const body = await request.json() as Record<string, unknown>;
      assert.equal(body.num_images, 1); assert.equal(body.enable_safety_checker, true);
      assert.equal(body.num_inference_steps, 40); assert.equal(body.guidance_scale, 4);
      assert.deepEqual(body.image_size, {width:512,height:512});
      return MFResponse.json({request_id:'test-job'});
    }
    if (url.pathname === '/fal-ai/moss-image/requests/test-job/status') return MFResponse.json({status:'COMPLETED'});
    if (url.pathname === '/fal-ai/moss-image/requests/test-job') return MFResponse.json({images:[{url:'https://fal.media/test.png'}],seed:42,has_nsfw_concepts:[false]});
    throw new Error('Unexpected provider URL: ' + url.pathname);
  };
  const options = convertV4MiniflareOptions({
    modules: true, script: await readFile(join(temp,'worker.mjs'), 'utf8'), compatibilityDate: '2026-10-21', compatibilityFlags: ['nodejs_compat'],
    durableObjects: { GENERATION_STATE: { className: 'TestState', useSQLite: true } },
    durableObjectsPersist: join(temp,'state'), outboundService,
    bindings: { APP_SECRET: 'test-secret-32-characters-long-123456789', FAL_KEY: 'fake-key-for-mocked-test', APP_ORIGIN: 'https://mossimage.run', GENERATION_ENABLED: 'true', DAILY_PIXEL_LIMIT: '3000000', AUTH_ENABLED: 'true' },
  });
  options.resourcePersistencePath = join(temp, 'state');
  let mf = new Miniflare(options);
  let namespace: Awaited<ReturnType<Miniflare['getDurableObjectNamespace']>>;
  function ledger(name: string) { const stub = namespace.get(namespace.idFromName(name)); return async (path: string, body: unknown) => {
    const r = await stub.fetch(`https://state.internal${path}`,{method:'POST',body:JSON.stringify(body)}); assert.equal(r.status,200); return r.json() as Promise<any>;
  }; }
  const owner='a'.repeat(64), second='b'.repeat(64);
  try {
    namespace = await mf.getDurableObjectNamespace('GENERATION_STATE');
    await t.test('www redirects to HTTPS apex preserving path and query before API processing', async () => {
      for (const path of ['/', '/guide/?source=www', '/api/generate/?test=1']) {
        const response = await mf.dispatchFetch(`https://www.mossimage.run${path}`, { redirect: 'manual' });
        assert.equal(response.status, 308);
        assert.equal(response.headers.get('location'), `https://mossimage.run${path}`);
      }
      for (const path of ['/compare/', '/free/?source=http']) {
        const response = await mf.dispatchFetch(`http://mossimage.run${path}`, { redirect: 'manual' });
        assert.equal(response.status, 308);
        assert.equal(response.headers.get('location'), `https://mossimage.run${path}`);
      }
      assert.equal(providerCalls, 0);
    });
    await t.test('legacy Base vs SFT guide redirects to the comparison page', async () => {
      for (const path of ['/guide/base-vs-sft', '/guide/base-vs-sft/?source=search']) {
        const response = await mf.dispatchFetch(`https://mossimage.run${path}`, { redirect: 'manual' });
        assert.equal(response.status, 308);
        assert.equal(response.headers.get('location'), `https://mossimage.run/compare/base-vs-sft/${path.includes('?') ? '?source=search' : ''}`);
      }
    });
    await t.test('obsolete annual URL redirects to pricing', async () => {
      for (const path of ['/year', '/year/?source=search']) {
        const response = await mf.dispatchFetch(`https://mossimage.run${path}`, { redirect: 'manual' });
        assert.equal(response.status, 308);
        assert.equal(response.headers.get('location'), `https://mossimage.run/pricing/${path.includes('?') ? '?source=search' : ''}`);
      }
    });
    await t.test('consolidated landing pages redirect to their canonical product routes', async () => {
      const cases = [
        ['/use-cases/menu/?source=search', '/presets/menu/?source=search'],
        ['/moss-image-generator-online/', '/'],
        ['/guide/json-layout-generator/?template=poster', '/json-layout/?template=poster'],
      ] as const;
      for (const [from, to] of cases) {
        const response = await mf.dispatchFetch(`https://mossimage.run${from}`, { redirect: 'manual' });
        assert.equal(response.status, 308);
        assert.equal(response.headers.get('location'), `https://mossimage.run${to}`);
      }
    });
    await t.test('downloadable workflow JSON is explicitly excluded from indexing', async () => {
      const response = await mf.dispatchFetch('https://mossimage.run/workflows/moss-image-workflow.json');
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    });
    await t.test('concurrent anonymous preview requests reserve once',async()=>{
      const call=ledger('concurrent-user');
      const results=await Promise.all(Array.from({length:20},()=>call('/reserve',{owner,pixels:1000000})));
      assert.equal(results.filter(r=>r.allowed).length,1);
      assert.equal(results.filter(r=>!r.allowed&&r.code==='preview_limit').length,19);
    });
    await t.test('global cap is shared across users and denial consumes no personal quota',async()=>{
      const call=ledger('global-budget');
      const results=await Promise.all(Array.from({length:10},(_,i)=>call('/reserve',{owner:i.toString(16).padStart(64,'0'),pixels:1000000})));
      assert.equal(results.filter(r=>r.allowed).length,3);
      assert.equal(results.filter(r=>!r.allowed&&r.code==='budget').length,7);
    });
    await t.test('anonymous preview limit and UTC rollover',async()=>{
      const call=ledger('daily-reset'); const day=Date.parse('2026-10-21T12:00:00Z');
      await call('/test-clock',day);
      assert.deepEqual(await call('/reserve',{owner,reservationId:'1'.repeat(32),pixels:262144}),{allowed:true,remaining:0,mode:'preview'});
      await call('/test-clock',day+30000); assert.deepEqual(await call('/reserve',{owner,reservationId:'2'.repeat(32),pixels:262144}),{allowed:false,code:'preview_limit'});
      await call('/test-clock',Date.parse('2026-10-22T00:00:00Z')); assert.deepEqual(await call('/reserve',{owner,reservationId:'3'.repeat(32),pixels:262144}),{allowed:true,remaining:0,mode:'preview'});
    });
    await t.test('failed anonymous preview is refunded and can be retried',async()=>{
      const call=ledger('preview-refund');
      const previewOwner='7'.repeat(64), reservationId='8'.repeat(32), requestId='preview-job';
      assert.equal((await call('/reserve',{owner:previewOwner,reservationId,pixels:262144})).allowed,true);
      await call('/preview/link',{reservationId,requestId});
      assert.deepEqual(await call('/preview/refund',{requestId}),{refunded:true});
      assert.deepEqual(await call('/preview/refund',{requestId}),{refunded:false});
      assert.deepEqual(await call('/reserve',{owner:previewOwner,reservationId:'9'.repeat(32),pixels:262144}),{allowed:true,remaining:0,mode:'preview'});
    });
    await t.test('failed budget reservation leaves no cooldown or personal debit',async()=>{
      const call=ledger('denied');
      await call('/reserve',{owner:'c'.repeat(64),pixels:1048576});
      await call('/reserve',{owner:'d'.repeat(64),pixels:1048576});
      assert.deepEqual(await call('/reserve',{owner:second,pixels:1048576}),{allowed:false,code:'budget'});
      assert.deepEqual(await call('/reserve',{owner:second,reservationId:'a'.repeat(32),pixels:500000}),{allowed:true,remaining:0,mode:'preview'});
    });
    await t.test('first-party funnel events validate, aggregate and expose no visitor identifiers',async()=>{
      const call=ledger('analytics');
      const now=Date.parse('2026-10-25T10:00:00Z');
      await call('/test-clock',now);
      const visitorHash='9'.repeat(64);
      await call('/analytics/record',{event:'pricing_view',visitorHash,properties:{}});
      await call('/analytics/record',{event:'pricing_view',visitorHash,properties:{}});
      await call('/analytics/record',{event:'plan_click',visitorHash,properties:{plan:'monthly'}});
      await call('/analytics/record',{event:'generation_error_view',visitorHash,properties:{errorCode:'generation_failed_refunded'}});
      const summary=await call('/analytics/summary',{days:30});
      assert.deepEqual(summary.totals,[
        {event:'generation_error_view',events:1,visitors:1},
        {event:'plan_click',events:1,visitors:1},
        {event:'pricing_view',events:2,visitors:1},
      ]);
      assert.equal(JSON.stringify(summary).includes(visitorHash),false);
      assert.deepEqual(summary.breakdowns,[
        {event:'generation_error_view',events:1,visitors:1,properties:{errorCode:'generation_failed_refunded'}},
        {event:'plan_click',events:1,visitors:1,properties:{plan:'monthly'}},
      ]);
      assert.deepEqual(summary.generationFrequency,[]);
      assert.deepEqual(summary.dailySnapshots,[]);
      assert.deepEqual(summary.gscDaily,[]);
      assert.deepEqual(summary.gscTopQueries,[]);
      assert.equal(summary.gscLastSync,null);
      assert.equal(summary.gscSync.status,'never');
      await call('/analytics/snapshot',{day:'2026-10-25',generatedAt:now+1000});
      await call('/gsc/sync-status',{status:'running',timestamp:now+1500});
      await call('/gsc/replace',{startDate:'2026-10-24',endDate:'2026-10-25',fetchedAt:now+2000,rows:[
        {day:'2026-10-25',query:'moss image generator',page:'https://mossimage.run/',clicks:2,impressions:20,ctr:0.1,position:5.5},
      ],totals:[
        {day:'2026-10-25',clicks:3,impressions:30,ctr:0.1,position:6.5},
      ]});
      await call('/gsc/inspections/replace',{inspectedAt:now+2500,rows:[
        {url:'https://mossimage.run/compare/base-vs-sft/',payload:{verdict:'PASS',coverageState:'Submitted and indexed'}},
      ]});
      await call('/gsc/sitemaps/replace',{checkedAt:now+2500,rows:[
        {path:'https://mossimage.run/sitemap.xml',payload:{lastDownloaded:'2026-10-25T09:00:00Z',errors:'0',warnings:'0'}},
      ]});
      await call('/gsc/sync-status',{status:'success',timestamp:now+3000,rowsWritten:1,totalsWritten:1,inspectedUrls:1,sitemapsChecked:1});
      const persisted=await call('/analytics/summary',{days:30});
      assert.equal(persisted.dailySnapshots.length,1);
      assert.deepEqual(persisted.dailySnapshots[0].metrics,summary.totals);
      assert.deepEqual(persisted.gscDaily,[{day:'2026-10-25',clicks:3,impressions:30,ctr:0.1,position:6.5}]);
      assert.deepEqual(persisted.gscTopQueries,[{query:'moss image generator',clicks:2,impressions:20,position:5.5}]);
      assert.equal(persisted.gscLastSync,new Date(now+3000).toISOString());
      assert.equal(persisted.gscSync.status,'success');
      assert.equal(persisted.gscSync.rowsWritten,1);
      assert.equal(persisted.gscInspections[0].verdict,'PASS');
      assert.equal(persisted.gscSitemaps[0].errors,'0');
    });
    await t.test('account credits, refunds and billing grants are atomic and idempotent',async()=>{
      const call=ledger('account-credit-ledger');
      const email='buyer@example.com', codeHash='c'.repeat(64), userId='d'.repeat(64), sessionHash='e'.repeat(64);
      assert.deepEqual(await call('/auth/request',{email,codeHash,owner}),{accepted:true});
      const verified=await call('/auth/verify',{email,codeHash,userId,sessionHash});
      assert.equal(verified.verified,true); assert.equal(verified.account.starterCredits,3);
      const reservationId='f'.repeat(32);
      const reserved=await call('/reserve',{owner,userId,reservationId,pixels:1048576});
      assert.equal(reserved.allowed,true); assert.equal(reserved.account.starterCredits,2);
      assert.deepEqual(await call('/job/refund',{reservationId}),{refunded:true});
      assert.deepEqual(await call('/job/refund',{reservationId}),{refunded:false});
      const session=await call('/session',{sessionHash}); assert.equal(session.account.starterCredits,3);

      const pack={eventId:'evt_pack',action:'pack',userId,paymentId:'pi_pack',customerId:'cus_test'};
      assert.equal((await call('/billing/event',pack)).account.packCredits,30);
      assert.deepEqual(await call('/billing/event',pack),{duplicate:true});
      assert.equal((await call('/billing/event',{eventId:'evt_refund',action:'refund_purchase',paymentId:'pi_pack'})).account.packCredits,0);

      const periodEnd=Date.now()+86400000;
      assert.equal((await call('/billing/event',{eventId:'evt_monthly',action:'subscription_start',userId,plan:'monthly',subscriptionId:'sub_test',paymentId:'in_start',periodEnd})).account.subscriptionCredits,80);
      assert.equal((await call('/billing/event',{eventId:'evt_renew_1',action:'subscription_renew',subscriptionId:'sub_test',paymentId:'in_renew_1',periodEnd})).account.subscriptionCredits,160);
      assert.equal((await call('/billing/event',{eventId:'evt_renew_2',action:'subscription_renew',subscriptionId:'sub_test',paymentId:'in_renew_2',periodEnd})).account.subscriptionCredits,160);
      await call('/test-clock',Date.now()+31000);
      const subscriptionReservation='0'.repeat(32);
      const usedSubscription=await call('/reserve',{owner,userId,reservationId:subscriptionReservation,pixels:262144});
      assert.equal(usedSubscription.account.subscriptionCredits,159);
      assert.equal(usedSubscription.account.starterCredits,3);
      assert.equal(usedSubscription.account.packCredits,0);
    });
    await t.test('generation history is private, listable and deletable by its account owner',async()=>{
      const call=ledger('generation-history');
      const email='history@example.com', codeHash='1'.repeat(64), userId='2'.repeat(64), sessionHash='3'.repeat(64);
      await call('/auth/request',{email,codeHash,owner});
      await call('/auth/verify',{email,codeHash,userId,sessionHash});
      const reservationId='4'.repeat(32), requestId='history-job';
      assert.equal((await call('/reserve',{owner,userId,reservationId,pixels:1048576})).allowed,true);
      await call('/job/link',{reservationId,requestId,prompt:'A private test prompt',mode:'text',size:'square',seed:42});
      await call('/generation/complete',{requestId,imageKey:`${userId}/history-job.png`,seed:84});
      const dashboard=await call('/account/dashboard',{userId});
      assert.equal(dashboard.generations.length,1);
      assert.equal(dashboard.generations[0].prompt,'A private test prompt');
      assert.equal(dashboard.generations[0].result_seed,84);
      assert.equal((await call('/generation/get',{userId:'5'.repeat(64),requestId})).generation,null);
      assert.deepEqual(await call('/generation/delete',{userId,requestId}),{deleted:true,imageKey:`${userId}/history-job.png`});
      assert.equal((await call('/account/dashboard',{userId})).generations.length,0);
    });
    await t.test('account data can be exported and permanently deleted',async()=>{
      const call=ledger('account-data-controls');
      const email='privacy@example.com', codeHash='6'.repeat(64), userId='7'.repeat(64), sessionHash='8'.repeat(64);
      await call('/auth/request',{email,codeHash,owner});
      await call('/auth/verify',{email,codeHash,userId,sessionHash});
      const exported=await call('/account/export',{userId});
      assert.equal(exported.account.email,email);
      assert.equal(exported.pendingJobs,0);
      assert.deepEqual(await call('/account/delete',{userId}),{deleted:true});
      assert.equal((await call('/session',{sessionHash})).account,null);
      assert.equal((await call('/account/export',{userId})).account,null);
      await call('/test-clock',Date.now()+61000);
      const secondCode='9'.repeat(64), secondSession='a'.repeat(64);
      await call('/auth/request',{email,codeHash:secondCode,owner});
      const registeredAgain=await call('/auth/verify',{email,codeHash:secondCode,userId,sessionHash:secondSession});
      assert.equal(registeredAgain.account.starterCredits,0);
    });
    await t.test('poll lease, result cache and one-hour expiry',async()=>{
      const call=ledger('cache');const now=Date.now();await call('/test-clock',now);
      assert.deepEqual(await call('/poll',{requestId:'job'}),{acquired:true});
      assert.deepEqual(await call('/poll',{requestId:'job'}),{acquired:false});
      await call('/test-clock',now+15000);assert.deepEqual(await call('/poll',{requestId:'job'}),{acquired:true});
      const result={status:'COMPLETED',image:'https://example.com/result.png'};
      await call('/result',{requestId:'job',result});assert.deepEqual(await call('/poll',{requestId:'job'}),{cached:result});
      await call('/test-clock',now+3615000);assert.deepEqual(await call('/poll',{requestId:'job'}),{acquired:true});
    });
    await t.test('public API rejects wrong origins, invalid input, bad tokens and unsupported methods',async()=>{
      const post=(origin:string,body:unknown)=>mf.dispatchFetch('https://mossimage.run/api/generate/',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'203.0.113.5'},body:JSON.stringify(body)});
      assert.equal((await post('https://foreign.invalid',{})).status,403);
      assert.equal((await post('https://mossimage.run',{})).status,400);
      assert.equal((await post('https://mossimage.run',{prompt:'test',mode:'text',size:'4k'})).status,400);
      assert.equal((await mf.dispatchFetch('https://mossimage.run/api/generate/status/?token=bad')).status,403);
      assert.equal((await mf.dispatchFetch('https://mossimage.run/api/generate/')).status,405);
      assert.equal((await mf.dispatchFetch('https://mossimage.run/reserve')).status,404);
    });
    await t.test('analytics API accepts only same-origin allowlisted anonymous events',async()=>{
      const payload={event:'generate_submit',visitorId:'550e8400-e29b-41d4-a716-446655440000',properties:{mode:'text',size:'square'}};
      const send=(origin:string,body:unknown)=>mf.dispatchFetch('https://mossimage.run/api/analytics/',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
      assert.equal((await send('https://mossimage.run',payload)).status,204);
      assert.equal((await send('https://mossimage.run',{...payload,event:'studio_view',properties:{source:'example'}})).status,204);
      assert.equal((await send('https://mossimage.run',{...payload,event:'quick_start_select',properties:{example:'bilingual-menu'}})).status,204);
      assert.equal((await send('https://mossimage.run',{...payload,event:'generation_error_view',properties:{errorCode:'generation_status_uncertain'}})).status,204);
      assert.equal((await send('https://foreign.invalid',payload)).status,403);
      assert.equal((await send('https://mossimage.run',{...payload,properties:{prompt:'private'}})).status,400);
      assert.equal((await mf.dispatchFetch('https://mossimage.run/api/analytics/summary/')).status,403);
    });
    await t.test('mocked fal queue submission, owner-bound status and cached result',async()=>{
      allowProvider = true;
      const response=await mf.dispatchFetch('https://mossimage.run/api/generate/',{method:'POST',headers:{origin:'https://mossimage.run','content-type':'application/json','cf-connecting-ip':'203.0.113.8'},body:JSON.stringify({prompt:'A botanical poster',mode:'text',size:'square',guidanceScale:4,steps:40})});
      assert.equal(response.status,202,await response.clone().text());
      const job=await response.json() as {token:string;remaining:number;preview:boolean};assert.equal(job.remaining,0);assert.equal(job.preview,true);
      const url=`https://mossimage.run/api/generate/status/?token=${encodeURIComponent(job.token)}`;
      assert.equal((await mf.dispatchFetch(url,{headers:{'cf-connecting-ip':'203.0.113.9'}})).status,403);
      for(let i=0;i<2;i++) { const r=await mf.dispatchFetch(url,{headers:{'cf-connecting-ip':'203.0.113.8'}});assert.equal(r.status,200,await r.clone().text());assert.deepEqual(await r.json(),{status:'COMPLETED',image:'https://fal.media/test.png',seed:42}); }
    });
    assert.equal(providerCalls, 3);
    allowProvider = false;
    await t.test('state survives runtime restart',async()=>{
      const call=ledger('persistence');const result={status:'COMPLETED',seed:123};await call('/result',{requestId:'saved',result});
      await mf.dispose();mf=new Miniflare(options);
      const ns=await mf.getDurableObjectNamespace('GENERATION_STATE');
      const r=await ns.get(ns.idFromName('persistence')).fetch('https://state.internal/poll',{method:'POST',body:JSON.stringify({requestId:'saved'})});
      assert.deepEqual(await r.json(),{cached:result});
    });
  } finally { await mf.dispose();await rm(temp,{recursive:true,force:true}); }
});
