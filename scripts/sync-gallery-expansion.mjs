import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifest = JSON.parse(await readFile(resolve('artifacts/gallery-expansion/manifest.json'), 'utf8'));
const details = {
  g13:['Ivory bilingual invitation card reading 秋日茶会 and AUTUMN TEA with autumn leaves','bilingual invitation generator'],
  g14:['Green tea package labeled 山野茶, MOUNTAIN TEA and SPRING HARVEST','bilingual product packaging'],
  g15:['Overhead desk scene with notebook, coffee, pencil and fern arranged by JSON layout','json layout image generator'],
  g16:['FIELD NOTES magazine cover with a modern house and structured editorial typography','json magazine layout'],
  g17:['Japanese izakaya menu headed 夜の献立 and NIGHT MENU with three dishes','japanese menu image generator'],
  g18:['Dark cocktail menu listing four signature drinks with aligned prices','cocktail menu generator'],
  g19:['Amber candle jar labeled FOREST AFTER RAIN on a limestone shelf','candle label generator'],
  g20:['Ivory tea tin labeled 茉莉春茶 and JASMINE SPRING TEA','tea packaging generator'],
  g21:['Blue RIVER SOUND outdoor music festival poster with date and venue','music festival poster generator'],
  g22:['Minimal bilingual exhibition poster reading 留白之间 and BETWEEN SPACES','bilingual exhibition poster'],
  g23:['Storybook illustration of a fox reading inside a lantern-lit tree library','storybook illustration generator'],
  g24:['Watercolor illustration of a rainy hillside city with glowing windows','editorial illustration generator'],
  g25:['Pour-over coffee infographic with four numbered steps and matching line icons','coffee process infographic generator'],
  g26:['Project snapshot infographic with three sample statistic cards on a navy grid','stat card infographic generator'],
  g27:['City bike comparison infographic with electric and classic bike columns','comparison infographic generator'],
  g28:['Margherita pizza recipe infographic with ingredients, steps, time and serving count','recipe infographic generator'],
  g29:['Minimal white quote card with a Steve Jobs quotation and attribution','ai quote card generator'],
  g30:['Vintage paper quote card with a Herman Melville quotation and attribution','book quote card generator'],
  g31:['Dark green MossImage Studio message card with high-contrast typography','social quote graphic generator'],
};
const images = Object.values(manifest.images).sort((a,b)=>a.id.localeCompare(b.id)).map(record => ({
  id:record.id, src:record.publicPath, alt:details[record.id][0], title:record.title,
  prompt:record.prompt, mode:record.mode, size:'square', seed:record.outputSeed ?? record.seed,
  label:record.label, intent:details[record.id][1], featured:false, model:'MOSS-Image SFT',
  settings:`1024×1024 · 50 steps · CFG 3 · ${record.mode === 'layout' ? 'JSON layout · prompt expansion off' : 'prompt expansion on'}`,
  generatedOn:record.generatedOn === '2026-10-28' ? 'October 28, 2026' : 'October 26, 2026', cropped:false,
}));
await writeFile(resolve('lib/gallery-expansion.ts'), `// Generated from the controlled gallery manifest.\nexport const galleryExpansion = ${JSON.stringify(images,null,2)} as const;\n`);
