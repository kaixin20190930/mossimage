import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { landingPages, publishedIsoDate } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.baseVsSft;
const canonical = 'https://mossimage.run/compare/base-vs-sft/';

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/compare/base-vs-sft/' },
  openGraph: { title: page.title, description: page.description, url: '/compare/base-vs-sft/', type: 'article' },
};

const sections = [
  { id: 'answer', title: 'The short answer' },
  { id: 'comparison', title: 'Base vs SFT at a glance' },
  { id: 'fixing-sft-vertical-stripes', title: 'Fixing SFT vertical stripes' },
  { id: 'test-protocol', title: 'Run a controlled comparison' },
  { id: 'community-notes', title: 'Community findings' },
  { id: 'comfyui', title: 'Switching in ComfyUI' },
  { id: 'choose', title: 'Which model should you use?' },
] as const;

export default function BaseVsSftPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: page.heading,
        description: page.description,
        datePublished: publishedIsoDate,
        dateModified: '2026-10-31',
        mainEntityOfPage: canonical,
        author: { '@type': 'Organization', name: 'Moxion Labs LLC', url: 'https://mossimage.run/' },
        publisher: { '@id': 'https://mossimage.run/#organization' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Comparisons', url: 'https://mossimage.run/compare/' },
        { name: 'MOSS-Image Base vs SFT', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Comparisons', href: '/compare/' }, { label: 'MOSS-Image Base vs SFT' }]}
      eyebrow="MODEL COMPARISON"
      title={page.heading}
      intro="Base preserves the foundation checkpoint for evaluation, LoRA training, and custom post-training. SFT starts from Base and adds supervised fine-tuning for a more ready-to-use generation experience. Both support natural-language prompts, tag sequences, bilingual text, and JSON layouts."
      sections={sections}
      bottomLink={{ href: '/compare/', label: 'All comparisons' }}
    >
      <section id="answer">
        <h2>The short answer</h2>
        <div className="callout">
          <strong>Choose SFT for direct image generation. Choose Base when you want the un-post-trained foundation checkpoint for evaluation, LoRA training, or your own tuning work.</strong>
          <p>SFT uses the same architecture and inference pipeline as Base. It is a supervised fine-tuned descendant rather than a separate model family.</p>
        </div>
        <p>OpenMOSS shows SFT producing clearer text grouping and a more organized whiteboard layout in its published comparison. That is useful evidence for that example, not a promise that SFT wins every prompt. Test the scenes, lettering, and layouts that matter to your work.</p>
      </section>

      <section id="comparison">
        <h2>Base vs SFT at a glance</h2>
        <div className="comparison-table-wrap">
          <table>
            <thead><tr><th>Area</th><th>MOSS-Image Base</th><th>MOSS-Image SFT</th></tr></thead>
            <tbody>
              <tr><th>Text rendering</th><td>Supports English, Chinese, line breaks, and text inside images; results still need proofreading.</td><td>Supports the same formats; the official comparison shows clearer text grouping in its example.</td></tr>
              <tr><th>JSON layout</th><td>Supports JSON regions for text placement and object arrangement.</td><td>Uses the same architecture and pipeline and supports the same JSON layout format.</td></tr>
              <tr><th>License</th><td>Apache 2.0.</td><td>Apache 2.0.</td></tr>
              <tr><th>Download</th><td>Separate Base repository on Hugging Face; suitable as a foundation for LoRA or post-training work.</td><td>Separate SFT repository on Hugging Face; derived from Base and ready for direct inference.</td></tr>
              <tr><th>ComfyUI setup</th><td>Load the Base weights with a matching native or HF-directory workflow.</td><td>Load the SFT weights with the same model family pipeline and a matching workflow.</td></tr>
              <tr><th>Best fit</th><td>Controlled evaluation, LoRA training, research, and custom post-training. <Link href="/guide/base-guide/">Read the Base guide.</Link></td><td>Prompt-to-image creation, text-led graphics, and hosted or local generation.</td></tr>
            </tbody>
          </table>
        </div>
        <p className="small-note">JSON layout control is shared by both checkpoints. It is not an SFT-only feature.</p>
      </section>

      <section id="fixing-sft-vertical-stripes">
        <h2>Fixing faint vertical stripes in SFT</h2>
        <p>Some users have reported evenly spaced vertical color bands in smooth SFT backgrounds such as skies, fog, walls, and studio backdrops. The report and the fixes below are community work, not an official guarantee or a problem documented on the model card. Base was not affected in the cited comparison.</p>
        <div className="callout">
          <strong>Start with the small DeStripe LoRA.</strong>
          <p>It is easy to bypass, keeps the original SFT checkpoint intact, and makes a fixed-seed before-and-after test straightforward.</p>
        </div>
        <h3>Option 1: SFT-DeStripe LoRA</h3>
        <ol>
          <li>Download the community LoRA from <a href="https://huggingface.co/nynxz/MOSS-Image" target="_blank" rel="noreferrer">nynxz/MOSS-Image</a>.</li>
          <li>Add <code>LoraLoaderModelOnly</code> after the SFT model loader.</li>
          <li>Use the author&apos;s published starting strengths: 1.0 around 768 px or 1.5 around 1024 px.</li>
          <li>Keep the prompt, seed, dimensions, sampler, and steps unchanged, then compare with the node enabled and bypassed.</li>
        </ol>
        <p>The adapter is intended for SFT. Bypass it when loading Base. Check the adapter page again before use because community files and recommended values can change.</p>
        <h3>Option 2: a community DeBand checkpoint</h3>
        <p>A merged or quantized community checkpoint can remove an extra LoRA node, but it also replaces the model file you are evaluating. Record the exact filename, hash, precision, and workflow, then compare against the original SFT checkpoint before adopting it. See <a href="https://huggingface.co/MATLOWAI/MOSS-Image-SFT-DeBand" target="_blank" rel="noreferrer">MATLOWAI/MOSS-Image-SFT-DeBand</a> for the maintainer&apos;s current variants and instructions.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Setup</th><th>Safer starting point</th></tr></thead><tbody>
          <tr><th>Keep original SFT and switch fixes on/off</th><td>Use the DeStripe LoRA and run a fixed-seed comparison.</td></tr>
          <tr><th>Prefer one prepared model file</th><td>Use a community DeBand checkpoint, matching its documented precision and workflow.</td></tr>
          <tr><th>Using Base</th><td>Do not add an SFT stripe fix unless a reproducible test shows that you need it.</td></tr>
          <tr><th>Using a Turbo adapter</th><td>Follow that adapter&apos;s own settings; do not assume the standard SFT recipe is compatible.</td></tr>
        </tbody></table></div>
      </section>

      <section id="test-protocol">
        <h2>Run a controlled Base vs SFT comparison</h2>
        <p>This is the comparison protocol used by mossimage.run when reviewing local Base and SFT results. It keeps the visible variables fixed so a checkpoint change is not confused with a different workflow, seed, or sampler.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Keep fixed</th><th>Record for every run</th></tr></thead><tbody>
          <tr><td>Workflow type: native or HF-directory plugin</td><td>Exact workflow source and ComfyUI build</td></tr>
          <tr><td>Prompt, negative prompt, seed, dimensions</td><td>Full prompt and numeric seed</td></tr>
          <tr><td>Sampler, scheduler, steps, CFG, shift</td><td>Every visible sampling value</td></tr>
          <tr><td>Precision and offload settings</td><td>Checkpoint filename, precision, and hardware</td></tr>
          <tr><td>No crop, retouch, or prompt rewrite</td><td>Unedited output plus generation time</td></tr>
        </tbody></table></div>
        <ol>
          <li>Import the matching official workflow and confirm one successful reference image.</li>
          <li>Save the graph, prompt, seed, and settings before changing the checkpoint.</li>
          <li>Switch only Base to SFT, or SFT to Base, without replacing the workflow type.</li>
          <li>Compare text accuracy, layout, banding, composition, and failure modes at full resolution.</li>
          <li>Repeat with at least three seeds before drawing a conclusion.</li>
        </ol>
        <p className="small-note">This protocol deliberately does not publish a winner without matched local files. The hosted studio serves SFT only; Base evidence will be added after a controlled local run is available.</p>
      </section>

      <section id="community-notes">
        <h2>Community findings worth testing</h2>
        <h3>Base often needs more guidance for short prompts</h3>
        <p>The official Base user guide sets CFG 3 as the default and recommends roughly 3–6, with higher guidance for shorter prompts. That makes a controlled CFG sweep more useful than concluding that Base is simply weaker from one low-guidance run.</p>
        <h3>Seeds matter</h3>
        <p>Save the seed whenever an output is promising. Compare checkpoints and fixes with identical visible settings, but do not expect different loaders, precisions, or schedulers to produce pixel-identical results.</p>
        <h3>Model file size is not a VRAM promise</h3>
        <p>Runtime memory depends on precision, resolution, offloading, text-encoder placement, VAE behavior, and which components remain resident. If output is noisy, blurry, or unexpectedly weak, use the <Link href="/guide/settings/">settings guide</Link> to establish a known-good reference run before reducing precision or increasing canvas size.</p>
      </section>

      <section id="comfyui">
        <h2>How to switch Base and SFT in ComfyUI</h2>
        <p>Keep the workflow type consistent. With native ComfyUI support, place the selected checkpoint components in the documented model folders and use the native MOSS-Image workflow. With the optional Hugging Face directory plugin, point <code>MOSSImageHFLoader</code> at the complete local Base or SFT directory containing <code>transformer/</code>, <code>text_encoder/</code>, <code>tokenizer/</code>, and <code>vae/</code>.</p>
        <p>Do not move between native and plugin workflows by changing only the loader node. The official ComfyUI guide says their loader nodes are not interchangeable and the native path uses a different timestep multiplier. Import the matching workflow, then compare checkpoints with the same prompt, dimensions, seed, sampler, and step count.</p>
      </section>

      <section id="choose">
        <h2>Which model should you use?</h2>
        <p>Start with SFT if you want to generate finished images now, especially when text grouping and organized layouts matter. The online studio on this site uses the hosted SFT endpoint, so it is the fastest way to test prompts without managing weights or a GPU.</p>
        <p>Start with Base if your goal is to train a LoRA, benchmark the foundation checkpoint, or build your own post-training process. Base retains the pre-post-training model behavior and requires careful inference settings, which makes it useful for customization rather than the simplest default.</p>
        <p>Use the two studio links below to open the matching model state. SFT can generate online; Base opens its local-install path because this site&apos;s hosted fal.ai endpoint serves SFT.</p>
        <div className="related-links">
          <Link href="/?model=sft#studio">Open with SFT</Link>
          <Link href="/?model=base#studio">Open Base local setup</Link>
          <Link href="/moss-image-edit/">Compare image editing workflows</Link>
          <Link href="/comfyui/">Run MOSS-Image with ComfyUI</Link>
          <Link href="/troubleshooting/">Troubleshoot a local result</Link>
        </div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Checkpoint details, licenses, and workflows checked October 24, 2026.</p>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-Base" target="_blank" rel="noreferrer">MOSS-Image Base model card</a>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT" target="_blank" rel="noreferrer">MOSS-Image SFT model card</a>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/USERGUIDE.md" target="_blank" rel="noreferrer">MOSS-Image Base user guide</a>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/README.md" target="_blank" rel="noreferrer">Official ComfyUI guide</a>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT/discussions/8" target="_blank" rel="noreferrer">Community SFT stripe analysis and adapter</a>
      </section>
    </EditorialPage>
  </>;
}
