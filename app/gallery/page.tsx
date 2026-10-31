import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { featuredImageHref, featuredImages } from '@/lib/featured-images';
import { JsonLd, breadcrumbStructuredData } from '@/lib/structured-data';
import { GalleryComparison } from '@/components/gallery-comparison';

const title = 'MOSS-Image Gallery — Real Images & Full Prompts';
const description = 'Real images generated with MOSS-Image, each shown with its full prompt, settings, and a one-click link to open it in the generator.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/gallery/' },
  openGraph: {
    title,
    description,
    type: 'website',
    url: '/gallery/',
    images: [{ url: '/images/featured/bilingual-menu.webp', width: 1024, height: 1024, alt: featuredImages[0].alt }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/images/featured/bilingual-menu.webp'] },
};

const galleryStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': 'https://mossimage.run/gallery/#page',
      name: title,
      description,
      url: 'https://mossimage.run/gallery/',
      dateModified: '2026-10-31',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: featuredImages.map((image, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'ImageObject',
            name: image.title,
            caption: image.alt,
            contentUrl: `https://mossimage.run${image.src}`,
            encodingFormat: 'image/webp',
            width: 1024,
            height: 1024,
          },
        })),
      },
    },
    breadcrumbStructuredData([
      { name: 'Home', url: 'https://mossimage.run/' },
      { name: 'Creations', url: 'https://mossimage.run/gallery/' },
    ]),
  ],
};

const galleryGroups = [
  { title: 'Bilingual text', labels: ['BILINGUAL TEXT'], description: 'Chinese and English lettering used together in menus and event concepts.' },
  { title: 'Structured layouts', labels: ['JSON LAYOUT'], description: 'Text and objects guided into regions with MOSS-Image JSON Layout.' },
  { title: 'Menu concepts', labels: ['MENU CONCEPT'], description: 'Café, drinks, and bakery mockups with visible menu wording and prices.' },
  { title: 'Labels and event posters', labels: ['PRODUCT LABEL', 'EVENT POSTER'], description: 'Product packaging and event concepts built around wording inside the image.' },
  { title: 'Visual stories', labels: ['VISUAL QUALITY'], description: 'Prompt-led scenes that focus on atmosphere, objects, light, and illustration.' },
  { title: 'Illustration', labels: ['ILLUSTRATION'], description: 'Storybook and editorial scenes with soft, expressive atmosphere.' },
  { title: 'Infographics', labels: ['INFOGRAPHIC'], description: 'Process steps, sample stat cards, comparisons, and recipe concepts with concise labels.' },
  { title: 'Quote cards', labels: ['QUOTE CARD'], description: 'Short quotations and product messages with separate attribution lines and distinct visual styles.' },
] as const;

export default function GalleryPage() {
  return <>
    <JsonLd data={galleryStructuredData}/>
    <div className="gallery-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Creations</span></nav>
      <header className="gallery-header">
        <span className="eyebrow">REAL MOSS-IMAGE OUTPUTS</span>
        <h1>Creations made with MOSS-Image</h1>
        <p>Thirty-one real generations across menu concepts, bilingual typography, product labels, JSON-controlled layouts, infographics, quote cards and illustration. Inspect the prompt and settings, then open any example in the studio.</p>
      </header>
      <GalleryComparison/>
      {galleryGroups.map(group => <section className="gallery-group" key={group.title}><div className="gallery-group-heading"><h2>{group.title}</h2><p>{group.description}</p></div><div className="gallery-grid">
        {featuredImages.filter(image => (group.labels as readonly string[]).includes(image.label)).map((image, index) => <article className="gallery-card" key={image.id}>
          <div className="gallery-image"><Image src={image.src} alt={image.alt} fill priority={index === 0} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"/></div>
          <div className="gallery-card-body">
            <span className="gallery-label">{image.label}</span>
            <h2>{image.title}</h2>
            {image.settings && <p className="gallery-settings"><strong>{image.model}</strong><br/>{image.settings}<br/>Seed {image.seed} · {image.cropped ? 'cropped' : 'not cropped'} · {image.generatedOn}</p>}
            <details>
              <summary>View original {image.mode === 'layout' ? 'JSON layout' : 'prompt'}</summary>
              <pre>{image.prompt}</pre>
            </details>
            <Link className="gallery-action" href={featuredImageHref(image.id)}>Try this {image.mode === 'layout' ? 'layout' : 'prompt'}</Link>
          </div>
        </article>)}
      </div></section>)}
      <p className="gallery-disclosure">Generated with MOSS-Image SFT through fal.ai. Evaluation images use prompt expansion off; later text-led examples use prompt expansion on, while JSON layouts keep it off. Each card shows its settings. Images were not rerun or cropped and were converted to WebP for delivery; generated text should always be proofread before publishing.</p>
    </div>
  </>;
}
