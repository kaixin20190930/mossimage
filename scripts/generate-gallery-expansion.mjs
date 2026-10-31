import { fal } from '@fal-ai/client';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const layout = (caption, items) => JSON.stringify({ summary: { caption }, items, bbox_format: 'yxyx', bbox_coord_space: 'abs_centralized' }, null, 2);
const specs = [
  { id:'g13', label:'BILINGUAL TEXT', title:'Autumn tea invitation', seed:2026102613, prompt:'An elegant invitation card on warm ivory paper with pressed autumn leaves. Large Chinese heading reads exactly: "秋日茶会". Directly below, the English subtitle reads exactly: "AUTUMN TEA". Bottom details read exactly: "NOV 8 · 3 PM" and "Garden Room". Refined serif typography, generous spacing, soft window light.' },
  { id:'g14', label:'BILINGUAL TEXT', title:'Mountain tea package', seed:2026102614, prompt:'A premium green tea package standing on pale stone. The label has the Chinese brand name "山野茶" in bold brush lettering and the English name "MOUNTAIN TEA" below it. A small line reads exactly: "SPRING HARVEST". Forest green and warm cream palette, clean product photography, soft diffused light.' },
  { id:'g15', label:'JSON LAYOUT', title:'A thoughtful desk layout', seed:2026102615, mode:'layout', prompt:layout('An overhead editorial scene on a warm oak desk with a notebook, coffee cup, small fern, and pencil arranged with calm negative space.',[
    {label:'object',caption:'Open cream notebook with blank pages in the left half',bbox:[-340,-430,260,-40]},
    {label:'object',caption:'White ceramic coffee cup seen from above in the upper right',bbox:[-380,100,-80,400]},
    {label:'object',caption:'Small green fern in the lower right corner',bbox:[80,120,430,430]},
    {label:'object',caption:'Single wooden pencil placed diagonally near the center',bbox:[-80,-80,260,100]},
  ])},
  { id:'g16', label:'JSON LAYOUT', title:'Independent magazine cover', seed:2026102616, mode:'layout', prompt:layout('A modern independent magazine cover with an architectural photograph, deep green typography, and restrained editorial spacing.',[
    {label:'text',caption:'Large magazine masthead across the top',text:'FIELD NOTES',bbox:[-440,-440,-330,440]},
    {label:'object',caption:'Minimal concrete house surrounded by tall grass in the center',bbox:[-290,-390,300,390]},
    {label:'text',caption:'Small issue line at lower left',text:'ISSUE 07 · AUTUMN',bbox:[330,-410,400,-40]},
    {label:'text',caption:'Short cover line at lower right',text:'QUIET SPACES',bbox:[330,40,410,410]},
  ])},
  { id:'g17', label:'MENU CONCEPT', title:'Izakaya menu concept', seed:2026102617, prompt:'A Japanese izakaya menu on textured cream paper, photographed straight on. Heading reads exactly: "夜の献立" with "NIGHT MENU" below. Three items read exactly: "Yakitori 8", "Gyoza 7", "Soba 12". Small red seal stamp, black ink typography, balanced vertical spacing, warm restaurant light.' },
  { id:'g18', label:'MENU CONCEPT', title:'Cocktail list concept', seed:2026102618, prompt:'A sophisticated cocktail menu card on a dark walnut bar. Heading reads exactly: "SIGNATURE COCKTAILS". Four lines read exactly: "Moss Garden 14", "Amber Hour 15", "Night Bloom 16", "Quiet River 14". Pale gold serif lettering, prices aligned right, subtle botanical border, moody bar lighting.' },
  { id:'g19', label:'PRODUCT LABEL', title:'Forest candle label', seed:2026102619, prompt:'An amber glass candle jar on a limestone shelf. Its cream label reads exactly: "FOREST AFTER RAIN", then "CEDAR · MOSS · VETIVER", and at the bottom "8 OZ / 226 G". All wording centered and readable, understated botanical line art, soft studio product photography.' },
  { id:'g20', label:'PRODUCT LABEL', title:'Jasmine tea tin', seed:2026102620, prompt:'A matte ivory tea tin on a pale green surface. The front label reads exactly in Chinese: "茉莉春茶" and below in English: "JASMINE SPRING TEA". A small line reads exactly: "LOOSE LEAF · 80 G". Delicate jasmine illustration, refined green typography, clean catalog lighting.' },
  { id:'g21', label:'EVENT POSTER', title:'Riverside music poster', seed:2026102621, prompt:'A bold outdoor music festival poster with a twilight blue gradient and abstract river shapes. Heading reads exactly: "RIVER SOUND". Details read exactly: "NOV 14 · 6 PM", "RIVERSIDE STAGE", and "FREE ENTRY". High-contrast modern sans-serif, screen-print texture, clear hierarchy.' },
  { id:'g22', label:'EVENT POSTER', title:'Bilingual exhibition poster', seed:2026102622, prompt:'A minimalist exhibition opening poster on off-white paper. Large Chinese title reads exactly: "留白之间". English subtitle reads exactly: "BETWEEN SPACES". Lower details read exactly: "OPENING 18:00" and "NORTH GALLERY". Black and moss-green typography, one red geometric circle, Swiss editorial layout.' },
  { id:'g23', label:'ILLUSTRATION', title:'The lantern library', seed:2026102623, prompt:'A gentle editorial illustration of a tiny woodland library inside an old hollow tree, shelves of miniature books, warm paper lanterns, a fox reading beside a round window, ferns and moss outside, soft gouache texture, quiet storybook atmosphere, no text.' },
  { id:'g24', label:'ILLUSTRATION', title:'Rain over the old city', seed:2026102624, prompt:'A poetic editorial illustration of an old hillside city in light rain, narrow stone steps, green awnings, glowing shop windows reflected on wet pavement, a lone person carrying a transparent umbrella, muted teal and amber palette, soft ink and watercolor texture, no text.' },
  { id:'g25', label:'INFOGRAPHIC', title:'Pour-over coffee steps', seed:2026102825, generatedOn:'2026-10-28', prompt:'A clean square infographic on warm ivory paper. Heading reads exactly: "POUR OVER". Four numbered steps read exactly: "1 RINSE", "2 BLOOM", "3 POUR", "4 SERVE". Each step has one simple line icon: filter, coffee grounds, kettle, cup. Dark green sans-serif text, generous spacing, four clearly separated cards, no extra wording.' },
  { id:'g26', label:'INFOGRAPHIC', title:'Project snapshot cards', seed:2026102826, generatedOn:'2026-10-28', prompt:'A modern square project dashboard infographic on a deep navy background. Heading reads exactly: "PROJECT SNAPSHOT". Three large statistic cards read exactly: "24 TASKS", "8 COMPLETE", and "3 IN REVIEW". Small footer reads exactly: "SAMPLE DATA". Pale blue and white typography, three simple geometric icons, clean grid, no extra wording.' },
  { id:'g27', label:'INFOGRAPHIC', title:'City bike comparison', seed:2026102827, generatedOn:'2026-10-28', prompt:'A clean square comparison infographic titled exactly: "CITY BIKE GUIDE". Two side-by-side columns. Left heading reads exactly: "ELECTRIC" with three rows: "MOTOR ASSIST", "HEAVIER", "CHARGE". Right heading reads exactly: "CLASSIC" with three rows: "PEDAL POWER", "LIGHTER", "NO CHARGE". Simple bicycle icons, moss green and warm gray palette, crisp readable sans-serif, no extra wording.' },
  { id:'g28', label:'INFOGRAPHIC', title:'Margherita recipe card', seed:2026102828, generatedOn:'2026-10-28', prompt:'A warm square recipe infographic titled exactly: "MARGHERITA PIZZA". Left panel heading reads "INGREDIENTS" with five short lines: "DOUGH", "TOMATO", "MOZZARELLA", "BASIL", "OLIVE OIL". Right panel has three numbered steps: "1 STRETCH", "2 TOP", "3 BAKE". Footer reads exactly: "20 MIN · SERVES 2". Cream paper, tomato red and basil green accents, simple food icons, no extra wording.' },
  { id:'g29', label:'QUOTE CARD', title:'Great work quote card', seed:2026102829, generatedOn:'2026-10-28', prompt:'A minimalist square quote card on a warm white background. Centered black serif text reads exactly: "The only way to do great work is to love what you do." A separate attribution line below reads exactly: "— Steve Jobs". Fine moss-green rule, generous margins, understated editorial typography, no extra wording.' },
  { id:'g30', label:'QUOTE CARD', title:'True places quote card', seed:2026102830, generatedOn:'2026-10-28', prompt:'A square literary quote card on softly aged cream paper. Dark brown serif text reads exactly: "It is not down on any map; true places never are." A separate attribution line reads exactly: "— Herman Melville, Moby-Dick". Subtle map-line texture around the edges, centered composition, no extra wording.' },
  { id:'g31', label:'QUOTE CARD', title:'Open possibilities card', seed:2026102831, generatedOn:'2026-10-28', prompt:'A square dark green technology quote card with a subtle gradient and thin geometric grid. Large centered sans-serif text reads exactly: "Readable text. Structured layouts. Open possibilities." A small attribution line reads exactly: "— MossImage Studio". High contrast ivory lettering, calm premium composition, no extra wording.' },
];

