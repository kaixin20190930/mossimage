import { defaultOpenGraphImage } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { PromptBuilder } from '@/components/prompt-builder';
import { PromptExample } from '@/components/prompt-example';
import { featuredImageHref, featuredImages } from '@/lib/featured-images';
import { contentLastModified } from '@/lib/content-dates';
import { landingPages, publishedDate, publishedIsoDate } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.prompt;
const modifiedDate = contentLastModified[page.slug];
const modifiedLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${modifiedDate}T00:00:00Z`));
const canonical = 'https://mossimage.run/guide/prompt/';
const byId = (id: string) => featuredImages.find(image => image.id === id)!;
const menu = byId('bilingual-menu');
const jazz = byId('jazz-poster');
const botanical = byId('botanical-poster');
const product = byId('product-showcase');
const stillLife = byId('still-life');
const bookshop = byId('bookshop');

const productPhoto = 'A premium amber glass perfume bottle on a pale limestone pedestal, minimal studio product photography, warm beige background, soft diffused light from the upper left, a gentle shadow falling to the right, centered composition, realistic glass reflections, refined editorial advertising style, 1024×1024';
const portrait = 'An editorial portrait of a ceramic artist in a sunlit workshop, waist-up framing, subject placed on the right third, shelves of handmade vessels softly blurred behind her, late-afternoon window light, warm earth tones, natural skin texture, quiet documentary photography, 1024×1024';
const coffeePosterDraft = 'A minimal cream-colored coffee poster with a small cup illustration in the lower half. At the top, a large dark-brown heading reads "晨光咖啡". Directly below it, a smaller subtitle reads "MORNING COFFEE". Leave generous space between the two lines. Use simple bold lettering, a warm brown and cream palette, and soft morning light.';

const studioHref = (prompt: string) => `/?prompt=${encodeURIComponent(prompt)}#studio`;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/guide/prompt/' },
  openGraph: { ...defaultOpenGraphImage, title: page.title, description: page.description, url: '/guide/prompt/', type: 'article' },
};

const sections = [
  { id: 'builder', title: 'Build a prompt' },
  { id: 'proven', title: 'Proven prompts and writing tips' },
  { id: 'system-prompt', title: 'System prompt and prompt expansion' },
  { id: 'complete-prompt', title: 'A complete prompt to copy' },
  { id: 'refine', title: 'Refine a failed text prompt' },
  { id: 'results', title: 'See the prompts as real outputs' },
  { id: 'known-limitations', title: 'Known limitations' },
] as const;

