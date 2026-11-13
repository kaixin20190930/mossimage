import { defaultOpenGraphImage } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.online;
const canonical = 'https://mossimage.run/moss-image-generator-online/';

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/moss-image-generator-online/' },
  openGraph: { ...defaultOpenGraphImage, title: page.title, description: page.description, url: '/moss-image-generator-online/', type: 'website' },
};

const sections = [
  { id: 'browser', title: 'Generate in your browser' },
  { id: 'start', title: 'Start with three images' },
  { id: 'features', title: 'Text and layout controls' },
  { id: 'compare', title: 'Online or local?' },
] as const;

export default function MossImageGeneratorOnlinePage() {
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
        about: { '@type': 'SoftwareApplication', name: 'MOSS-Image Generator', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Online Generator', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Online Generator' }]}
      eyebrow="BROWSER-BASED STUDIO"
      title={page.heading}
      intro="Use the hosted MOSS-Image SFT model directly in your browser. There is no model download, local GPU, Python environment, or ComfyUI graph to configure before your first image."
      sections={sections}
      bottomLink={{ href: '/guide/local-deploy/', label: 'Compare local setup' }}
      publishedDate="October 26, 2026"
    >
      <section id="browser">
        <h2>Generate with MOSS-Image in your browser</h2>
        <p>The online studio sends your prompt and selected canvas settings to the hosted fal.ai MOSS-Image SFT endpoint. It returns one image at a time, shows the seed, and lets you open or download the result.</p>
        <p>You do not need to download model weights or keep a GPU running. Email verification creates your account and protects its image credits.</p>
        <Link className="inline-action" href="/?model=sft#studio">Open the online studio</Link>
      </section>

      <section id="start">
        <h2>Start with three images and no credit card</h2>
        <p>A verified account receives three one-time starter image credits. No subscription begins automatically, and no payment details are requested for those starter images. Generation remains subject to the shared daily service budget and cooldown.</p>
        <div className="related-links"><Link href="/free/">See what the free starter credits include</Link><Link href="/pricing/">Compare paid credit options</Link></div>
      </section>

      <section id="features">
        <h2>Use text prompts or structured JSON layouts</h2>
        <p>Text mode is the quickest starting point for illustrations, product concepts, posters, and editorial scenes. Quote any wording that should appear inside the image, then proofread the result before publishing it.</p>
        <p>JSON Layout mode accepts a scene summary plus intended regions for text and objects. The coordinates guide composition but do not guarantee pixel-perfect placement.</p>
        <div className="related-links"><Link href="/guide/prompt/">Build a prompt</Link><Link href="/guide/json-layout-generator/">Build a JSON layout</Link><Link href="/gallery/">See real outputs</Link></div>
      </section>

      <section id="compare">
        <h2>Choose online convenience or local control</h2>
        <div className="comparison-table-wrap"><table><thead><tr><th>Path</th><th>What you manage</th><th>Best for</th></tr></thead><tbody><tr><th>Online studio</th><td>Prompt, layout, canvas, and credits</td><td>Trying SFT quickly without installation</td></tr><tr><th>Local ComfyUI</th><td>Weights, dependencies, memory, workflow, and hardware</td><td>Base access, custom workflows, and self-hosted generation</td></tr></tbody></table></div>
        <p>Base is available through the local workflow, while this hosted studio uses SFT. If you need checkpoint-level control, continue with the <Link href="/guide/local-deploy/">local installation guide</Link> or download a matching <Link href="/workflows/">ComfyUI workflow</Link>.</p>
      </section>
    </EditorialPage>
  </>;
}
