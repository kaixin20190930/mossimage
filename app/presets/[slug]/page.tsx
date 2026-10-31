import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { featuredImageById } from '@/lib/featured-images';
import { isPresetSlug, presets, type PresetSlug } from '@/lib/presets';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const contextualLinks: Partial<Record<PresetSlug, { href: string; label: string }>> = {
  infographic: { href: '/blog/best-moss-image-prompts-examples-seeds/', label: 'real MOSS-Image prompts with seeds' },
  'quote-card': { href: '/guide/prompt/', label: 'quotation mark and attribution prompting tips' },
};

export function generateStaticParams() {
  return Object.keys(presets).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isPresetSlug(slug)) return {};
  const preset = presets[slug];
  return { title: preset.title, description: preset.description, alternates: { canonical: `/presets/${slug}/` }, openGraph: { title: preset.title, description: preset.description, url: `/presets/${slug}/`, type: 'website' } };
}

export default async function PresetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPresetSlug(slug)) notFound();
  const preset = presets[slug];
  const contextualLink = contextualLinks[slug];
  const images = preset.imageIds.map(featuredImageById).filter(Boolean);
  const first = images[0]!;
  const studioHref = `/?example=${encodeURIComponent(first.id)}&cfg=3&steps=50#studio`;
  const canonical = `https://mossimage.run/presets/${slug}/`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#page`, url: canonical, name: preset.title, description: preset.description, dateModified: contextualLink ? '2026-10-31' : '2026-10-28', isPartOf: { '@id': 'https://mossimage.run/#website' } },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Presets', url: 'https://mossimage.run/presets/' },
        { name: preset.name, url: canonical },
      ]),
    ],
  };
  return <div className="content-page preset-page"><JsonLd data={structuredData}/><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/presets/">Presets</Link><span>/</span><span>{preset.name}</span></nav><header className="article-header"><span className="eyebrow">HOSTED SFT PRESET</span><h1>{preset.heading}</h1><p>{preset.intro}</p>{contextualLink && <p className="small-note">Read the <Link href={contextualLink.href}>{contextualLink.label}</Link> before adapting this preset.</p>}<Link className="inline-action" href={studioHref}>Open this preset in Studio</Link></header><section><h2>Reference settings</h2><div className="preset-settings"><span><strong>Model</strong>MOSS-Image SFT</span><span><strong>CFG</strong>3</span><span><strong>Steps</strong>50</span><span><strong>Prompt expansion</strong>Text mode on</span></div><p className="small-note">The hosted API supports CFG and inference steps. Shift, sampler, scheduler, and SLG are local workflow settings and are intentionally not claimed here.</p></section><section><h2>Real outputs to start from</h2><div className="example-image-grid">{images.map(image => image && <figure key={image.id}><div><Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 100vw, 33vw"/></div><figcaption><strong>{image.title}</strong><span>Seed {image.seed}</span></figcaption><Link className="preset-example-link" href={`/?example=${encodeURIComponent(image.id)}&cfg=3&steps=50#studio`}>Use this prompt</Link></figure>)}</div></section><section><h2>Prompt formula</h2><ol className="preset-formula">{preset.formula.map(step => <li key={step}>{step}</li>)}</ol></section><div className="related-links"><Link href={preset.guideHref}>Related guide</Link><Link href="/gallery/">Full gallery</Link><Link href="/json-layout/">JSON Layout editor</Link></div></div>;
}
