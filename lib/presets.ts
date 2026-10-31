export const presets = {
  photoreal: {
    name: 'Product Photography',
    heading: 'MOSS-Image Product Photography Preset',
    title: 'MOSS-Image Product Photography Preset — CFG 3, 50 Steps',
    description: 'Start a MOSS-Image SFT product-photography prompt with the hosted reference settings: CFG 3, 50 steps, and a fixed-size canvas.',
    intro: 'A restrained starting point for product labels, still life, and catalog-style scenes. The preset applies CFG 3 and 50 steps to the hosted SFT endpoint.',
    imageIds: ['still-life', 'm5', 'g19'],
    formula: ['Describe one hero object and its material', 'Name the surface, background, and light direction', 'Keep visible label text short and proofread it'],
    guideHref: '/guide/prompt/',
  },
  poster: {
    name: 'Poster',
    heading: 'MOSS-Image Poster Preset',
    title: 'MOSS-Image Poster Preset — Text, Layout, CFG 3',
    description: 'Open a tested MOSS-Image SFT poster prompt with CFG 3 and 50 steps, then refine the wording or switch to JSON layout guidance.',
    intro: 'Use this preset for event posters and bilingual headlines. Keep visible wording short, proofread the result, and move to JSON layout when regions matter.',
    imageIds: ['jazz-poster', 'm6', 'g22'],
    formula: ['Quote the exact headline and supporting text', 'State the type hierarchy and contrast', 'Use JSON layout when regions must stay separate'],
    guideHref: '/guide/json-layout/',
  },
  menu: {
    name: 'Menu',
    heading: 'MOSS-Image Menu Preset',
    title: 'MOSS-Image Menu Preset — Readable Text, CFG 3',
    description: 'Open a tested café-menu prompt with MOSS-Image SFT, CFG 3, and 50 steps. Review prices and wording before using the image.',
    intro: 'A practical starting point for café and restaurant menu concepts. Fewer, shorter lines are easier to review than a dense production menu.',
    imageIds: ['bilingual-menu', 'm1', 'g18'],
    formula: ['Limit the first draft to a short heading and a few items', 'Quote every item name and price exactly', 'Ask for aligned columns, then proofread all wording'],
    guideHref: '/text-in-image-generator/',
  },
  'product-label': {
    name: 'Product Label',
    heading: 'MOSS-Image Product Label Preset',
    title: 'MOSS-Image Product Label Generator — JSON Layout Preset',
    description: 'Generate product-label concepts with MOSS-Image SFT. Start from tested prompts for brand names, product details, and optional JSON layout guidance.',
    intro: 'A tested starting point for packaging and label concepts. Keep the brand, product name, descriptor, and net-weight line in separate short regions, then proofread every character.',
    imageIds: ['m5', 'g19', 'g20', 'g14'],
    formula: ['Name the container, surface, and label material', 'Quote the brand, product name, descriptor, and net weight separately', 'Use broad non-overlapping regions and proofread before production'],
    guideHref: '/text-in-image-generator/',
  },
  infographic: {
    name: 'Infographic',
    heading: 'MOSS-Image Infographic Preset',
    title: 'AI Infographic Generator — Info Cards with MOSS-Image',
    description: 'Generate infographics with readable labels, data points, and icons. Explore process steps, stat cards, comparisons, and recipes from real MOSS-Image outputs.',
    intro: 'A tested starting point for information graphics with short labels, numbers, and icons. Use it for process steps, sample stat cards, simple comparisons, and recipe cards, then proofread every element.',
    imageIds: ['g25', 'g26', 'g27', 'g28'],
    formula: ['Name the subject and the layout pattern, such as four steps or two columns', 'Quote every heading, label, and data point exactly as it should appear', 'Keep the first draft concise, use clear visual groups, and proofread the result'],
    guideHref: '/guide/json-layout/',
  },
  'quote-card': {
    name: 'Quote Card',
    heading: 'MOSS-Image Quote Card Preset',
    title: 'AI Quote Card Generator — Social Graphics with MOSS-Image',
    description: 'Turn a quote, book excerpt, or product message into a shareable social card with readable attribution text. Start from real MOSS-Image prompts.',
    intro: 'A focused starting point for one quotation or product message, one attribution line, and a visual style. Keep the wording concise and always compare the generated lettering with the source.',
    imageIds: ['g29', 'g30', 'g31'],
    formula: ['Put the exact quote or message in quotation marks', 'Give the attribution its own line and quote it separately', 'Name one visual direction, keep the wording concise, and proofread before sharing'],
    guideHref: '/guide/prompt/',
  },
} as const;

export type PresetSlug = keyof typeof presets;

export function isPresetSlug(value: string): value is PresetSlug {
  return value in presets;
}
