import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogMarkdown, blogHeadingId, type BlogMedia } from '@/components/blog-markdown';
import { EditorialPage } from '@/components/editorial-page';
import { PromptShowcaseArticle } from '@/components/prompt-showcase-article';
import { blogPostBySlug, blogPosts } from '@/lib/blog-posts';
import { contentLastModified } from '@/lib/content-dates';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

export const dynamicParams = false;

export function generateStaticParams() { return blogPosts.map(post => ({ slug: post.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) return {};
  const url = `/blog/${post.slug}/`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.description, url, type: 'article', publishedTime: `${post.published}T00:00:00+08:00`, images: [{ url: post.cover, width: 1024, height: 1024 }] },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description, images: [post.cover] },
  };
}

function singleImage(src: string, alt: string, caption: string) {
  return <figure className="blog-figure"><div><Image src={src} alt={alt} fill sizes="(max-width: 760px) 100vw, 720px"/></div><figcaption>{caption}</figcaption></figure>;
}

function comparisonPair(moss: string, flux: string, title: string) {
  return <div className="blog-comparison-pair">
    <figure><div><Image src={moss} alt={`MOSS-Image SFT output for ${title}`} fill sizes="(max-width: 760px) 100vw, 360px"/></div><figcaption>MOSS-Image SFT</figcaption></figure>
    <figure><div><Image src={flux} alt={`FLUX.1 dev output for ${title}`} fill sizes="(max-width: 760px) 100vw, 360px"/></div><figcaption>FLUX.1 dev</figcaption></figure>
  </div>;
}

const contextualLinks: Record<string, { href: string; label: string; note: string }> = {
  'moss-image-comfyui-guide': {
    href: '/comfyui/mossimagehfloader/',
    label: 'MOSSImageHFLoader node',
    note: 'Using the optional HF-directory workflow? Review the',
  },
  'moss-image-vs-flux-text-rendering': {
    href: '/compare/flux/',
    label: 'MOSS-Image vs FLUX side-by-side comparison',
    note: 'See the same evaluation as a focused',
  },
  'json-layout-ai-image-generator-guide': {
    href: '/json-layout/',
    label: 'visual JSON layout editor',
    note: 'Turn the syntax below into regions with the',
  },
  'generate-readable-chinese-text-ai-images': {
    href: '/chinese-ai-image-generator/',
    label: 'MOSS-Image Chinese text generator',
    note: 'Try these patterns in the',
  },
  'what-is-moss-image-open-source-ai-model': {
    href: '/moss-image-ai/',
    label: 'MOSS-Image model overview',
    note: 'For the concise product-facing reference, open the',
  },
};

function mediaFor(slug: string): readonly BlogMedia[] {
  if (slug === 'moss-image-vs-flux-text-rendering') return [
    { after: 'Test 1: Café menu — four items and aligned prices', node: comparisonPair('/images/evaluation/m1.webp', '/images/evaluation/f1.webp', 'the café menu test') },
    { after: 'Test 2: Product label — curved small print', node: comparisonPair('/images/evaluation/m5.webp', '/images/evaluation/f2.webp', 'the honey label test') },
    { after: 'Test 3: Bilingual poster — Chinese, English, time and place', node: comparisonPair('/images/evaluation/m6.webp', '/images/evaluation/f3.webp', 'the bilingual event poster test') },
  ];
  if (slug === 'json-layout-ai-image-generator-guide') return [
    { after: 'Example 1: Botanical poster', node: singleImage('/images/featured/botanical-poster.webp', 'MOSS-Image botanical poster generated from the JSON layout shown below', 'The published botanical layout output.') },
    { after: 'Example 2: Product showcase', node: singleImage('/images/featured/product-showcase.webp', 'MOSS-Image product showcase generated from the JSON layout shown below', 'The published product layout output.') },
    { after: 'Example 3: Bilingual café menu', node: singleImage('/images/featured/bilingual-menu.webp', 'Bilingual café menu with Chinese and English lettering', 'A bilingual text example from the live gallery.') },
  ];
  if (slug === 'generate-readable-chinese-text-ai-images') return [
    { after: 'Two working bilingual prompts from the gallery', node: <div className="blog-comparison-pair">{singleImage('/images/featured/bilingual-menu.webp', 'Café menu with Chinese and English text', 'Bilingual café menu')}{singleImage('/images/featured/jazz-poster.webp', 'Jazz poster with Chinese and English text', 'Midnight jazz poster')}</div> },
  ];
  return [];
}

