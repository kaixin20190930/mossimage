import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogMarkdown, blogHeadingId, type BlogMedia } from '@/components/blog-markdown';
import { EditorialPage } from '@/components/editorial-page';
import { PromptShowcaseArticle } from '@/components/prompt-showcase-article';
import { blogPostBySlug, blogPosts } from '@/lib/blog-posts';
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
        image: `https://mossimage.run${post.cover}`, datePublished: post.published, dateModified: '2026-10-31',
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
  const sections = post.sections.map(title => ({ id: blogHeadingId(title), title }));
  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Blog', href: '/blog/' }, { label: post.heading }]}
      eyebrow="MOSS-IMAGE FIELD NOTES"
      title={post.heading}
      intro={post.excerpt}
      sections={sections}
      bottomLink={{ href: '/blog/', label: 'All articles' }}
      publishedDate={post.publishedLabel}
    >
      <figure className="blog-cover"><div><Image src={post.cover} alt="" fill priority sizes="(max-width: 760px) 100vw, 720px"/></div></figure>
      {contextualLink && <p className="small-note">{contextualLink.note} <Link href={contextualLink.href}>{contextualLink.label}</Link>.</p>}
      {post.slug === 'best-moss-image-prompts-examples-seeds'
        ? <PromptShowcaseArticle/>
        : <BlogMarkdown markdown={post.body} media={mediaFor(post.slug)}/>
      }
    </EditorialPage>
  </>;
}
