import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { articles, directories, homeMetadata } from '../lib/content';
import { landingPageMetadata } from '../lib/landing-pages';
import { featuredImages } from '../lib/featured-images';
import sitemap from '../app/sitemap';
import { blogPosts } from '../lib/blog-posts';
import { contentLastModified, policyUpdatedLabels } from '../lib/content-dates';
test('all 17 planned content pages have distinct constrained search metadata',()=>{
 const pages=[homeMetadata,...articles,...directories,...landingPageMetadata];assert.equal(pages.length,17);
 assert.equal(new Set(pages.map(p=>p.title)).size,pages.length);
 assert.equal(new Set(pages.map(p=>p.description)).size,pages.length);
 for(const page of pages){ assert.ok(page.title.length<=60,`${page.title}: ${page.title.length}`);assert.ok(page.description.length<=155,`${page.title} description: ${page.description.length}`); }
});
test('nested pages have a parent directory and official source links',()=>{
 for(const article of articles){ if(article.slug.includes('/')) assert.ok(directories.some(d=>d.slug===article.slug.split('/')[0]));assert.ok(article.links?.length); }
 for(const page of landingPageMetadata){ if(page.slug.includes('/')) assert.ok(directories.some(d=>d.slug===page.slug.split('/')[0])); }
});
test('search-intent pages expose the expected canonical records',()=>{
 assert.ok(landingPageMetadata.some(page=>page.slug==='compare/base-vs-sft'));
 assert.ok(!articles.some(page=>page.slug==='guide/base-vs-sft'));
 const prompt=landingPageMetadata.find(page=>page.slug==='guide/prompt');
 const comfyui=landingPageMetadata.find(page=>page.slug==='comfyui');
 assert.match(prompt?.title||'',/Prompt Guide/);
 assert.match(prompt?.title||'',/Prompting/);
 assert.match(prompt?.title||'',/Builder/);
 const baseVsSft=landingPageMetadata.find(page=>page.slug==='compare/base-vs-sft');
 assert.match(baseVsSft?.title||'',/Stripe Fix/);
 assert.ok(landingPageMetadata.some(page=>page.slug==='json-layout'));
 assert.ok(landingPageMetadata.some(page=>page.slug==='moss-image-generator-online'));
 assert.ok(landingPageMetadata.some(page=>page.slug==='moss-image-ai'));
 assert.match(comfyui?.title||'',/Native vs MOSSImageHFLoader/);
 const comfyuiSource=readFileSync(resolve('app/comfyui/page.tsx'),'utf8');
 assert.match(comfyuiSource,/href=\"\/comfyui\/mossimagehfloader\/\"/);
 const workflowsSource=readFileSync(resolve('app/workflows/page.tsx'),'utf8');
 assert.equal(workflowsSource.match(/MOSSImageHFLoader/g)?.length,2);
  const baseVsSftSource=readFileSync(resolve('app/compare/base-vs-sft/page.tsx'),'utf8');
  assert.match(baseVsSftSource,/SFT vs Base/);
  assert.doesNotMatch(baseVsSftSource,/href=[{"']*\/guide\/base-vs-sft/);
  const loaderSource=readFileSync(resolve('app/comfyui/mossimagehfloader/page.tsx'),'utf8');
  assert.match(loaderSource,/'@type': 'FAQPage'/);
  assert.match(loaderSource,/Does MOSSImageHFLoader support INT8/);
  const jsonLayoutSource=readFileSync(resolve('app/guide/json-layout/page.tsx'),'utf8');
  assert.match(jsonLayoutSource,/href="\/text-in-image-generator\/"/);
});
test('featured generations have stable unique records and optimized local assets',()=>{
 assert.equal(featuredImages.length,31);
 assert.equal(featuredImages.filter(image=>image.featured).length,3);
 assert.equal(new Set(featuredImages.map(image=>image.id)).size,featuredImages.length);
 assert.equal(featuredImages.at(-1)?.title,'Open possibilities card');
 for(const image of featuredImages){
  assert.ok(image.alt.length>=20,`${image.id} needs a descriptive alt`);
  assert.ok(image.prompt.length>=20,`${image.id} needs a reusable prompt`);
  const file=resolve(`public${image.src}`);
  assert.ok(existsSync(file),`${image.id} image is missing`);
  assert.ok(statSync(file).size<=82_000,`${image.id} should stay below 82 KB`);
 }
});
test('both published ComfyUI workflows are valid and use their matching loader path',()=>{
 const pluginPath=resolve('public/workflows/moss-image-workflow.json');
 const nativePath=resolve('public/workflows/moss-image-native-sft-workflow.json');
 const pluginSource=readFileSync(pluginPath,'utf8');
 const nativeSource=readFileSync(nativePath,'utf8');
 assert.doesNotThrow(()=>JSON.parse(pluginSource));
 assert.doesNotThrow(()=>JSON.parse(nativeSource));
 assert.match(pluginSource,/MOSSImageHFLoader/);
 assert.doesNotMatch(nativeSource,/MOSSImageHFLoader/);
 assert.equal(JSON.parse(pluginSource).version,0.4);
 assert.equal(JSON.parse(nativeSource).version,0.4);
});

test('sitemap excludes private account routes',()=>{
 const entries=sitemap();
 const urls=entries.map(entry=>entry.url);
 assert.ok(!urls.some(url=>url.includes('/account/')));
 assert.equal(new Set(urls).size,urls.length);
 assert.ok(urls.includes('https://mossimage.run/guide/settings/'));
 assert.ok(urls.includes('https://mossimage.run/guide/turbo-lora/'));
 assert.ok(urls.includes('https://mossimage.run/guide/base-guide/'));
 assert.ok(urls.includes('https://mossimage.run/troubleshooting/'));
 assert.ok(urls.includes('https://mossimage.run/moss-image-edit/'));
 assert.ok(urls.includes('https://mossimage.run/image-editing-early-access/'));
 assert.ok(urls.includes('https://mossimage.run/featured-on/'));
 assert.ok(urls.includes('https://mossimage.run/json-layout/'));
 assert.ok(urls.includes('https://mossimage.run/presets/product-label/'));
 assert.ok(urls.includes('https://mossimage.run/presets/infographic/'));
 assert.ok(urls.includes('https://mossimage.run/presets/quote-card/'));
 assert.ok(!urls.includes('https://mossimage.run/guide/json-layout-generator/'));
 assert.ok(!urls.includes('https://mossimage.run/moss-image-generator-online/'));
 assert.ok(!urls.includes('https://mossimage.run/use-cases/menu/'));
 for(const entry of entries){
  const slug=entry.url.replace('https://mossimage.run/','').replace(/\/$/,'');
  assert.match(String(entry.lastModified),/^2026-\d{2}-\d{2}$/,`${slug||'home'} needs an explicit content date`);
  assert.ok(contentLastModified[slug],`${slug||'home'} is missing from the content-date registry`);
 }
 assert.equal(contentLastModified.gallery,'2026-10-31');
 assert.equal(contentLastModified.terms,'2026-10-31');
 assert.equal(contentLastModified.privacy,'2026-11-08');
 assert.equal(policyUpdatedLabels.terms,'October 31, 2026');
 assert.equal(policyUpdatedLabels.privacy,'November 8, 2026');
});

test('topic pages expose contextual bidirectional internal links',()=>{
 const blogPage=readFileSync(resolve('app/blog/[slug]/page.tsx'),'utf8');
 for(const target of ['/comfyui/mossimagehfloader/','/compare/flux/','/json-layout/','/chinese-ai-image-generator/','/moss-image-ai/']) assert.match(blogPage,new RegExp(target.replaceAll('/','\\/')));
 const sources: Array<[string,string]> = [
  ['app/comfyui/mossimagehfloader/page.tsx','/blog/moss-image-comfyui-guide/'],
  ['app/guide/prompt/page.tsx','/blog/best-moss-image-prompts-examples-seeds/'],
  ['app/compare/flux/page.tsx','/blog/moss-image-vs-flux-text-rendering/'],
  ['app/json-layout/page.tsx','/blog/json-layout-ai-image-generator-guide/'],
  ['app/chinese-ai-image-generator/page.tsx','/blog/generate-readable-chinese-text-ai-images/'],
  ['app/presets/[slug]/page.tsx','/blog/best-moss-image-prompts-examples-seeds/'],
  ['app/presets/[slug]/page.tsx','/guide/prompt/'],
  ['components/prompt-showcase-article.tsx','/presets/infographic/'],
  ['components/prompt-showcase-article.tsx','/presets/quote-card/'],
 ];
 for(const [file,target] of sources) assert.match(readFileSync(resolve(file),'utf8'),new RegExp(target.replaceAll('/','\\/')),`${file} should link to ${target}`);
});

test('featured-on page is indexable server-rendered HTML with ordinary external links',()=>{
 const source=readFileSync(resolve('app/featured-on/page.tsx'),'utf8');
 assert.doesNotMatch(source,/['\"]use client['\"]/);
 assert.match(source,/robots: \{ index: true, follow: true \}/);
 assert.doesNotMatch(source,/nofollow|sponsored|ugc/);
 assert.match(source,/<a href=\{item\.href\}>/);
 assert.match(source,/title: 'Directory Submissions'/);
 assert.match(source,/Nick Launches'.*submission not yet sent/);
 assert.match(source,/Dang AI'.*Submitted for review/);
 assert.match(source,/SaaSVault'.*temporarily unavailable/);
 assert.doesNotMatch(source,/Directory submission badges/);
 for(const url of ['https://nicklaunches.com/','https://dang.ai/','https://publishyoursaas.com/','https://saasvault.pro/']) assert.match(source,new RegExp(url.replaceAll('.','\\.')));
});

test('image editing guide states the hosted product boundary',()=>{
 const source=readFileSync(resolve('app/moss-image-edit/page.tsx'),'utf8');
 const earlyAccess=readFileSync(resolve('app/image-editing-early-access/page.tsx'),'utf8');
 assert.match(source,/does not accept an uploaded image for editing/);
 assert.match(source,/ComfyUI pull request #17296/);
 for(const page of [source,earlyAccess]){
  assert.match(page,/models\/model_patches\//);
  assert.match(page,/models\/loras\//);
  assert.match(page,/Do not mix the two loading paths/);
 }
 assert.doesNotMatch(source,/pixel-exact/);
});

test('blog publishes six distinct, source-backed long-form pages',()=>{
 assert.equal(blogPosts.length,6);
 assert.equal(new Set(blogPosts.map(post=>post.slug)).size,6);
 assert.equal(new Set(blogPosts.map(post=>post.title)).size,6);
 for(const post of blogPosts){
  assert.ok(post.title.length<=60,`${post.slug} title is ${post.title.length} characters`);
  assert.ok(post.description.length<=155,`${post.slug} description is ${post.description.length} characters`);
  assert.ok(existsSync(resolve(`public${post.cover}`)),`${post.slug} cover is missing`);
  if(post.body) assert.ok(post.body.split(/\s+/).length>=1000,`${post.slug} needs long-form depth`);
 }
 const urls=sitemap().map(entry=>entry.url);
 assert.ok(urls.includes('https://mossimage.run/blog/'));
 for(const post of blogPosts) assert.ok(urls.includes(`https://mossimage.run/blog/${post.slug}/`));
});
