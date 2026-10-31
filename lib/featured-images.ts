import { galleryExpansion } from './gallery-expansion';

export type FeaturedImage = {
  id: string;
  src: string;
  alt: string;
  title: string;
  prompt: string;
  mode: 'text' | 'layout';
  size: 'square';
  seed: number;
  label: 'BILINGUAL TEXT' | 'JSON LAYOUT' | 'VISUAL QUALITY' | 'MENU CONCEPT' | 'PRODUCT LABEL' | 'EVENT POSTER' | 'ILLUSTRATION' | 'INFOGRAPHIC' | 'QUOTE CARD';
  intent: string;
  featured: boolean;
  model?: string;
  settings?: string;
  generatedOn?: string;
  cropped?: boolean;
};

const botanicalLayout = JSON.stringify({
  summary: {
    caption: 'An editorial botanical poster on ivory textured paper, deep forest green lettering and a finely detailed fern illustration.',
  },
  items: [
    { label: 'text', caption: 'Large serif title in the upper portion in forest green', text: 'GROW SLOW', bbox: [-400, -420, -180, 420] },
    { label: 'text', caption: 'Small subtitle below the title in matching green', text: 'a botanical study', bbox: [-160, -380, -60, 380] },
    { label: 'object', caption: 'A finely detailed green fern with delicate fronds in the lower half', bbox: [-80, -280, 420, 280] },
  ],
  bbox_format: 'yxyx',
  bbox_coord_space: 'abs_centralized',
}, null, 2);

const productLayout = JSON.stringify({
  summary: {
    caption: 'A clean product showcase on a warm beige background, three amber glass skincare bottles with white labels arranged in a row, soft studio lighting, 1024×1024',
  },
  items: [
    { label: 'text', caption: 'Brand name centered at the top in elegant serif', text: 'BOTANICA', bbox: [-440, -300, -370, 300] },
    { label: 'text', caption: 'Tagline below the brand name in smaller type', text: 'pure botanical skincare', bbox: [-350, -260, -290, 260] },
    { label: 'object', caption: 'Three amber glass dropper bottles with white labels, evenly spaced from left to right, soft reflections', bbox: [-200, -400, 400, 400] },
  ],
  bbox_format: 'yxyx',
  bbox_coord_space: 'abs_centralized',
}, null, 2);

const originalTextSettings = {
  model: 'MOSS-Image SFT',
  settings: '1024×1024 · 50 steps · prompt expansion on',
  generatedOn: 'October 24, 2026',
  cropped: false,
} as const;

const originalLayoutSettings = {
  model: 'MOSS-Image SFT',
  settings: '1024×1024 · 50 steps · JSON layout · prompt expansion off',
  generatedOn: 'October 24, 2026',
  cropped: false,
} as const;

