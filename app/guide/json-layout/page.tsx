import { defaultOpenGraphImage } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { contentLastModified } from '@/lib/content-dates';
import { layoutExample } from '@/lib/generation';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.jsonLayout;
const canonical = 'https://mossimage.run/guide/json-layout/';
const modifiedDate = contentLastModified['guide/json-layout'];

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/guide/json-layout/' },
  openGraph: { ...defaultOpenGraphImage, title: page.title, description: page.description, url: '/guide/json-layout/', type: 'article' },
};

const sections = [
  { id: 'definition', title: 'What is a JSON image prompt?' },
  { id: 'example', title: 'Working example' },
  { id: 'fields', title: 'Field reference' },
  { id: 'bbox', title: 'What a bbox means' },
  { id: 'coordinates', title: 'Centered coordinates' },
  { id: 'errors', title: 'Common errors' },
  { id: 'try', title: 'Try it online' },
] as const;

export default function JsonLayoutPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.description,
        dateModified: modifiedDate,
        isPartOf: { '@id': 'https://mossimage.run/#website' },
        about: { '@type': 'Thing', name: 'MOSS-Image JSON layout prompts' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Guides', url: 'https://mossimage.run/guide/' },
        { name: 'JSON Layout', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Guides', href: '/guide/' }, { label: 'JSON Layout' }]}
      eyebrow="LAYOUT CONTROL"
      title={page.heading}
      intro="Describe an image as structured data, give every text or object item an intended region, and open a validated example directly in the online studio."
      sections={sections}
      bottomLink={{ href: '/guide/', label: 'All guides' }}
      publishedDate="October 23, 2026 · Updated November 8, 2026"
    >
      <div className="prompt-guide-start">
        <div><strong>Want a faster starting point?</strong><span>Pick a template, replace its text, and export valid layout JSON.</span></div>
        <Link className="inline-action" href="/json-layout/">Open the JSON Layout Generator</Link>
      </div>

      <section id="definition">
        <h2>What is a JSON image prompt?</h2>
        <p>A JSON image prompt describes an image as structured data instead of one sentence: a summary caption plus a list of items, each with a label, caption, and bounding box. MOSS-Image reads that structure as layout guidance, giving text and objects intended regions instead of relying only on spatial adjectives.</p>
        <p>OpenMOSS marks layout prompts as experimental. Coordinates make the request more explicit, but they do not turn image generation into a pixel-perfect design tool. The final position, lettering, and visual details can still vary.</p>
      </section>

      <section id="example">
        <h2>A working JSON image prompt</h2>
        <p>This 1024 × 1024 example is accepted by the studio&apos;s JSON Layout validator. It asks for a title in the upper half and a fern in the lower half.</p>
        <div className="code-block"><pre><code>{layoutExample}</code></pre></div>
        <p>Start with two or three large items. Leave space between regions, keep required text short, and change one box at a time when refining the composition.</p>
      </section>

      <section id="fields">
        <h2>JSON Layout field reference</h2>
        <div className="comparison-table-wrap">
          <table>
            <thead><tr><th>Field</th><th>Required value</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><th><code>summary.caption</code></th><td>String</td><td>Describes the overall scene, medium, palette, and visual relationship between items.</td></tr>
              <tr><th><code>items</code></th><td>Array</td><td>Lists the text and object elements to guide on the canvas.</td></tr>
              <tr><th><code>label</code></th><td><code>text</code> or <code>object</code></td><td>Identifies the type of each item.</td></tr>
              <tr><th><code>caption</code></th><td>String</td><td>Describes the item&apos;s appearance, role, and intended position.</td></tr>
              <tr><th><code>text</code></th><td>String for text items</td><td>Contains the exact visible wording requested from the model.</td></tr>
              <tr><th><code>bbox</code></th><td>Four numbers</td><td>Sets the intended region as <code>[top, left, bottom, right]</code>.</td></tr>
              <tr><th><code>bbox_format</code></th><td><code>yxyx</code></td><td>Declares the bounding-box value order.</td></tr>
              <tr><th><code>bbox_coord_space</code></th><td><code>abs_centralized</code></td><td>Uses absolute pixel coordinates measured from the canvas center.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="bbox">
        <h2>What a bbox actually is</h2>
        <p>A bbox is the intended rectangular region for one text or object item. In this MOSS-Image layout format, it contains four values in <code>yxyx</code> order: <code>[top, left, bottom, right]</code>.</p>
        <p>The coordinates are absolute pixel offsets measured from the center of the selected canvas, not from its top-left corner. On a 1024 × 1024 canvas, both axes run from −512 to +512.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Value</th><th>Meaning</th><th>Common mistake</th></tr></thead><tbody>
          <tr><th><code>top</code></th><td>Upper y edge</td><td>Using a positive value for an upper-half box</td></tr><tr><th><code>left</code></th><td>Left x edge</td><td>Treating it as a width</td></tr><tr><th><code>bottom</code></th><td>Lower y edge</td><td>Making it smaller than <code>top</code></td></tr><tr><th><code>right</code></th><td>Right x edge</td><td>Making it smaller than <code>left</code></td></tr><tr><th><code>caption</code></th><td>Describes the item and visual role</td><td>Expecting the bbox alone to describe the object</td></tr><tr><th><code>text</code></th><td>Exact requested wording for a text item</td><td>Omitting it when <code>label</code> is <code>text</code></td></tr>
        </tbody></table></div>
        <p>For example, <code>[-400, -420, -180, 420]</code> means a wide region in the upper half of a 1024 × 1024 canvas. A bbox reserves an intended region; it does not lock pixels or guarantee typography. Avoid overlapping boxes unless competing layout guidance is intentional—the result is model-dependent.</p>
      </section>

      <section id="coordinates">
        <h2>How centered bounding boxes work</h2>
        <p>For a 1024 × 1024 canvas, the horizontal and vertical axes both run from −512 to +512. The canvas center is <code>[0, 0]</code>. Negative x values move left, positive x values move right, negative y values move up, and positive y values move down.</p>
        <p>A box of <code>[-400, -420, -180, 420]</code> therefore occupies a wide region in the upper half. The top value must be smaller than the bottom value, the left value must be smaller than the right value, and every edge must remain within the chosen canvas.</p>
        <div className="callout">
          <strong>Changing the canvas changes the valid range.</strong>
          <p>The portrait and landscape options use different width and height limits. This site validates every box against the selected canvas before sending a paid generation request.</p>
        </div>
      </section>

      <section id="errors">
        <h2>Common JSON prompt errors</h2>
        <ul>
          <li>Using top-left coordinates instead of coordinates measured from the center.</li>
          <li>Writing boxes as <code>[left, top, right, bottom]</code> instead of the required <code>yxyx</code> order.</li>
          <li>Leaving out the <code>text</code> value on an item labeled <code>text</code>.</li>
          <li>Placing a box partly outside the selected canvas.</li>
          <li>Creating overlapping regions or text boxes too small for their wording.</li>
          <li>Expecting a generated result to reproduce typography with design-software precision.</li>
        </ul>
        <p>For bilingual designs, see the <Link href="/chinese-ai-image-generator/">Chinese AI image generator guide</Link> for a working Chinese and English layout example.</p>
        <p>For posters, menus, and labels where readable wording is the main goal, start with the <Link href="/text-in-image-generator/">AI text-in-image generator</Link>, then add JSON regions when placement needs more control.</p>
      </section>

      <section id="try">
        <h2>Open a JSON prompt in the generator</h2>
        <p>The studio includes the working botanical example shown above. The link below opens JSON Layout mode, where you can edit the caption, text, and coordinates before generating.</p>
        <Link className="inline-action" href="/?mode=layout#studio">Open JSON Layout mode </Link>
        <div className="related-links">
          <Link href="/json-layout/">JSON Layout Generator</Link>
          <Link href="/guide/prompt/">Prompt writing tips </Link>
          <Link href="/chinese-ai-image-generator/">Chinese text layouts </Link>
          <Link href="/gallery/">View real MOSS-Image creations</Link>
        </div>
      </section>

      <section className="sources">
        <h2>Official source</h2>
        <p>Format and coordinate rules checked October 23, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/USERGUIDE.md#layout-prompts-experimental" target="_blank" rel="noreferrer">OpenMOSS Layout Prompts specification </a>
      </section>
    </EditorialPage>
  </>;
}
