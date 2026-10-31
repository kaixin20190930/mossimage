import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { featuredImageById, featuredImageHref } from '@/lib/featured-images';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const title = 'AI Menu Image Generator — Café & Restaurant Concepts';
const description = 'Generate café and restaurant menu concepts with in-image prices, bilingual headings, and optional JSON layout. Visual mockups only — always proofread before printing.';
const canonical = 'https://mossimage.run/use-cases/menu/';
const menuImages = ['m1', 'm2', 'm3', 'm4'].map(id => featuredImageById(id)!);

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: '/use-cases/menu/' },
  openGraph: { title, description, type: 'website', url: '/use-cases/menu/', images: ['/images/evaluation/m1.webp'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/images/evaluation/m1.webp'] },
};

const sections = [
  { id: 'examples', title: 'Menu examples' },
  { id: 'how', title: 'How it works' },
  { id: 'prompts', title: 'Copy-ready prompts' },
  { id: 'limits', title: 'What this tool is for' },
  { id: 'create', title: 'Create a menu concept' },
] as const;

export default function MenuUseCasePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#page`, name: title, description, url: canonical, isPartOf: { '@id': 'https://mossimage.run/#website' }, dateModified: '2026-10-26' },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Use Cases', url: 'https://mossimage.run/use-cases/' },
        { name: 'AI Menu Image Generator', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Use Cases', href: '/use-cases/' }, { label: 'AI Menu Image Generator' }]}
      eyebrow="VISUAL MENU CONCEPTS"
      title="AI Menu Image Generator"
      intro="Generate café and restaurant menu mockups with headings, dish names, prices, and bilingual text inside the image. This is a visual concept generator—not a structured menu manager, QR menu, or online ordering system. Proofread and rebuild final production artwork before printing."
      sections={sections}
      bottomLink={{ href: '/use-cases/', label: 'All use cases' }}
      publishedDate="October 26, 2026"
    >
      <section id="examples">
        <h2>Four real menu generations</h2>
        <p>Each image below is a first-run MOSS-Image SFT output. The test used 1024×1024, 50 steps, CFG 3, prompt expansion off, and one fixed seed per prompt. No image was cropped or retouched.</p>
        <div className="example-image-grid menu-example-grid">
          {menuImages.map(image => <figure key={image.id}>
            <div><Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 100vw, 50vw"/></div>
            <figcaption><strong>{image.title}</strong><span>Seed {image.seed}</span></figcaption>
          </figure>)}
        </div>
      </section>

      <section id="how">
        <h2>How it works</h2>
        <ol>
          <li>Write the menu heading and each item exactly as it should appear, including prices.</li>
          <li>Describe the material, setting, type mood, and alignment, then choose a canvas shape.</li>
          <li>Generate, inspect every line at full size, and revise the wording or density when needed.</li>
        </ol>
        <p>Natural-language prompts are the simplest starting point. JSON Layout is optional when you need stronger guidance for text and object regions.</p>
      </section>

      <section id="prompts">
        <h2>Copy-ready menu prompts</h2>
        {menuImages.slice(0, 3).map(image => <div className="prompt-example" key={image.id}>
          <div className="prompt-example-heading"><span>{image.title}</span></div>
          <pre>{image.prompt}</pre>
          <Link className="inline-action" href={featuredImageHref(image.id)}>Open in generator</Link>
        </div>)}
      </section>

      <section id="limits">
        <h2>Use it for visual direction, then verify the details</h2>
        <p>These images are useful for mood exploration, pitch decks, campaign concepts, and testing a menu’s visual direction. They do not manage products, allergens, inventory, tax, QR codes, or orders. Generated wording can change, so verify every dish name and price before sharing or printing.</p>
        <p>For exact final typography and accessible menu content, recreate the approved concept with editable text in your design or publishing workflow.</p>
      </section>

      <section id="create" className="prompt-final-cta">
        <h2>Generate your own menu concept</h2>
        <p>Start with the tested four-item café prompt and replace the heading, items, and prices. Three starter images are available after email verification.</p>
        <Link className="inline-action" href={featuredImageHref('m1')}>Open the menu prompt</Link>
        <div className="related-links">
          <Link href="/text-in-image-generator/">Explore text in images</Link>
          <Link href="/guide/prompt/">Read the prompt guide</Link>
          <Link href="/gallery/">View all real outputs</Link>
        </div>
      </section>
    </EditorialPage>
  </>;
}
