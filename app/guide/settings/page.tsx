import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const canonical = 'https://mossimage.run/guide/settings/';
const title = 'MOSS-Image Settings Guide — CFG, Steps, Scheduler & Fixes';
const description = 'Fix noise, blur, and weak Base results in MOSS-Image. Compare CFG, steps, schedulers, loader paths, VAE behavior, Turbo settings, and FP16 options.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/guide/settings/' }, openGraph: { title, description, url: '/guide/settings/', type: 'article' } };
const sections = [
  { id: 'reference', title: 'Reference settings' },
  { id: 'base-cfg', title: 'Base guidance' },
  { id: 'noise', title: 'Noise and wrong loaders' },
  { id: 'sft-blurry', title: 'Blur and previews' },
  { id: 'sampler-vae', title: 'Sampler, shift, and VAE' },
  { id: 'precision', title: 'Precision and FP16' },
] as const;

export default function SettingsGuidePage() {
  const data = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'TechArticle', '@id': `${canonical}#article`, headline: 'MOSS-Image settings', description, datePublished: '2026-10-27', dateModified: '2026-11-09', mainEntityOfPage: canonical, author: { '@type': 'Organization', name: 'Moxion Labs LLC' } },
    breadcrumbStructuredData([{ name: 'MOSS-Image Generator', url: 'https://mossimage.run/' }, { name: 'Guides', url: 'https://mossimage.run/guide/' }, { name: 'Settings', url: canonical }]),
  ] };
  return <><JsonLd data={data}/><EditorialPage
    breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Guides', href: '/guide/' }, { label: 'Settings' }]}
    eyebrow="SETTINGS REFERENCE" title="MOSS-Image Settings: Get Clean Output"
    intro="Begin with a configuration published for the exact checkpoint and workflow you loaded. Then keep the seed fixed and change one variable at a time."
    sections={sections} bottomLink={{ href: '/guide/', label: 'All guides' }} publishedDate="October 27, 2026 · Updated November 9, 2026">
    <section id="reference"><h2>Known-good reference settings</h2>
      <div className="comparison-table-wrap"><table><thead><tr><th>Configuration</th><th>Steps / CFG</th><th>Sampler details</th><th>Use it for</th></tr></thead><tbody>
        <tr><th>Base standalone</th><td>At least 50; CFG 3 default, 3–6 recommended</td><td>Use the official user guide or matching pipeline defaults</td><td>Foundation-checkpoint evaluation and custom tuning</td></tr>
        <tr><th>Official HF-directory workflow</th><td>50 / 3</td><td>Euler, <code>sgm_uniform</code>, shift 5; SLG single layer 22</td><td>A repeatable plugin-path test</td></tr>
        <tr><th>Native ComfyUI workflow</th><td>Preserve the values inside the downloaded graph</td><td>Use native loaders and its matching model components</td><td>Recommended new ComfyUI installations</td></tr>
        <tr><th>Turbo or few-step LoRA</th><td>Adapter-specific</td><td>Follow that adapter&apos;s model card exactly</td><td>Faster drafts after the standard workflow works</td></tr>
      </tbody></table></div>
      <div className="settings-preset-actions">
        <div><strong>Hosted SFT reference</strong><span>CFG 3 and 50 steps are supported by the fal.ai endpoint.</span></div>
        <Link className="inline-action" href="/?cfg=3&steps=50#studio">Use CFG 3 · 50 steps</Link>
      </div>
      <p className="small-note">Shift 5 and SLG layer 22 are local ComfyUI workflow controls. A shared URL may include them for reference, but the hosted studio does not send those two fields to fal.ai.</p>
      <p className="small-note">There is no single universal Turbo row: a four-step adapter and a fifteen-step adapter publish different CFG and scheduler recipes.</p>
      <h3>Set these values, then stop changing them</h3>
      <div className="comparison-table-wrap"><table><thead><tr><th>Control</th><th>Known-good HF-directory value</th></tr></thead><tbody>
        <tr><th>Scheduler</th><td><code>sgm_uniform</code></td></tr>
        <tr><th>Sampler</th><td>Flow-matching Euler</td></tr>
        <tr><th>Steps</th><td>50</td></tr>
        <tr><th>CFG</th><td>3 (test 3–6 only after the baseline works)</td></tr>
        <tr><th>Shift</th><td>5</td></tr>
        <tr><th>SLG negative branch</th><td>Single-layer index 22</td></tr>
        <tr><th>Resolution</th><td>1024 × 1024</td></tr>
        <tr><th>Seed</th><td>Fixed</td></tr>
      </tbody></table></div>
      <p>Run this baseline once, save the output, then change one variable per comparison. If you use the native ComfyUI workflow, keep the values saved in that downloaded graph instead of copying this HF-directory recipe into it. Accelerated adapters use different settings; compare them in the <Link href="/guide/turbo-lora/">4-step and 8-step Turbo guide</Link>.</p>
    </section>
    <section id="base-cfg"><h2>Why Base can look weak with a short prompt</h2>
      <p>The official Base guide recommends CFG 3–6 and says shorter prompts may benefit from higher values. Start at 3, keep the seed fixed, and move upward in small increments. Higher guidance is not automatically better: stop when contrast and prompt adherence improve without harsh or brittle detail.</p>
      <p>For a deeper explanation of Base prompts, sampling, and model selection, use the <Link href="/guide/base-guide/">complete Base checkpoint guide</Link>.</p>
    </section>
    <section id="noise"><h2>Why a local run can produce only noise</h2>
      <p>The first check is workflow alignment. Native ComfyUI and the optional <code>MOSSImageHFLoader</code> plugin use different loader paths, and the official guide says their workflows are not interchangeable. Import the complete workflow for your chosen path instead of swapping only the loader.</p>
      <ol><li>Confirm the checkpoint is Base or SFT and record its exact source.</li><li>Confirm the graph is native or HF-directory.</li><li>Restore the matching workflow&apos;s saved settings.</li><li>Run one 1024 × 1024 image with a fixed seed before adding LoRAs or quantization.</li></ol>
    </section>
    <section id="sft-blurry"><h2>Blur, previews, and sudden regressions</h2>
      <p>Open the saved image before judging a low-resolution ComfyUI preview. If previously working output changes after an update, test the last saved graph in a clean environment and inspect the console for missing nodes, precision warnings, or NaN values. Do not compensate for a broken environment by randomly increasing CFG or steps.</p>
      <p>For official plugin defaults, negative-branch skip guidance uses single layer 22. Preserve that graph while diagnosing; disable it only as a controlled comparison.</p>
    </section>
    <section id="sampler-vae"><h2>Sampler, shift, SLG, and the VAE</h2>
      <p>The official Base model card publishes flow-matching Euler, 50 steps, CFG 3, shift 5, and negative-branch layer skipping at index 22 as its starting configuration. The bundled pipeline uses the FLUX.2 small decoder, with the transformer and text encoder in BF16 and the VAE in FP32.</p>
      <p>Treat these values as a matched system. If you change the sampler, scheduler, shift, VAE, or layer guidance while also changing a checkpoint, you lose the ability to identify what caused the result. Restore a complete known-good graph before experimenting.</p>
    </section>
    <section id="precision"><h2>Precision, memory, and FP16</h2>
      <p>File size is not runtime VRAM. Resolution, offloading, component placement, and precision all change the peak. If plain FP16 produces overflow or NaN behavior in your setup, a community FP16-fixed transformer is available, but it is not an official OpenMOSS checkpoint. Verify its model card, hashes, and fixed-seed output before replacing the official weights.</p>
      <div className="related-links"><Link href="/presets/">Hosted studio presets</Link><Link href="/guide/base-guide/">Base checkpoint guide</Link><Link href="/guide/local-deploy/">Local install guide</Link><Link href="/guide/turbo-lora/">Turbo LoRA settings</Link><Link href="/troubleshooting/">Troubleshooting index</Link></div>
    </section>
    <section className="sources"><h2>Sources</h2><p>Official defaults and community variants checked October 27, 2026.</p>
      <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/USERGUIDE.md" target="_blank" rel="noreferrer">Official Base user guide</a>
      <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/README.md" target="_blank" rel="noreferrer">Official ComfyUI guide</a>
      <a href="https://huggingface.co/KBlueLeaf/MOSS-Image-FP16-fixed" target="_blank" rel="noreferrer">Community FP16-fixed model card</a>
    </section>
  </EditorialPage></>;
}
