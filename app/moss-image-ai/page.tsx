import { defaultOpenGraphImage } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.mossImageAi;
const canonical = 'https://mossimage.run/moss-image-ai/';

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/moss-image-ai/' },
  openGraph: { ...defaultOpenGraphImage, title: page.title, description: page.description, url: '/moss-image-ai/', type: 'article' },
};

const sections = [
  { id: 'model', title: 'What is MOSS-Image?' },
  { id: 'checkpoints', title: 'Base and SFT checkpoints' },
  { id: 'text', title: 'Text inside images' },
  { id: 'layout', title: 'JSON layout guidance' },
  { id: 'use', title: 'Use it online or locally' },
] as const;

export default function MossImageAiPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: page.heading,
        description: page.description,
        datePublished: '2026-10-26',
        dateModified: '2026-10-26',
        mainEntityOfPage: canonical,
        author: { '@type': 'Organization', name: 'Moxion Labs LLC', url: 'https://mossimage.run/' },
        publisher: { '@id': 'https://mossimage.run/#organization' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'MOSS Image AI', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'MOSS Image AI' }]}
      eyebrow="MODEL OVERVIEW"
      title={page.heading}
      intro="MOSS-Image is an open-source image-generation model family from OpenMOSS. Its workflow supports natural-language prompts, visible English and Chinese wording, and experimental JSON layout guidance."
      sections={sections}
      bottomLink={{ href: '/compare/', label: 'Compare image models' }}
      publishedDate="October 26, 2026"
    >
      <section id="model">
        <h2>What is MOSS-Image?</h2>
        <p>MOSS-Image is a 5-billion-parameter text-to-image model family published by OpenMOSS. The project releases model weights, inference examples, and ComfyUI workflows for local use.</p>
        <p>Mossimage.run is an independent studio built around that model family. It is not the OpenMOSS project website and is not affiliated with OpenMOSS or fal.ai.</p>
      </section>

      <section id="checkpoints">
        <h2>Base and SFT serve different workflows</h2>
        <p>Base is the foundation checkpoint intended for evaluation, LoRA training, and custom post-training. SFT is the supervised fine-tuned checkpoint intended for more direct image generation. Both are released under Apache 2.0.</p>
        <p>This online studio uses the hosted SFT endpoint. Base and SFT can both be run locally with their matching model files and ComfyUI workflows.</p>
        <Link className="inline-action" href="/compare/base-vs-sft/">Compare Base and SFT</Link>
      </section>

      <section id="text">
        <h2>Request English and Chinese text inside an image</h2>
        <p>Prompts can include quoted wording for posters, menus, labels, and visual concepts. MOSS-Image supports English, Chinese, and bilingual requests, although every generated word still needs proofreading before publication.</p>
        <div className="related-links"><Link href="/text-in-image-generator/">Explore text-in-image examples</Link><Link href="/chinese-ai-image-generator/">Read the Chinese text guide</Link><Link href="/gallery/">View real outputs</Link></div>
      </section>

      <section id="layout">
        <h2>Guide composition with structured JSON</h2>
        <p>JSON Layout prompts describe the overall scene and list intended regions for text or objects. MOSS-Image treats those bounding boxes as experimental layout guidance rather than exact design coordinates.</p>
        <div className="related-links"><Link href="/json-layout/">Build a JSON layout</Link><Link href="/guide/json-layout/">Read the field reference</Link></div>
      </section>

      <section id="use">
        <h2>Try SFT online or run the checkpoints locally</h2>
        <p>Use the browser studio when you want to test prompts without downloading weights. Use the local path when you need Base, a custom ComfyUI graph, or control over model files and hardware.</p>
        <div className="related-links"><Link href="/#studio">Use MOSS-Image online</Link><Link href="/guide/local-deploy/">Install MOSS-Image locally</Link><Link href="/workflows/">Download ComfyUI workflows</Link></div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Model details and licenses checked October 26, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image" target="_blank" rel="noreferrer">OpenMOSS MOSS-Image repository</a>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-Base" target="_blank" rel="noreferrer">MOSS-Image Base model card</a>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT" target="_blank" rel="noreferrer">MOSS-Image SFT model card</a>
      </section>
    </EditorialPage>
  </>;
}
