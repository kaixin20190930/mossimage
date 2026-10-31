import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { JsonLayoutBuilder } from '@/components/json-layout-builder';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.jsonLayoutGenerator;
const canonical = 'https://mossimage.run/guide/json-layout-generator/';

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/guide/json-layout-generator/' },
  openGraph: { title: page.title, description: page.description, url: '/guide/json-layout-generator/', type: 'website' },
};

const sections = [
  { id: 'builder', title: 'Build a JSON layout' },
  { id: 'templates', title: 'Choose the right template' },
  { id: 'coordinates', title: 'How the coordinates work' },
  { id: 'limits', title: 'What layout guidance can do' },
] as const;

export default function JsonLayoutGeneratorPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.description,
        dateModified: '2026-10-26',
        isPartOf: { '@id': 'https://mossimage.run/#website' },
        about: { '@type': 'Thing', name: 'MOSS-Image JSON layout prompts' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Guides', url: 'https://mossimage.run/guide/' },
        { name: 'JSON Layout Image Generator', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Guides', href: '/guide/' }, { label: 'JSON Layout Generator' }]}
      eyebrow="INTERACTIVE LAYOUT TOOL"
      title={page.heading}
      intro="Choose a menu, poster, or product-label template, replace its wording, and export a complete MOSS-Image layout prompt. The regions guide composition; generated placement and lettering can still vary."
      sections={sections}
      bottomLink={{ href: '/guide/', label: 'All guides' }}
      publishedDate="October 26, 2026"
    >
      <div className="prompt-guide-start">
        <div><strong>This is the interactive builder.</strong><span>Need every field explained first?</span></div>
        <Link className="inline-action" href="/guide/json-layout/">Read the JSON Layout reference</Link>
      </div>

      <section id="builder" className="builder-section">
        <JsonLayoutBuilder/>
      </section>

      <section id="templates">
        <h2>Choose a template for the visual job</h2>
        <p><strong>Menu Card</strong> separates two bilingual items from their prices. <strong>Poster</strong> gives a headline, event information, and call to action distinct regions. <strong>Product Label</strong> keeps the brand, product name, two short details, and net-weight line separate.</p>
        <p>Start with the template closest to your composition. Keep exact wording short, then change one field at a time after the first result.</p>
      </section>

      <section id="coordinates">
        <h2>Centered coordinates on a 1024 × 1024 canvas</h2>
        <p>Every box uses <code>yxyx</code> order: <code>[top, left, bottom, right]</code>. With <code>abs_centralized</code>, the canvas center is zero, the top-left corner is near <code>[-512, -512]</code>, and the bottom-right corner is near <code>[512, 512]</code>.</p>
        <p>The templates use broad, non-overlapping regions to give the model room. For custom boxes, canvas-specific ranges, and validation errors, use the <Link href="/guide/json-layout/">full JSON Layout reference</Link>.</p>
      </section>

      <section id="limits">
        <h2>Use layout as guidance, then proofread</h2>
        <p>OpenMOSS describes JSON layout prompts as experimental. A bounding box communicates the intended region; it does not guarantee design-software precision. Always check spelling, prices, coordinates, and visual hierarchy before publishing a result.</p>
        <div className="related-links">
          <Link href="/guide/prompt/">Build a natural-language prompt</Link>
          <Link href="/guide/json-layout/">Read the field reference</Link>
          <Link href="/gallery/">See real MOSS-Image creations</Link>
        </div>
      </section>
    </EditorialPage>
  </>;
}