const comfyUiErrorIndex = `### Error messages, in the words you will see them

#### The MOSS-Image template or nodes are missing

The native text-to-image templates require ComfyUI 0.42.0 or later; edit and control templates require 0.43.0 or later. Update ComfyUI and its current dependencies before replacing model files. The older HF-directory graph is a separate plugin workflow. See the [known-good settings baseline](/guide/settings/) after the correct template loads.

#### \"The value moss_image for load clip's type is not available.\"

This is a loader-path mismatch, not a reason to move random files. For a native graph, update ComfyUI until the Load CLIP node offers type \`moss_image\`, put the text encoder in \`ComfyUI/models/text_encoders/\`, and re-import the current native workflow. For an HF-directory graph, do not use the stock Load CLIP node: use MOSSImageHFLoader and point \`model_path\` at the complete Diffusers directory containing \`transformer/\`, \`text_encoder/\`, \`tokenizer/\`, and \`vae/\`. Do not mix the two graphs.

#### \"MOSSImageHFLoader\" is missing or the graph shows red nodes

First identify the graph type. A current native workflow requires a current ComfyUI build but no MOSS plugin. An HF-directory workflow requires the OpenMOSS custom node and a full restart. Check the startup log for the first import error before reinstalling anything.

#### The model type cannot be detected or a weight stays unloaded

Confirm that the diffusion checkpoint and text encoder came from the matching MOSS-Image release. Native single-file checkpoints and HF-directory components use different loaders and weight layouts. Read the first loader error and restore the matching complete workflow instead of renaming files or replacing one node.

#### KSampler stops with a dtype error

Record the exact exception, device backend, ComfyUI version, and loaded weight dtype. First reproduce with current ComfyUI, the official BF16 workflow, and third-party custom nodes disabled. Do not treat every KSampler dtype exception as an MOSS sampler problem: backend-specific casting failures can surface at KSampler even when preparation failed earlier.

#### Output is pure noise after carrying over ModelSamplingSD3

Restore the complete workflow for the loader you chose. Native and HF-directory graphs use different timestep multipliers, so swapping only the loader can finish without an exception and still return noise. For the native path, use its saved graph or ModelSamplingAuraFlow with multiplier 1 when adjusting shift; do not carry the plugin graph's ModelSamplingSD3 node into it. Test one 1024 × 1024 image with a fixed seed and no LoRA.

#### INT8 or ConvRot works differently from BF16

Treat quantized weights as a separate test condition, not a drop-in diagnosis. Run the same fixed prompt and seed with the official BF16 and INT8 files in otherwise identical native graphs. If only the quantized run fails or degrades, keep the BF16 baseline and report the exact checkpoint hash and ComfyUI version.

#### SageAttention or another acceleration flag produces gray or distorted output

Disable the acceleration flag and repeat the same fixed-seed BF16 baseline before changing CFG or steps. If the normal attention path works, keep the flag off until that exact backend and ComfyUI combination has been tested separately. A visually bad image is a quality regression, not the same event as a queue or provider failure.`;

function markdownFor(post: (typeof blogPosts)[number]) {
  if (post.slug !== 'moss-image-comfyui-guide') return post.body;
  return post.body.replace('\n\n### Troubleshooting common issues', `\n\n${comfyUiErrorIndex}\n\n### Troubleshooting common issues`);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) notFound();
  const contextualLink = contextualLinks[post.slug];
  const canonical = `https://mossimage.run/blog/${post.slug}/`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', '@id': `${canonical}#article`, headline: post.heading, description: post.description,
        image: `https://mossimage.run${post.cover}`, datePublished: post.published, dateModified: contentLastModified[`blog/${post.slug}`] ?? post.published,
        mainEntityOfPage: canonical, author: { '@type': 'Organization', name: 'Moxion Labs LLC', url: 'https://mossimage.run/' },
        publisher: { '@id': 'https://mossimage.run/#organization' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Blog', url: 'https://mossimage.run/blog/' },
        { name: post.heading, url: canonical },
      ]),
    ],
  };
  const sectionTitles = post.slug === 'moss-image-comfyui-guide'
    ? post.sections.flatMap(title => title === 'Troubleshooting common issues' ? ['Error messages, in the words you will see them', title] : [title])
    : post.sections;
  const sections = sectionTitles.map(title => ({ id: blogHeadingId(title), title }));
  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Blog', href: '/blog/' }, { label: post.heading }]}
      eyebrow="MOSS-IMAGE FIELD NOTES"
      title={post.heading}
      intro={post.excerpt}
      sections={sections}
      bottomLink={{ href: '/blog/', label: 'All articles' }}
      publishedDate={post.slug === 'moss-image-comfyui-guide' ? `${post.publishedLabel} · Updated November 9, 2026` : post.publishedLabel}
    >
      <figure className="blog-cover"><div><Image src={post.cover} alt="" fill priority sizes="(max-width: 760px) 100vw, 720px"/></div></figure>
      {contextualLink && <p className="small-note">{contextualLink.note} <Link href={contextualLink.href}>{contextualLink.label}</Link>.</p>}
      {post.slug === 'best-moss-image-prompts-examples-seeds'
        ? <PromptShowcaseArticle/>
        : <BlogMarkdown markdown={markdownFor(post)} media={mediaFor(post.slug)}/>
      }
    </EditorialPage>
  </>;
}