if (specs.length !== 19) throw new Error('The controlled gallery must contain exactly 19 expansion images.');
const estimatedCostUsd = specs.length * 0.052;

function readVars(source) {
  return Object.fromEntries(source.split(/\r?\n/).filter(line => line && !line.startsWith('#') && line.includes('=')).map(line => {
    const at = line.indexOf('='); let value = line.slice(at + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [line.slice(0, at).trim(), value];
  }));
}

const root = process.cwd();
const recordDir = resolve(root, 'artifacts/gallery-expansion');
const rawDir = resolve(recordDir, 'raw');
const publicDir = resolve(root, 'public/images/gallery');
const manifestPath = resolve(recordDir, 'manifest.json');
await mkdir(rawDir, { recursive: true }); await mkdir(publicDir, { recursive: true });
const vars = readVars(await readFile(resolve(root, '.dev.vars'), 'utf8'));
if (!vars.FAL_KEY) throw new Error('FAL_KEY is missing from .dev.vars');
fal.config({ credentials: vars.FAL_KEY });
let manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : { generatedOn:'2026-10-26', estimatedCostUsd, images:{} };
manifest.estimatedCostUsd = estimatedCostUsd;
const pending = specs.filter(spec => manifest.images[spec.id]?.status !== 'complete' || !existsSync(resolve(publicDir,`${spec.id}.webp`)));
const estimatedRunCostUsd = pending.length * 0.052;
if (estimatedRunCostUsd > 0.40) throw new Error(`Estimated run cost $${estimatedRunCostUsd.toFixed(3)} exceeds the $0.40 guardrail.`);
console.log(`pending=${pending.length} estimated_run_cost_usd=${estimatedRunCostUsd.toFixed(3)}`);
const save = async () => { const tmp=`${manifestPath}.tmp`; await writeFile(tmp,`${JSON.stringify(manifest,null,2)}\n`); await rename(tmp,manifestPath); };
const wait = async requestId => { const end=Date.now()+10*60_000; while(Date.now()<end){ const status=await fal.queue.status('fal-ai/moss-image',{requestId,logs:false}); if(status.status==='COMPLETED') return fal.queue.result('fal-ai/moss-image',{requestId}); if(!['IN_QUEUE','IN_PROGRESS'].includes(status.status)) throw new Error(`${requestId} ended with ${status.status}`); await new Promise(r=>setTimeout(r,3000)); } throw new Error(`${requestId} timed out; it was not resubmitted.`); };

for (const spec of specs) {
  let record=manifest.images[spec.id]; const output=resolve(publicDir,`${spec.id}.webp`);
  if(record?.status==='complete'&&existsSync(output)){ console.log(`${spec.id}: already complete`); continue; }
  const input={prompt:spec.prompt,image_size:{width:1024,height:1024},seed:spec.seed,num_images:1,num_inference_steps:50,guidance_scale:3,enable_prompt_expansion:spec.mode!=='layout',enable_safety_checker:true,output_format:'png'};
  if(!record?.requestId){ const submitted=await fal.queue.submit('fal-ai/moss-image',{input}); record=manifest.images[spec.id]={...spec,mode:spec.mode||'text',model:'MOSS-Image SFT',input,requestId:submitted.request_id,status:'submitted',generatedOn:spec.generatedOn||'2026-10-26',cropped:false}; await save(); console.log(`${spec.id}: submitted ${submitted.request_id}`); }
  const result=await wait(record.requestId); const image=result.data.images?.[0]; if(!image?.url) throw new Error(`${spec.id}: provider returned no image URL`);
  const response=await fetch(image.url); if(!response.ok) throw new Error(`${spec.id}: image download HTTP ${response.status}`);
  const rawPath=resolve(rawDir,`${spec.id}.png`); await writeFile(rawPath,Buffer.from(await response.arrayBuffer()));
  const webpQuality = spec.id === 'g24' ? 35 : spec.id === 'g23' ? 45 : 70;
  await sharp(rawPath).webp({quality:webpQuality,effort:6}).toFile(output);
  Object.assign(record,{status:'complete',outputSeed:result.data.seed,rawPath:`artifacts/gallery-expansion/raw/${spec.id}.png`,publicPath:`/images/gallery/${spec.id}.webp`,convertedToWebp:true}); await save(); console.log(`${spec.id}: saved`);
}
