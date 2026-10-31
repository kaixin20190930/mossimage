import test from 'node:test';
import assert from 'node:assert/strict';
import { generationSchema, layoutExample, validateLayout, sizes } from '../lib/generation';
import { signJob, verifyJob, identity, configured } from '../lib/server';
const env = { APP_SECRET: 'test-secret-only-do-not-use-in-production-12345' };
test('rejects arbitrary expensive dimensions, extra fields and invalid seeds', () => {
 assert.equal(generationSchema.safeParse({ prompt:'A forest',size:'square',mode:'text' }).success,true);
 assert.equal(generationSchema.safeParse({ prompt:'A forest',size:'square',mode:'text',guidanceScale:3,steps:50 }).success,true);
 for (const extra of [{size:'4k'},{seed:-1},{seed:2.4},{seed:2147483648},{guidanceScale:0},{guidanceScale:7},{steps:3},{steps:51},{steps:4.5},{num_images:100},{prompt:'  '},{prompt:'x'.repeat(6001)}]) assert.equal(generationSchema.safeParse({prompt:'A forest',size:'square',mode:'text',...extra}).success,false);
 assert.equal(Math.max(...Object.values(sizes).map(s=>s.width*s.height)),1048576);
});
test('layout parser validates structure, bounds, positive boxes and text content', () => {
 assert.doesNotThrow(()=>validateLayout(layoutExample,'square'));
 assert.throws(()=>validateLayout('{','square'));
 assert.throws(()=>validateLayout('{}','square'));
 const source=JSON.parse(layoutExample);
 for(const bbox of [[-600,0,100,100],[0,0,0,100],[0,100,100,0],[0,0,600,100]]) {
  const bad=structuredClone(source);bad.items[0].bbox=bbox;assert.throws(()=>validateLayout(JSON.stringify(bad),'square'));
 }
 source.items[0].text='';assert.throws(()=>validateLayout(JSON.stringify(source),'square'));
});
test('job tokens reject tampering, other owners and expiration',()=>{
 const token=signJob('request-1','owner-1',env,1000);
 assert.equal(verifyJob(token,'owner-1',env,1001),'request-1');
 assert.throws(()=>verifyJob(token,'owner-2',env,1001));
 assert.throws(()=>verifyJob(token,'owner-1',env,3601000));
 assert.throws(()=>verifyJob(token+'x','owner-1',env,1001));
 assert.throws(()=>verifyJob(token+'.extra','owner-1',env,1001));
});
test('Cloudflare identity rejects missing and multi-address headers',()=>{
 const req=(ip:string)=>new Request('https://mossimage.run/api/generate/',{headers:{'cf-connecting-ip':ip}});
 assert.equal(identity(req('203.0.113.5'),env),identity(req('203.0.113.5'),env));
 for(const ip of ['', 'not-an-ip', '203.0.113.5, 198.51.100.3']) assert.throws(()=>identity(req(ip),env));
 assert.throws(()=>identity(new Request('https://mossimage.run',{headers:{'x-forwarded-for':'203.0.113.5'}}),env));
});
test('local identity cannot be changed by a browser header or enabled on public hosts',()=>{
 const localEnv={...env,LOCAL_DEV:'true'};
 assert.equal(identity(new Request('http://127.0.0.1:8787'),localEnv),identity(new Request('http://127.0.0.1:8787',{headers:{'cf-connecting-ip':'203.0.113.5'}}),localEnv));
 assert.throws(()=>identity(new Request('https://mossimage.run'),localEnv));
});
test('generation requires explicit enablement and complete secrets',()=>{
 assert.equal(configured(env),false);
 const complete={...env,FAL_KEY:'test-key',APP_ORIGIN:'https://mossimage.run',GENERATION_ENABLED:'true'};
 assert.equal(configured(complete),true);
 assert.equal(configured({...complete,APP_SECRET:''}),false);
 assert.equal(configured({...complete,GENERATION_ENABLED:'false'}),false);
});