export default function PromptGuidePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        name: page.heading,
        url: canonical,
        description: page.description,
        datePublished: publishedIsoDate,
        dateModified: modifiedDate,
        isPartOf: { '@id': 'https://mossimage.run/#website' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Guides', url: 'https://mossimage.run/guide/' },
        { name: 'Prompt Guide and Builder', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Guides', href: '/guide/' }, { label: 'Prompt Guide and Builder' }]}
      eyebrow="INTERACTIVE PROMPT TOOL"
      title={page.heading}
      intro="This MOSS-Image prompting guide starts with a builder: combine a subject, style, lighting, and visible text, then copy the prompt or open it in the studio."
      sections={sections}
      bottomLink={{ href: '/guide/', label: 'All guides' }}
      publishedDate={`${publishedDate} · Updated ${modifiedLabel}`}
    >
      <section id="builder" className="builder-section">
        <PromptBuilder/>
      </section>

      <div className="prompt-guide-start">
        <div><h2>How to use this MOSS-Image prompting guide</h2><span>New to prompt writing? Start with “Describe the subject and medium first,” then browse the proven prompts. Already prompting and refining details? Continue to lighting, exact bilingual text, and JSON layout guidance.</span></div>
        <a className="inline-action" href="#proven">Browse proven prompts</a>
      </div>

      <details className="guide-disclosure" id="proven">
        <summary><span>Try eight proven prompts</span><small>Subjects, lighting, bilingual text, and JSON layouts</small></summary>
        <div>
      <section id="subject">
        <h2>Describe the subject and medium first</h2>
        <p>Open with the image&apos;s main job: name the subject, setting, and medium before adding style details. These two prompts establish a clear scene without conflicting instructions.</p>
        <PromptExample label="Whimsical editorial illustration" prompt={bookshop.prompt} href={featuredImageHref(bookshop.id)}/>
        <PromptExample label="Minimal product photograph" prompt={productPhoto} href={studioHref(productPhoto)}/>
      </section>

      <section id="light">
        <h2>Control lighting and composition</h2>
        <p>Describe where the light comes from, how the subject is framed, and which parts should stay soft or sharp. Keep those instructions concrete enough to visualize.</p>
        <PromptExample label="Warm still life" prompt={stillLife.prompt} href={featuredImageHref(stillLife.id)}/>
        <PromptExample label="Environmental portrait" prompt={portrait} href={studioHref(portrait)}/>
      </section>

      <section id="text">
        <h2>Write exact Chinese and English text into the image</h2>
        <p>Put every required phrase in quotation marks, describe its position and visual treatment, and keep the wording short. Generated lettering still needs proofreading before publication.</p>
        <p>Use the <Link href="/text-in-image-generator/">AI text-in-image generator</Link> when you want recorded menu, label, and poster outputs plus a direct path into the studio.</p>
        <PromptExample label="Bilingual café menu" prompt={menu.prompt} href={featuredImageHref(menu.id)}/>
        <PromptExample label="Chinese and English concert poster" prompt={jazz.prompt} href={featuredImageHref(jazz.id)}/>
      </section>

      <section id="layout">
        <h2>Place text and objects with JSON layout</h2>
        <p>Use structured layouts when relative position matters more than free composition. Start with a summary and a few large, non-overlapping regions before adding detail. Follow the <Link href="/guide/json-layout/">json bbox layout</Link> reference for centered coordinates and complete examples.</p>
        <PromptExample label="Botanical poster layout" prompt={botanical.prompt} href={featuredImageHref(botanical.id)}/>
        <PromptExample label="Product showcase layout" prompt={product.prompt} href={featuredImageHref(product.id)}/>
      </section>
        </div>
      </details>

      <section id="system-prompt">
        <h2>Do you need a MOSS-Image system prompt?</h2>
        <p>This studio accepts an image prompt, not a separate system prompt. Write the subject, medium, layout, and any exact text in the prompt field. In text mode, the hosted endpoint applies prompt expansion; JSON layout mode sends the structured layout without that expansion. You cannot edit the provider&apos;s system instructions here.</p>
        <p>If you use MOSS-Image through your own workflow, keep any system instructions separate from the image description and check what that workflow actually supports. For this studio, put the instructions you control in the image prompt below.</p>
      </section>

      <section id="complete-prompt">
        <h2>A complete MOSS-Image prompt to copy</h2>
        <p>This bilingual menu prompt produced a recorded image on this site. It names the scene, specifies the visible wording, and gives the text a clear place in the composition. Copy it as a starting point and proofread the generated result.</p>
        <PromptExample label="Bilingual café menu · recorded output" prompt={menu.prompt} href={featuredImageHref(menu.id)}/>
      </section>

      <section id="refine">
        <h2>Refine a MOSS-Image prompt when text goes wrong</h2>
        <p>Diagnose one failure before rewriting the whole scene. If a headline is misspelled, shorten and quote that line. If the words are correct but crowded, simplify the surrounding scene and give the headline more space. If placement keeps drifting, move the text into separate JSON regions.</p>
        <p><strong>Vague request:</strong> “Make a stylish bilingual coffee poster with lots of menu details.” This leaves the model to invent the wording, hierarchy, and amount of text.</p>
        <p><strong>More specific request:</strong> use the draft below to separate exact copy from visual instructions. It is a writing example, not a tested generation.</p>
        <PromptExample label="Draft: a short bilingual coffee poster" prompt={coffeePosterDraft} href={studioHref(coffeePosterDraft)}/>
        <ol>
          <li>Save the original prompt, result, seed, model, canvas size, steps, and CFG. Use the <Link href="/guide/settings/">moss image settings</Link> reference to establish a baseline, then keep those values fixed while comparing prompt revisions; a seed alone does not reproduce an image across different models or workflows.</li>
          <li>Change only the instruction tied to the failure. For spelling, remove extra copy and retain the exact quoted headline. For crowding, adjust spacing without changing the headline or lighting.</li>
          <li>Inspect every Chinese character, English word, and punctuation mark at full size. Keep a revision only if it fixes the target issue without losing another required detail.</li>
          <li>Once the wording works, add one subtitle or detail at a time. If repeated attempts still miss exact lettering, place approved text in a design tool before printing or publishing.</li>
        </ol>
        <p>For placement problems, follow the <Link href="/guide/json-layout/">MOSS-Image JSON prompt layout reference</Link>. To compare wording against recorded outputs, use the <Link href="/blog/best-moss-image-prompts-examples-seeds/">MOSS-Image prompt examples with seeds</Link>.</p>
      </section>

      <section id="results">
        <h2>These prompts produced real images</h2>
        <p>The two examples below were generated with MOSS-Image SFT through this studio. Use them as starting points, then change one detail at a time.</p>
        <p>For more reproducible starting points, study these <Link href="/blog/best-moss-image-prompts-examples-seeds/">proven MOSS-Image prompts with seeds</Link>.</p>
        <div className="prompt-results">
          {[menu, botanical].map(image => <figure key={image.id}><div><Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 100vw, 35vw"/></div><figcaption>{image.title}<span>{image.label}</span></figcaption></figure>)}
        </div>
        <div className="related-links">
          <Link href="/gallery/">Browse all real creations</Link>
          <Link href="/chinese-ai-image-generator/">Chinese text generation guide</Link>
          <Link href="/guide/json-layout/">JSON layout guide</Link>
          <Link href="/json-layout/">JSON layout generator</Link>
        </div>
      </section>

      <section id="known-limitations">
        <h2>Known limitations</h2>
        <p>If you need faster draft iterations, choose a matching adapter recipe in the <Link href="/guide/turbo-lora/">moss turbo lora</Link> guide before judging the final text quality.</p>
        <p>Generated lettering is probabilistic. Quotation marks, shorter phrases, clear placement language, and JSON regions can improve the request, but every word and number still needs proofreading before publication.</p>
        <p>Style names are not deterministic presets. Describe observable traits such as medium, palette, lighting, texture, framing, and typography instead of relying on an artist or genre label alone.</p>
        <p>Save the seed when a composition works. Change one prompt detail at a time, because different seeds can move text, objects, and visual style substantially even when the wording stays the same.</p>
        <div className="related-links"><Link href="/guide/settings/">Local generation settings</Link><Link href="/troubleshooting/">Troubleshooting index</Link></div>
      </section>

      <section className="prompt-final-cta">
        <h2>Turn one of these prompts into your own image</h2>
        <p>Open the studio, edit the subject, text, light, or layout, and generate when it feels like yours. Three starter images are free.</p>
        <Link className="inline-action" href="/?example=bilingual-menu#studio">Open the studio</Link>
      </section>

      <section className="sources">
        <h2>Official source</h2>
        <p>Prompt formats and model guidance checked October 24, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/USERGUIDE.md" target="_blank" rel="noreferrer">OpenMOSS user guide</a>
      </section>
    </EditorialPage>
  </>;
}
