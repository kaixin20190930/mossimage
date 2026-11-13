import { defaultOpenGraphImage } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const title = 'MOSS-Image Use Cases — Text, Layouts & Visual Concepts';
const description = 'Explore practical MOSS-Image use cases for bilingual text, structured JSON layouts, and prompt-led visual concepts with real examples.';
const canonical = 'https://mossimage.run/use-cases/';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/use-cases/' },
  openGraph: { ...defaultOpenGraphImage, title, description, url: '/use-cases/', type: 'website' },
};

const cards = [
  {
    eyebrow: 'HOSTED SFT PRESET',
    title: 'Product photography',
    description: 'Start from real still-life and catalog-style outputs with restrained CFG and step settings.',
    href: '/presets/photoreal/',
  },
  {
    eyebrow: 'HOSTED SFT PRESET',
    title: 'Posters',
    description: 'Open tested bilingual and event-poster prompts, then move to JSON layout when regions matter.',
    href: '/presets/poster/',
  },
  {
    eyebrow: 'HOSTED SFT PRESET',
    title: 'Menus',
    description: 'Use real café and restaurant examples with short item lists, prices, and proofreading guidance.',
    href: '/presets/menu/',
  },
  {
    eyebrow: 'HOSTED SFT PRESET',
    title: 'Product labels',
    description: 'Separate brand, product, descriptor, and net-weight wording with real label outputs and layout guidance.',
    href: '/presets/product-label/',
  },
  {
    eyebrow: 'HOSTED SFT PRESET',
    title: 'Infographics',
    description: 'Build short process diagrams, sample stat cards, comparisons, and recipe graphics from tested outputs.',
    href: '/presets/infographic/',
  },
  {
    eyebrow: 'HOSTED SFT PRESET',
    title: 'Quote cards',
    description: 'Turn concise quotations and product messages into social graphics with a separate attribution line.',
    href: '/presets/quote-card/',
  },
] as const;

export default function UseCasesPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#page`,
        name: title,
        description,
        url: canonical,
        isPartOf: { '@id': 'https://mossimage.run/#website' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Use Cases', url: canonical },
      ]),
    ],
  };

  return <div className="content-page">
    <JsonLd data={structuredData}/>
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">MOSS-Image Generator</Link><span aria-hidden="true">/</span><span aria-current="page">Use Cases</span>
    </nav>
    <header className="article-header">
      <span className="eyebrow">PRACTICAL STARTING POINTS</span>
      <h1>MOSS-Image Use Cases</h1>
      <p>This directory now points to tested Studio presets rather than duplicating their content. Choose a visual job, inspect real MOSS-Image SFT outputs, and open the matching prompt and hosted settings in the generator. Generated wording still needs proofreading, and layout guidance can require iteration.</p>
    </header>
    <div className="directory-grid">
      {cards.map(card => <Link href={card.href} key={card.href}>
        <span className="eyebrow">{card.eyebrow}</span>
        <h2>{card.title}</h2>
        <p>{card.description}</p>
      </Link>)}
    </div>
    <div className="article-bottom"><Link href="/presets/">Browse all presets</Link><Link href="/gallery/">View real outputs</Link></div>
  </div>;
}
