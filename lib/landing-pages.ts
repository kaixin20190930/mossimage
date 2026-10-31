export const publishedDate = 'October 23, 2026';
export const publishedIsoDate = '2026-10-23';

export const landingPages = {
  prompt: {
    slug: 'guide/prompt',
    title: 'MOSS Image Prompt Guide — Prompting Tips, Builder, Examples',
    description: 'Practical MOSS-Image prompting guide with examples for subjects, lighting, composition, and text placement, plus a prompt builder to try online.',
    heading: 'MOSS Image Prompt Guide and Prompt Builder',
  },
  workflows: {
    slug: 'workflows',
    title: 'MOSS Image ComfyUI Workflows — Free JSON Downloads',
    description: 'Download ready-to-run MOSS-Image ComfyUI workflow JSON for native ComfyUI or the optional HF-directory plugin, mirrored from official sources.',
    heading: 'MOSS-Image ComfyUI Workflow',
  },
  free: {
    slug: 'free',
    title: 'MOSS Image Generator Free — 3 Images, No Credit Card',
    description: 'Try MOSS-Image free with three starter images, Chinese and English lettering, JSON layout control, and no watermark. No credit card required.',
    heading: 'Try MOSS Image Generator Free',
  },
  flux: {
    slug: 'compare/flux',
    title: 'MOSS-Image vs FLUX — Text Rendering and Layout Compared',
    description: 'Compare MOSS-Image SFT and FLUX.1 dev with the same prompts, seeds, and image size across menu text, product labels, and bilingual posters.',
    heading: 'MOSS-Image vs FLUX',
  },
  baseVsSft: {
    slug: 'compare/base-vs-sft',
    title: 'MOSS-Image Base vs SFT — Differences & Vertical Stripe Fix',
    description: 'Compare MOSS-Image Base and SFT for text, JSON layouts, licensing, and ComfyUI. Includes vertical stripe fixes with DeStripe LoRA and DeBand.',
    heading: 'MOSS-Image Base vs SFT: Differences and the Vertical Stripe Fix',
  },
  chinese: {
    slug: 'chinese-ai-image-generator',
    title: 'Chinese AI Image Generator — Render 中文 & English Text',
    description: 'Create images with readable Chinese and English text. Type 中文 prompts, mix both languages in one image, and guide text placement with JSON layouts.',
    heading: 'Chinese AI Image Generator',
  },
  jsonLayout: {
    slug: 'guide/json-layout',
    title: 'MOSS-Image JSON Layout Guide — Bbox Syntax & Templates',
    description: 'Learn the MOSS-Image JSON layout format, yxyx bounding boxes, centered coordinates, working templates, validation rules, and common mistakes.',
    heading: 'MOSS-Image JSON Layout Guide',
  },
  jsonLayoutGenerator: {
    slug: 'json-layout',
    title: 'JSON Layout Image Generator — Visual Bbox Editor',
    description: 'Draw and resize text or object regions, edit centered yxyx coordinates, import a MOSS-Image layout, and copy valid JSON into the online studio.',
    heading: 'JSON Layout Image Generator',
  },
  online: {
    slug: 'moss-image-generator-online',
    title: 'MOSS Image Generator Online — No Install or GPU Needed',
    description: 'Use MOSS-Image in your browser with no download, GPU, or ComfyUI setup. Generate with the hosted SFT model, text prompts, and JSON layouts.',
    heading: 'MOSS Image Generator Online',
  },
  mossImageAi: {
    slug: 'moss-image-ai',
    title: 'MOSS Image AI — Open Source Text & Layout Generator',
    description: 'MOSS-Image is an open-source AI image model family with bilingual text and JSON layout control. Try SFT online or run Base and SFT locally.',
    heading: 'MOSS Image AI',
  },
} as const;

export const landingPageMetadata = Object.values(landingPages);
