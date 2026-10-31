import { fal } from '@fal-ai/client';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const prompts = {
  m1: `A café menu card standing on a light oak table, soft window light from the left. Cream card stock with dark green serif headings. Heading reads exactly: "MORNING MENU". Below it four lines read exactly: "Espresso 3.50", "Flat White 4.20", "Butter Croissant 3.80", "Avocado Toast 8.50". Prices are right-aligned in one column. All text spelled correctly and fully readable.`,
  m2: `A restaurant menu held flat, warm cream paper with a thin gold border. The heading reads exactly in Chinese: "午市套餐" and directly below it in English: "LUNCH SET". Three rows read exactly: "宫保鸡丁 Kung Pao Chicken 48", "麻婆豆腐 Mapo Tofu 38", "酸辣汤 Hot & Sour Soup 28". Chinese characters are correct and legible, Latin text in a clean sans-serif.`,
  m3: `A black chalkboard drinks menu mounted on a brick wall in a coffee shop, white chalk lettering. Heading reads exactly: "DRINKS". Six lines read exactly in two even columns: "Americano 3.00", "Cappuccino 4.00", "Latte 4.50", "Mocha 5.00", "Matcha Latte 5.50", "Iced Tea 3.50". Chalk texture, neat alignment, prices right-aligned within each column.`,
  m4: `A bakery menu board behind a glass display case, kraft-paper texture. Heading reads exactly: "TODAY'S BREAD". Four lines read exactly: "Sourdough Loaf 7.00", "Baguette 3.50", "Cinnamon Roll 4.25", "Almond Croissant 4.75". Handwritten style lettering, every price right-aligned.`,
  m5: `A honey jar on a white marble surface, kraft paper label with small print. The label front reads exactly: "WILDFLOWER HONEY", directly below "Raw & Unfiltered", and a small bottom line "Net Wt. 12 oz (340 g)". All label text is fully legible, correctly spelled, and follows the label curve.`,
  m6: `A vertical event poster pinned on a corkboard. Top heading reads exactly in Chinese: "周末市集", with English directly below: "WEEKEND MARKET". Middle text reads exactly: "Sat 10:00–18:00", "Riverside Park", "Free entry". A bottom line reads exactly in Chinese: "免费入场". Bold sans-serif, high contrast.`,
};

const specs = [
  ...Object.keys(prompts).map((id, index) => ({ id, promptId: id, model: 'moss', seed: 2026102601 + index })),
  { id: 'f1', promptId: 'm1', model: 'flux', seed: 2026102601 },
  { id: 'f2', promptId: 'm5', model: 'flux', seed: 2026102605 },
  { id: 'f3', promptId: 'm6', model: 'flux', seed: 2026102606 },
];

const root = process.cwd();
const recordDir = resolve(root, 'artifacts/eval-images');
const rawDir = resolve(recordDir, 'raw');
const publicDir = resolve(root, 'public/images/evaluation');
const manifestPath = resolve(recordDir, 'manifest.json');

function readVars(source) {
  return Object.fromEntries(source.split(/\r?\n/).filter(line => line && !line.startsWith('#') && line.includes('=')).map(line => {
    const at = line.indexOf('=');
    let value = line.slice(at + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [line.slice(0, at).trim(), value];
  }));
}

async function saveManifest(manifest) {
  const temporary = `${manifestPath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(temporary, manifestPath);
}

async function waitForResult(endpoint, requestId) {
  const deadline = Date.now() + 10 * 60_000;
  while (Date.now() < deadline) {
    const status = await fal.queue.status(endpoint, { requestId, logs: false });
    if (status.status === 'COMPLETED') return fal.queue.result(endpoint, { requestId });
    if (status.status !== 'IN_QUEUE' && status.status !== 'IN_PROGRESS') throw new Error(`Request ${requestId} ended with status ${status.status}`);
    await new Promise(resolveWait => setTimeout(resolveWait, 3000));
  }
  throw new Error(`Timed out waiting for ${requestId}; the request was not resubmitted.`);
}

await mkdir(rawDir, { recursive: true });
await mkdir(publicDir, { recursive: true });
const vars = readVars(await readFile(resolve(root, '.dev.vars'), 'utf8'));
if (!vars.FAL_KEY) throw new Error('FAL_KEY is missing from .dev.vars');
fal.config({ credentials: vars.FAL_KEY });

const requested = new Set(process.argv.slice(2).filter(value => !value.startsWith('-')));
const selected = requested.size ? specs.filter(spec => requested.has(spec.id)) : specs;
if (!selected.length) throw new Error('No matching image IDs. Use m1-m6 or f1-f3.');

let manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : { generatedAt: '2026-10-26', images: {} };

for (const spec of selected) {
  const endpoint = spec.model === 'moss' ? 'fal-ai/moss-image' : 'fal-ai/flux/dev';
  const input = spec.model === 'moss' ? {
    prompt: prompts[spec.promptId], image_size: { width: 1024, height: 1024 }, seed: spec.seed,
    num_images: 1, num_inference_steps: 50, guidance_scale: 3, enable_prompt_expansion: false,
    enable_safety_checker: true, output_format: 'png',
  } : {
    prompt: prompts[spec.promptId], image_size: { width: 1024, height: 1024 }, seed: spec.seed,
    num_images: 1, num_inference_steps: 28, guidance_scale: 3.5, acceleration: 'none',
    enable_safety_checker: true, output_format: 'png',
  };
  let record = manifest.images[spec.id];
  if (record?.status === 'complete' && existsSync(resolve(root, 'public', record.publicPath.slice(1)))) {
    console.log(`${spec.id}: already complete`);
    continue;
  }
  if (!record?.requestId) {
    const submitted = await fal.queue.submit(endpoint, { input });
    record = manifest.images[spec.id] = { id: spec.id, promptId: spec.promptId, model: spec.model === 'moss' ? 'MOSS-Image SFT' : 'FLUX.1 dev', endpoint, seed: spec.seed, prompt: prompts[spec.promptId], input, requestId: submitted.request_id, status: 'submitted', generatedOn: '2026-10-26', cropped: false };
    await saveManifest(manifest);
    console.log(`${spec.id}: submitted ${submitted.request_id}`);
  }
  const result = await waitForResult(endpoint, record.requestId);
  const data = result.data;
  const image = data.images?.[0];
  if (!image?.url) throw new Error(`${spec.id}: provider returned no image URL`);
  record.status = 'generated';
  record.outputSeed = data.seed;
  record.actualPrompt = data.actual_prompt || data.prompt || prompts[spec.promptId];
  record.providerImage = { width: image.width || 1024, height: image.height || 1024, contentType: image.content_type || 'image/png' };
  await saveManifest(manifest);
  const response = await fetch(image.url);
  if (!response.ok) throw new Error(`${spec.id}: image download HTTP ${response.status}`);
  const rawPath = resolve(rawDir, `${spec.id}.png`);
  await writeFile(rawPath, Buffer.from(await response.arrayBuffer()));
  const publicPath = `/images/evaluation/${spec.id}.webp`;
  await sharp(rawPath).webp({ quality: 84, effort: 6 }).toFile(resolve(root, 'public', publicPath.slice(1)));
  record.rawPath = `artifacts/eval-images/raw/${spec.id}.png`;
  record.publicPath = publicPath;
  record.convertedToWebp = true;
  record.status = 'complete';
  await saveManifest(manifest);
  console.log(`${spec.id}: saved ${publicPath}`);
}
