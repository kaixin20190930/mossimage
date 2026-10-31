import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const canonical = 'https://mossimage.run/guide/turbo-lora/';
const title = 'MOSS-Image Turbo LoRA Guide — 4-Step and 8-Step Generation';
const description = 'Configure 4-step, 8-step, and 15-step MOSS-Image accelerators with their matching CFG, sampler, strength, and workflow settings. Avoid smudged output.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/guide/turbo-lora/' }, openGraph: { title, description, url: '/guide/turbo-lora/', type: 'article' } };
const sections = [{ id: 'rule', title: 'The important rule' }, { id: 'recipes', title: '4, 8, and 15-step recipes' }, { id: 'workflow', title: 'Workflow setup' }, { id: 'compare', title: 'How to compare quality' }, { id: 'quality', title: 'When not to use Turbo' }] as const;

export default function TurboLoraGuidePage() {
  const data = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'TechArticle', '@id': `${canonical}#article`, headline: 'MOSS-Image Turbo LoRA guide', description, datePublished: '2026-10-27', dateModified: '2026-10-27', mainEntityOfPage: canonical, author: { '@type': 'Organization', name: 'Moxion Labs LLC' } },
    breadcrumbStructuredData([{ name: 'MOSS-Image Generator', url: 'https://mossimage.run/' }, { name: 'Guides', url: 'https://mossimage.run/guide/' }, { name: 'Turbo LoRA', url: canonical }]),
  ] };
  return <><JsonLd data={data}/><EditorialPage breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Guides', href: '/guide/' }, { label: 'Turbo LoRA' }]}
    eyebrow="FEW-STEP GENERATION" title="Speed Up MOSS-Image with Turbo LoRAs"
    intro="A Turbo adapter is a different inference recipe, not a speed switch for the standard 50-step graph. Match the steps, CFG, sampler, scheduler, and strength published for the exact adapter."
    sections={sections} bottomLink={{ href: '/guide/', label: 'All guides' }} publishedDate="October 27, 2026">
    <section id="rule"><h2>Do not reuse the standard workflow unchanged</h2><div className="callout"><strong>There is no universal Turbo CFG.</strong><p>Four-step, eight-step DMD, and fifteen-step adapters publish different samplers, guidance, and loading requirements.</p></div><p>Loading a few-step LoRA into a 25–50 step, CFG 2.5–3 graph can overcook or smear an adapter trained for four steps and CFG 1. The eight-step DMD release uses no classifier-free guidance and a specialized sampling path, while the verified fifteen-step adapter recommends CFG 3. Start from the exact maintainer instructions for the downloaded release.</p></section>
    <section id="recipes"><h2>4-step, 8-step, and 15-step recipes</h2><div className="comparison-table-wrap"><table><thead><tr><th>Adapter</th><th>Published starting recipe</th><th>Important note</th></tr></thead><tbody>
      <tr><th>akhaliq four-step v2</th><td>4 steps, CFG 1, stock flow-matching Euler, LoRA strength 1</td><td>v2 changed the usage from earlier releases; above roughly one megapixel, the author suggests testing 6–8 steps.</td></tr>
      <tr><th>lodestones eight-step DMD</th><td>8 network evaluations, no CFG; LoRA strength 1, or 0.7 for the latest named file</td><td>Work in progress with a data-space DMD sampling method. Do not treat it as a normal Euler drop-in.</td></tr>
      <tr><th>Coffmeteor fifteen-step</th><td>15 steps, CFG 3, Euler, <code>sgm_uniform</code>, shift 5, LoRA strength 1</td><td>Uses negative-branch skip guidance on single layer 22. Do not add the LoRA to a merged model that already contains it.</td></tr>
    </tbody></table></div><p className="small-note">These are community adapters. Their maintainers can update files and instructions, so recheck the source page before downloading.</p></section>
    <section id="workflow"><h2>Connect the LoRA without losing your baseline</h2><ol><li>First save a working standard SFT graph and fixed-seed output.</li><li>Add the LoRA with a model-only loader or use the maintainer&apos;s matching merged file.</li><li>Apply the exact recipe for that release.</li><li>Keep prompt, seed, dimensions, and VAE fixed for the comparison.</li><li>Label saved outputs with adapter version, strength, and settings.</li></ol><p>Do not compare a native workflow against an HF-directory graph by swapping only the loader. Establish the normal SFT result first, then add acceleration as the single changed variable.</p></section>
    <section id="compare"><h2>Compare speed and quality honestly</h2><p>Use the same prompt, seed, dimensions, and output review criteria for standard 50-step SFT and each accelerator. Record wall-clock time on your own hardware instead of publishing a universal speed multiplier. Score text readability, composition, prompt adherence, and the number of retries required to reach a usable image.</p></section>
    <section id="quality"><h2>When the faster result is not the useful result</h2><p>Few-step generation is valuable for drafts, prompt exploration, and composition searches. Dense typography, small labels, unusual aspect ratios, and final delivery images deserve a comparison against standard SFT. Proofread all generated text and keep failed samples: they reveal whether the speed tradeoff fits your actual work.</p><div className="related-links"><Link href="/guide/settings/">Settings guide</Link><Link href="/compare/base-vs-sft/#fixing-sft-vertical-stripes">SFT stripe fixes</Link><Link href="/troubleshooting/">Troubleshooting index</Link></div></section>
    <section className="sources"><h2>Adapter sources</h2><p>Recipes checked October 27, 2026.</p><a href="https://huggingface.co/akhaliq/MOSS-Image-SFT-4-steps" target="_blank" rel="noreferrer">Four-step adapter model card</a><a href="https://huggingface.co/lodestones/MOSS-Image-SFT-8-steps-dmd" target="_blank" rel="noreferrer">Eight-step DMD model card</a><a href="https://huggingface.co/Coffmeteor/MOSS-Image-Turbo" target="_blank" rel="noreferrer">Fifteen-step adapter model card</a></section>
  </EditorialPage></>;
}
