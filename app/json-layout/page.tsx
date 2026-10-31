import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLayoutBuilder } from '@/components/json-layout-builder';
import { landingPages } from '@/lib/landing-pages';
import { JsonLd } from '@/lib/structured-data';

const page = landingPages.jsonLayoutGenerator;
const canonical = 'https://mossimage.run/json-layout/';

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/json-layout/' },
  openGraph: { title: page.title, description: page.description, url: '/json-layout/', type: 'website' },
};

export default function JsonLayoutToolPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${canonical}#app`,
    name: page.heading,
    description: page.description,
    url: canonical,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    dateModified: '2026-10-31',
    isAccessibleForFree: true,
  };

  return <div className="content-page json-layout-tool">
    <JsonLd data={structuredData}/>
    <header className="article-header">
      <span className="eyebrow">INTERACTIVE LAYOUT TOOL</span>
      <h1>{page.heading}</h1>
      <p>Choose a template or import an existing layout, then drag, resize, and edit text or object regions. The editor exports centered <code>yxyx</code> boxes for MOSS-Image; generated placement and lettering can still vary.</p>
      <div className="related-links"><Link href="/guide/json-layout/">Read the bbox syntax guide</Link><Link href="/?mode=layout#studio">Open JSON mode in Studio</Link></div>
    </header>
    <section className="builder-section" aria-label="JSON layout editor"><JsonLayoutBuilder/></section>
    <section className="tool-notes">
      <h2>From regions to a valid layout prompt</h2>
      <p>Boxes use <code>[top, left, bottom, right]</code> order and coordinates measured from the canvas center. Keep regions broad and separate, copy the generated JSON, then test it in Studio before relying on the design.</p>
      <p>Need field definitions, canvas ranges, working examples, and common errors? Read the <Link href="/blog/json-layout-ai-image-generator-guide/">complete JSON layout syntax guide</Link> or use the shorter <Link href="/guide/json-layout/">field reference</Link>.</p>
    </section>
  </div>;
}
