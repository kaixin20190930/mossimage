import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { featuredImageById } from '@/lib/featured-images';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.flux;
const canonical = 'https://mossimage.run/compare/flux/';
const pairs = [
  { id: 'menu', title: 'Café menu: four items and aligned prices', promptId: 'm1', moss: '/images/evaluation/m1.webp', flux: '/images/evaluation/f1.webp', mossAlt: 'MOSS-Image output of a Morning Menu with four correctly rendered items and prices', fluxAlt: 'FLUX.1 dev output of the same Morning Menu prompt with one price rendered incorrectly', finding: 'In this first output, MOSS rendered all four requested items and prices as written. FLUX rendered the layout clearly but changed “Butter Croissant 3.80” to “Butter Croissant 3.60”.' },
  { id: 'label', title: 'Product label: curved small print', promptId: 'm5', moss: '/images/evaluation/m5.webp', flux: '/images/evaluation/f2.webp', mossAlt: 'MOSS-Image output of a honey jar with three correctly rendered label lines', fluxAlt: 'FLUX.1 dev output of the same honey label prompt with a misspelled subtitle', finding: 'MOSS rendered all three requested label lines as written. FLUX rendered the heading and net weight, while the middle line became “Raw & Unfilterelrd”.' },
  { id: 'poster', title: 'Bilingual poster: Chinese, English, time and place', promptId: 'm6', moss: '/images/evaluation/m6.webp', flux: '/images/evaluation/f3.webp', mossAlt: 'MOSS-Image output of a Weekend Market poster with correctly rendered Chinese and English details', fluxAlt: 'FLUX.1 dev output of the same bilingual poster prompt with garbled Chinese and an incorrect time', finding: 'MOSS rendered the requested Chinese and English event details as written. FLUX produced a strong poster composition, but the Chinese was garbled and the time became “10.00–178.00”.' },
] as const;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/compare/flux/' },
  openGraph: { title: page.title, description: page.description, url: '/compare/flux/', type: 'article', images: ['/images/evaluation/m1.webp'] },
  twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: ['/images/evaluation/m1.webp'] },
};

const sections = [
  { id: 'results', title: 'Side-by-side results' },
  { id: 'method', title: 'Test method' },
  { id: 'overview', title: 'Capability overview' },
  { id: 'license', title: 'Licensing' },
  { id: 'choose', title: 'Which should you use?' },
] as const;

