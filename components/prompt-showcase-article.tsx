import Image from 'next/image';
import Link from 'next/link';
import { featuredImageById, featuredImageHref } from '@/lib/featured-images';

const examples = [
  { id: 'bilingual-menu', lesson: 'Separate the Chinese headline, English subtitle, and illustration into a simple visual hierarchy.', adapt: 'Replace both quoted strings together, then change one visual detail such as paper color or lighting.' },
  { id: 'jazz-poster', lesson: 'High contrast and short quoted strings give the two languages clear jobs inside one poster.', adapt: 'Swap the event name, date, and instrument while keeping the text regions short.' },
  { id: 'botanical-poster', lesson: 'Three non-overlapping JSON regions give the title, subtitle, and fern enough room to breathe.', adapt: 'Change the two text values and the object caption before moving any bounding box.' },
  { id: 'product-showcase', lesson: 'Narrow text bands above a large object region create a familiar product-advertising structure.', adapt: 'Replace the brand, tagline, product type, and bottle count while preserving the broad spacing.' },
  { id: 'still-life', lesson: 'A clear object relationship, directional light, and a narrow palette create a coherent still life.', adapt: 'Change the paired objects or seasonal detail while keeping one light direction.' },
  { id: 'bookshop', lesson: 'The prompt adds the setting, shelves, cat, lamps, and rainy window in a readable order.', adapt: 'Replace the shop type, animal, or weather one element at a time.' },
  { id: 'm1', lesson: 'Exact quoted menu lines make mistakes easy to identify during proofreading.', adapt: 'Keep the four-line structure but replace each item and price with your own short wording.' },
  { id: 'm2', lesson: 'Each menu row pairs one Chinese dish name with one English translation and a short price.', adapt: 'Use common characters first and keep each bilingual row concise.' },
  { id: 'm5', lesson: 'Three short label lines test hierarchy and lettering on a curved product surface.', adapt: 'Replace the product name, descriptor, and net weight, then inspect every character at full size.' },
  { id: 'm6', lesson: 'A heading pair, three event details, and a final Chinese line form a realistic bilingual stress test.', adapt: 'Replace the event name and details while preserving one line per information type.' },
] as const;

export function PromptShowcaseArticle() {
  return <>
    <section id="ten-real-prompts">
      <h2>Ten real prompts</h2>
      <p>Every example below is a published gallery output, with its original prompt, saved seed, model label, and generation settings. The images were converted to WebP for delivery; they were not cropped or rerun to improve the result.</p>
      <div className="blog-prompt-list">
        {examples.map((example, index) => {
          const image = featuredImageById(example.id)!;
          return <article key={image.id} id={`prompt-${index + 1}`}>
            <div className="blog-prompt-image"><Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 100vw, 680px"/></div>
            <div className="blog-prompt-copy">
              <span className="eyebrow">{String(index + 1).padStart(2, '0')} · {image.label}</span>
              <h3>{image.title}</h3>
              <p><strong>Why it works:</strong> {example.lesson}</p>
              <p><strong>How to adapt it:</strong> {example.adapt}</p>
              <p className="small-note"><strong>{image.model}</strong> · {image.settings} · Seed {image.seed} · {image.cropped ? 'cropped' : 'not cropped'}</p>
              <details className="blog-prompt-details"><summary>View the original {image.mode === 'layout' ? 'JSON layout' : 'prompt'}</summary><pre>{image.prompt}</pre></details>
              <Link className="inline-action" href={featuredImageHref(image.id)}>Open in the studio</Link>
            </div>
          </article>;
        })}
      </div>
    </section>
    <section id="what-the-examples-have-in-common">
      <h2>What the examples have in common</h2>
      <p>Visible wording stays short and quoted. Lighting is described by direction and quality. Each sentence adds one visual idea. Text gets a concrete treatment such as serif, sans-serif, neon, or handwritten lettering. Structured jobs use JSON layout; atmospheric scenes stay as free-form prompts.</p>
      <p>These patterns improve clarity, but they do not guarantee perfect lettering. Proofread every output at full resolution, especially prices, dates, weights, and Chinese characters with similar forms.</p>
    </section>
    <section id="build-your-own-prompt">
      <h2>Build your own prompt</h2>
      <p>Start from the closest example and change one variable: wording, subject, lighting, or layout. Generate once, inspect the result, and then change the next variable. The prompt builder can assemble a new free-form prompt, while the JSON Layout Generator creates a structured template.</p>
      <div className="related-links"><Link href="/guide/prompt/">Open the Prompt Builder</Link><Link href="/json-layout/">Build a JSON layout</Link><Link href="/presets/infographic/">Try the infographic preset</Link><Link href="/presets/quote-card/">Try the quote-card preset</Link><Link href="/gallery/">Browse all 31 examples</Link></div>
    </section>
  </>;
}
