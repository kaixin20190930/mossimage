import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { featuredImageById, featuredImageHref } from '@/lib/featured-images';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const title = 'AI Text in Image Generator — Readable Posters & Labels';
const description = 'Create posters, labels, and menu concepts with in-image wording. Explore bilingual text, optional JSON layouts, real examples, and proofreading guidance.';
const canonical = 'https://mossimage.run/text-in-image-generator/';
const examples = ['m1', 'm5', 'm6'].map(id => featuredImageById(id)!);

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: '/text-in-image-generator/' },
  openGraph: { title, description, type: 'website', url: '/text-in-image-generator/', images: ['/images/evaluation/m6.webp'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/images/evaluation/m6.webp'] },
};

const sections = [
  { id: 'examples', title: 'Real examples' },
  { id: 'write', title: 'Write the prompt' },
  { id: 'layout', title: 'Guide the layout' },
  { id: 'proofread', title: 'Proofread the result' },
  { id: 'start', title: 'Create an image' },
] as const;

export default function TextInImageGeneratorPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#page`, name: title, description, url: canonical, isPartOf: { '@id': 'https://mossimage.run/#website' }, dateModified: '2026-10-26' },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Text in Image Generator', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Text in Image Generator' }]}
      eyebrow="WORDS INSIDE THE SCENE"
      title="AI Text in Image Generator"
      intro="Create visual concepts where menu items, label copy, event details, and Chinese or English wording are part of the generated image. MOSS-Image SFT is built for text-led prompts, while every result still needs proofreading before publication."
      sections={sections}
      bottomLink={{ href: '/use-cases/', label: 'Browse use cases' }}
      publishedDate="October 26, 2026"
    >
      <section id="examples">
        <h2>Real text-in-image examples</h2>
        <p>These are first-run MOSS-Image SFT outputs from October 26, 2026. They were generated at 1024×1024 with 50 steps, CFG 3, prompt expansion disabled, and no cropping or retouching.</p>
        <div className="example-image-grid">
          {examples.map(image => <figure key={image.id}>
            <div><Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 100vw, 33vw"/></div>
            <figcaption><strong>{image.title}</strong><span>{image.label}</span></figcaption>
          </figure>)}
        </div>
      </section>

      <section id="write">
        <h2>Put exact wording in quotation marks</h2>
        <p>Describe the scene first, then quote every line that needs to appear. Keep the hierarchy explicit: name the heading, subtitle, item rows, prices, and footer separately. Shorter text blocks are easier to inspect and revise than a dense paragraph.</p>
        <div className="code-block"><pre><code>{examples[0].prompt}</code></pre></div>
        <p><Link className="inline-text-link" href="/guide/prompt/">See more copy-ready prompt examples</Link></p>
      </section>

      <section id="layout">
        <h2>Guide where text and objects should appear</h2>
        <p>Natural language is enough for many menu, label, and poster concepts. When placement matters more, switch to JSON Layout and describe each text or object region with the documented <code>items</code>, <code>bbox</code>, <code>yxyx</code>, and <code>abs_centralized</code> format. Layout guidance is experimental and may require iteration.</p>
        <p><Link className="inline-text-link" href="/guide/json-layout/">Build a MOSS-Image JSON layout</Link></p>
      </section>

      <section id="proofread">
        <h2>Proofread every generated word</h2>
        <p>Readable does not mean guaranteed. Check spelling, prices, measurements, dates, addresses, Chinese characters, and punctuation at full size. Regenerate or revise the prompt when any material detail changes. For production menus and packaging, rebuild approved wording in a design tool before printing when exact typography is required.</p>
        <p>Our controlled <Link className="inline-text-link" href="/compare/flux/">MOSS-Image vs FLUX comparison</Link> keeps the failed text visible so you can see why this review step matters.</p>
      </section>

      <section id="start" className="prompt-final-cta">
        <h2>Create your own text-led image</h2>
        <p>Open the tested café prompt in the studio, replace its words with your own, and generate a square concept. Three starter images are available after email verification.</p>
        <Link className="inline-action" href={featuredImageHref('m1')}>Open the café prompt</Link>
        <div className="related-links">
          <Link href="/presets/menu/">Create a menu concept</Link>
          <Link href="/chinese-ai-image-generator/">Generate Chinese and English text</Link>
          <Link href="/gallery/">Browse all real outputs</Link>
        </div>
      </section>
    </EditorialPage>
  </>;
}