export default function FluxComparisonPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', '@id': `${canonical}#article`, headline: page.heading, description: page.description,
        datePublished: '2026-10-23', dateModified: '2026-10-31', mainEntityOfPage: canonical,
        author: { '@type': 'Organization', name: 'Moxion Labs LLC', url: 'https://mossimage.run/' },
        publisher: { '@id': 'https://mossimage.run/#organization' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Comparisons', url: 'https://mossimage.run/compare/' },
        { name: 'MOSS-Image vs FLUX', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Comparisons', href: '/compare/' }, { label: 'MOSS-Image vs FLUX' }]}
      eyebrow="CONTROLLED MODEL COMPARISON"
      title={page.heading}
      intro="We ran MOSS-Image SFT and FLUX.1 dev once on the same three prompts, seeds, and 1024×1024 canvas. The unselected first outputs below show what each model got right and where text changed."
      sections={sections}
      bottomLink={{ href: '/compare/', label: 'All comparisons' }}
      publishedDate="October 26, 2026 · updated"
    >
      <section id="results">
        <h2>Same input, first output</h2>
        <p>These examples are a small, transparent test rather than a universal ranking. No result was regenerated to improve its score, and visible failures remain in the set.</p>
        <div className="model-comparison-list">
          {pairs.map(pair => {
            const source = featuredImageById(pair.promptId)!;
            return <article className="model-comparison" key={pair.id}>
              <h3>{pair.title}</h3>
              <div className="model-comparison-grid">
                <figure><div><Image src={pair.moss} alt={pair.mossAlt} fill sizes="(max-width: 760px) 100vw, 50vw"/></div><figcaption><strong>MOSS-Image SFT</strong><span>50 steps · CFG 3</span></figcaption></figure>
                <figure><div><Image src={pair.flux} alt={pair.fluxAlt} fill sizes="(max-width: 760px) 100vw, 50vw"/></div><figcaption><strong>FLUX.1 dev</strong><span>28 steps · guidance 3.5</span></figcaption></figure>
              </div>
              <p className="comparison-finding">{pair.finding}</p>
              <details className="comparison-prompt"><summary>View the shared prompt and seed</summary><pre>{source.prompt}</pre><p>Seed: {source.seed}</p></details>
            </article>;
          })}
        </div>
      </section>

      <section id="method">
        <h2>Test method</h2>
        <div className="comparison-table-wrap">
          <table><thead><tr><th>Setting</th><th>MOSS-Image SFT</th><th>FLUX.1 dev</th></tr></thead><tbody>
            <tr><th>Provider endpoint</th><td><code>fal-ai/moss-image</code></td><td><code>fal-ai/flux/dev</code></td></tr>
            <tr><th>Canvas</th><td>1024×1024</td><td>1024×1024</td></tr>
            <tr><th>Steps / guidance</th><td>50 / CFG 3</td><td>28 / guidance 3.5</td></tr>
            <tr><th>Prompt handling</th><td>Expansion disabled</td><td>Exact submitted prompt</td></tr>
            <tr><th>Runtime options</th><td>Provider sampler and scheduler</td><td>Acceleration disabled</td></tr>
            <tr><th>Selection</th><td>One run per prompt</td><td>One run per prompt</td></tr>
          </tbody></table>
        </div>
        <p>Each pair used the same numeric seed. Different model architectures do not turn that into identical latent noise, so the seed controls repeatability within each model rather than visual equivalence across models. Files were generated October 26, 2026, were not cropped or retouched, and were converted from PNG to WebP for delivery.</p>
        <p>Read the full <Link href="/blog/moss-image-vs-flux-text-rendering/">text rendering test with the same prompt and seed</Link> for the prompt-by-prompt findings and adaptation notes.</p>
      </section>

      <section id="overview">
        <h2>Capability overview</h2>
        <div className="comparison-table-wrap">
          <table><thead><tr><th>Area</th><th>MOSS-Image SFT</th><th>FLUX.1 dev</th></tr></thead><tbody>
            <tr><th>Text focus</th><td>Fine-tuned for text rendering and layout following</td><td>General image generation with prompt-based text</td></tr>
            <tr><th>Structured layout</th><td>Documented JSON text and object regions</td><td>No equivalent syntax in the official model card</td></tr>
            <tr><th>Workflow</th><td>Native ComfyUI and optional HF-directory plugin</td><td>Established FLUX tools and ComfyUI workflows</td></tr>
            <tr><th>Proofreading</th><td>Required before publication</td><td>Required before publication</td></tr>
          </tbody></table>
        </div>
        <p>Three examples cannot establish an overall winner. They do show why text-heavy prompts need direct testing: a visually convincing output can still contain a changed price, misspelled label, or incorrect event time.</p>
      </section>

      <section id="license">
        <h2>Check the exact checkpoint license</h2>
        <p>MOSS-Image Base is published under Apache 2.0, while the SFT checkpoint used in this hosted test has its own model card and usage context. FLUX.1 dev uses the FLUX.1 dev Non-Commercial License. Review the terms for the exact weights and provider you plan to use, especially for commercial work.</p>
        <p>This comparison summarizes public model information and is not legal advice.</p>
      </section>

      <section id="choose">
        <h2>Which should you use?</h2>
        <p>Test MOSS-Image SFT when wording and structured placement are central to the image. Test FLUX.1 dev when its visual behavior and ecosystem fit the job. Use your own real prompts, keep failed outputs, and score the number of retries needed—not only the best image from each model.</p>
        <div className="related-links">
          <Link href="/?example=m1#studio">Try the menu prompt</Link>
          <Link href="/compare/base-vs-sft/">Compare Base and SFT</Link>
          <Link href="/guide/json-layout/">Read the JSON layout guide</Link>
        </div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Model and API details checked October 26, 2026.</p>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT" target="_blank" rel="noreferrer">MOSS-Image SFT model card</a>
        <a href="https://fal.ai/models/fal-ai/moss-image/api" target="_blank" rel="noreferrer">fal.ai MOSS-Image API reference</a>
        <a href="https://github.com/black-forest-labs/flux/blob/main/model_cards/FLUX.1-dev.md" target="_blank" rel="noreferrer">FLUX.1 dev model card</a>
        <a href="https://fal.ai/models/fal-ai/flux/dev/api" target="_blank" rel="noreferrer">fal.ai FLUX.1 dev API reference</a>
      </section>
    </EditorialPage>
  </>;
}
