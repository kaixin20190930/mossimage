import { z } from 'zod';
export const sizes = {
  square: { width: 1024, height: 1024, label: 'Square', ratio: '1:1' },
  // Keep every canvas close to one megapixel so one image always costs one credit.
  portrait: { width: 832, height: 1248, label: 'Portrait', ratio: '2:3' },
  landscape: { width: 1248, height: 832, label: 'Landscape', ratio: '3:2' },
} as const;
export const generationSchema = z.object({
  intentId: z.string().uuid().optional(),
  prompt: z.string().trim().min(3, 'Describe your image in at least 3 characters.').max(6000),
  size: z.enum(['square', 'portrait', 'landscape']),
  mode: z.enum(['text', 'layout']),
  seed: z.number().int().min(0).max(2147483647).optional(),
  // These are the two sampling controls exposed by the hosted fal.ai API.
  // Narrow bounds keep shared URLs from becoming unbounded compute requests.
  guidanceScale: z.number().min(1).max(6).optional(),
  steps: z.number().int().min(4).max(50).optional(),
}).strict();
export const layoutSchema = z.object({
  summary: z.object({ caption: z.string().min(3) }).passthrough(),
  items: z.array(z.object({ label: z.enum(['text', 'object']), caption: z.string().min(1), text: z.string().optional(), bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]) })).min(1).max(50),
  bbox_format: z.literal('yxyx'), bbox_coord_space: z.literal('abs_centralized'),
});
export function validateLayout(prompt: string, size: keyof typeof sizes) {
  let json: unknown;
  try { json = JSON.parse(prompt); } catch { throw new Error('Enter valid JSON before generating.'); }
  const parsed = layoutSchema.safeParse(json);
  if (!parsed.success) throw new Error('Layout needs summary.caption, items, bbox_format="yxyx" and bbox_coord_space="abs_centralized".');
  const { width, height } = sizes[size];
  for (const item of parsed.data.items) {
    const [y1, x1, y2, x2] = item.bbox;
    if (y1 >= y2 || x1 >= x2 || y1 < -height / 2 || y2 > height / 2 || x1 < -width / 2 || x2 > width / 2) throw new Error('Each bounding box must fit the selected canvas and have positive width and height.');
    if (item.label === 'text' && !item.text?.trim()) throw new Error('Text items need a non-empty text value.');
  }
  return parsed.data;
}
export const layoutExample = JSON.stringify({ summary: { caption: 'An editorial botanical poster on ivory paper, deep green lettering and a small fern illustration.' }, items: [{ label: 'text', caption: 'Large serif title in the upper half', text: 'GROW SLOW', bbox: [-400, -420, -180, 420] }, { label: 'object', caption: 'A finely detailed green fern in the lower half', bbox: [-100, -280, 430, 280] }], bbox_format: 'yxyx', bbox_coord_space: 'abs_centralized' }, null, 2);