export const featuredImages: readonly FeaturedImage[] = [
  {
    id: 'bilingual-menu',
    src: '/images/featured/bilingual-menu.webp',
    alt: 'Cream café menu with the Chinese heading 今日特调 and English text TODAY’S SPECIAL',
    title: 'A bilingual café menu',
    prompt: 'A cream paper café menu card photographed from above on a wooden table, "今日特调" written in elegant serif Chinese at the top in dark brown, "TODAY\'S SPECIAL" in clean sans-serif English below it, a delicate line-drawing of a steaming coffee cup at the bottom, warm natural window light from the left, editorial food photography, 1024×1024',
    mode: 'text', size: 'square', seed: 2026102401,
    label: 'BILINGUAL TEXT', intent: 'chinese ai image generator', featured: true,
    ...originalTextSettings,
  },
  {
    id: 'jazz-poster',
    src: '/images/featured/jazz-poster.webp',
    alt: 'Navy concert poster with glowing Chinese text 午夜爵士, an English date and a golden saxophone',
    title: 'Midnight jazz poster',
    prompt: 'A minimalist concert poster, deep navy blue background, "午夜爵士" in warm glowing neon-style Chinese characters spanning the top third, "MIDNIGHT JAZZ · OCTOBER 26" in small white sans-serif letters centered below, a single golden saxophone silhouette floating beneath the text, atmospheric nightclub mood, 1024×1024',
    mode: 'text', size: 'square', seed: 2026102402,
    label: 'BILINGUAL TEXT', intent: 'ai poster generator', featured: false,
    ...originalTextSettings,
  },
  {
    id: 'botanical-poster',
    src: '/images/featured/botanical-poster.webp',
    alt: 'Ivory botanical poster with GROW SLOW heading, subtitle and a green fern arranged with JSON layout',
    title: 'A botanical layout',
    prompt: botanicalLayout,
    mode: 'layout', size: 'square', seed: 2026102403,
    label: 'JSON LAYOUT', intent: 'json image generator', featured: true,
    ...originalLayoutSettings,
  },
  {
    id: 'product-showcase',
    src: '/images/featured/product-showcase.webp',
    alt: 'Three amber skincare bottles beneath the BOTANICA brand name in a JSON-controlled product layout',
    title: 'A product showcase',
    prompt: productLayout,
    mode: 'layout', size: 'square', seed: 2026102404,
    label: 'JSON LAYOUT', intent: 'ai product image generator', featured: false,
    ...originalLayoutSettings,
  },
  {
    id: 'still-life',
    src: '/images/featured/still-life.webp',
    alt: 'Vintage brass teapot and ceramic tea cup with autumn leaves on a dark wooden table',
    title: 'An autumn still life',
    prompt: 'An editorial still life, a vintage brass teapot on a dark wooden table beside a small ceramic cup half-filled with tea, a few autumn maple leaves scattered across the surface, soft afternoon window light from the left casting long gentle shadows, warm amber and copper tones, shallow depth of field, 1024×1024',
    mode: 'text', size: 'square', seed: 2026102405,
    label: 'VISUAL QUALITY', intent: 'ai image generator', featured: false,
    ...originalTextSettings,
  },
  {
    id: 'bookshop',
    src: '/images/featured/bookshop.webp',
    alt: 'Warm illustrated bookshop with crowded wooden shelves, a rainy round window and a sleeping ginger cat',
    title: 'A rainy-day bookshop',
    prompt: 'A cozy independent bookshop interior, floor-to-ceiling wooden shelves overflowing with colorful books of all sizes, a ginger tabby cat curled up asleep on the wooden counter, warm amber reading lamps casting soft pools of light, a round window showing autumn rain outside, illustrated in a warm whimsical editorial style, 1024×1024',
    mode: 'text', size: 'square', seed: 2026102406,
    label: 'VISUAL QUALITY', intent: 'ai illustration generator', featured: true,
    ...originalTextSettings,
  },
  {
    id: 'm1',
    src: '/images/evaluation/m1.webp',
    alt: 'Cream Morning Menu café card with four readable items and right-aligned prices on a light oak table',
    title: 'Morning café menu',
    prompt: 'A café menu card standing on a light oak table, soft window light from the left. Cream card stock with dark green serif headings. Heading reads exactly: "MORNING MENU". Below it four lines read exactly: "Espresso 3.50", "Flat White 4.20", "Butter Croissant 3.80", "Avocado Toast 8.50". Prices are right-aligned in one column. All text spelled correctly and fully readable.',
    mode: 'text', size: 'square', seed: 2026102601,
    label: 'MENU CONCEPT', intent: 'ai menu image generator', featured: false,
    model: 'MOSS-Image SFT', settings: '1024×1024 · 50 steps · CFG 3 · prompt expansion off', generatedOn: 'October 26, 2026', cropped: false,
  },
  {
    id: 'm2',
    src: '/images/evaluation/m2.webp',
    alt: 'Warm cream bilingual lunch menu headed 午市套餐 and LUNCH SET with three Chinese and English dishes',
    title: 'Bilingual lunch menu',
    prompt: 'A restaurant menu held flat, warm cream paper with a thin gold border. The heading reads exactly in Chinese: "午市套餐" and directly below it in English: "LUNCH SET". Three rows read exactly: "宫保鸡丁 Kung Pao Chicken 48", "麻婆豆腐 Mapo Tofu 38", "酸辣汤 Hot & Sour Soup 28". Chinese characters are correct and legible, Latin text in a clean sans-serif.',
    mode: 'text', size: 'square', seed: 2026102602,
    label: 'BILINGUAL TEXT', intent: 'bilingual ai menu generator', featured: false,
    model: 'MOSS-Image SFT', settings: '1024×1024 · 50 steps · CFG 3 · prompt expansion off', generatedOn: 'October 26, 2026', cropped: false,
  },
  {
    id: 'm3',
    src: '/images/evaluation/m3.webp',
    alt: 'Black chalkboard drinks menu with six readable café drinks and aligned prices',
    title: 'Chalkboard drinks menu',
    prompt: 'A black chalkboard drinks menu mounted on a brick wall in a coffee shop, white chalk lettering. Heading reads exactly: "DRINKS". Six lines read exactly in two even columns: "Americano 3.00", "Cappuccino 4.00", "Latte 4.50", "Mocha 5.00", "Matcha Latte 5.50", "Iced Tea 3.50". Chalk texture, neat alignment, prices right-aligned within each column.',
    mode: 'text', size: 'square', seed: 2026102603,
    label: 'MENU CONCEPT', intent: 'cafe menu generator', featured: false,
    model: 'MOSS-Image SFT', settings: '1024×1024 · 50 steps · CFG 3 · prompt expansion off', generatedOn: 'October 26, 2026', cropped: false,
  },
  {
    id: 'm4',
    src: '/images/evaluation/m4.webp',
    alt: 'Kraft-paper bakery menu board reading Today’s Bread with four breads and prices',
    title: 'Bakery menu board',
    prompt: 'A bakery menu board behind a glass display case, kraft-paper texture. Heading reads exactly: "TODAY\'S BREAD". Four lines read exactly: "Sourdough Loaf 7.00", "Baguette 3.50", "Cinnamon Roll 4.25", "Almond Croissant 4.75". Handwritten style lettering, every price right-aligned.',
    mode: 'text', size: 'square', seed: 2026102604,
    label: 'MENU CONCEPT', intent: 'bakery menu generator', featured: false,
    model: 'MOSS-Image SFT', settings: '1024×1024 · 50 steps · CFG 3 · prompt expansion off', generatedOn: 'October 26, 2026', cropped: false,
  },
  {
    id: 'm5',
    src: '/images/evaluation/m5.webp',
    alt: 'Honey jar with a kraft label containing readable Wildflower Honey, Raw and Unfiltered, and net weight text',
    title: 'Wildflower honey label',
    prompt: 'A honey jar on a white marble surface, kraft paper label with small print. The label front reads exactly: "WILDFLOWER HONEY", directly below "Raw & Unfiltered", and a small bottom line "Net Wt. 12 oz (340 g)". All label text is fully legible, correctly spelled, and follows the label curve.',
    mode: 'text', size: 'square', seed: 2026102605,
    label: 'PRODUCT LABEL', intent: 'ai product label generator', featured: false,
    model: 'MOSS-Image SFT', settings: '1024×1024 · 50 steps · CFG 3 · prompt expansion off', generatedOn: 'October 26, 2026', cropped: false,
  },
  {
    id: 'm6',
    src: '/images/evaluation/m6.webp',
    alt: 'Bilingual Weekend Market poster with readable Chinese and English event details pinned to a corkboard',
    title: 'Weekend market poster',
    prompt: 'A vertical event poster pinned on a corkboard. Top heading reads exactly in Chinese: "周末市集", with English directly below: "WEEKEND MARKET". Middle text reads exactly: "Sat 10:00–18:00", "Riverside Park", "Free entry". A bottom line reads exactly in Chinese: "免费入场". Bold sans-serif, high contrast.',
    mode: 'text', size: 'square', seed: 2026102606,
    label: 'EVENT POSTER', intent: 'bilingual ai poster generator', featured: false,
    model: 'MOSS-Image SFT', settings: '1024×1024 · 50 steps · CFG 3 · prompt expansion off', generatedOn: 'October 26, 2026', cropped: false,
  },
  ...galleryExpansion,
] as const;

export function featuredImageById(id: string | null) {
  return featuredImages.find((image) => image.id === id);
}

export function featuredImageHref(id: string) {
  return `/?example=${encodeURIComponent(id)}#studio`;
}
