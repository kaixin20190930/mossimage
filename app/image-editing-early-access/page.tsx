import type { Metadata } from 'next';
import Link from 'next/link';
import { EditingInterestForm } from '@/components/editing-interest-form';
import { EditorialPage } from '@/components/editorial-page';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const canonical = 'https://mossimage.run/image-editing-early-access/';
const title = 'MOSS-Image Upload & Edit — Early Access';
const description = 'Tell us which upload-based image editing workflow should come first: style changes, selective repainting, text replacement, or composition-preserving edits.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/image-editing-early-access/' }, openGraph: { title, description, url: '/image-editing-early-access/', type: 'website' } };
const sections = [{ id: 'availability', title: 'What works where today' }, { id: 'request', title: 'Choose a workflow' }, { id: 'local', title: 'Run it locally today' }] as const;

export default function ImageEditingEarlyAccessPage() {
  const data = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, datePublished: '2026-11-08', dateModified: '2026-11-08' }, breadcrumbStructuredData([{ name: 'MOSS-Image Generator', url: 'https://mossimage.run/' }, { name: 'Image-editing early access', url: canonical }])] };
  return <><JsonLd data={data}/><EditorialPage breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Image-editing early access' }]} eyebrow="EARLY ACCESS" title="Upload and Edit Your Own Images — Early Access" intro="The hosted studio currently generates new images from text prompts and JSON layout guidance. It does not yet accept a picture you already have. Tell us which hosted editing workflow would be useful first." sections={sections} bottomLink={{ href: '/moss-image-edit/', label: 'Local editing guide' }} publishedDate="November 8, 2026">
    <section id="availability"><h2>What works where today</h2><div className="comparison-table-wrap"><table><thead><tr><th>Task</th><th>Hosted studio</th><th>Local ComfyUI</th></tr></thead><tbody>
      <tr><th>Generate a new image from text</th><td>Available</td><td>Available</td></tr><tr><th>Guide text and objects with JSON regions</th><td>Available</td><td>Available</td></tr><tr><th>Change the style of an existing image</th><td>Not available yet</td><td>Community Edit LoRA</td></tr><tr><th>Repaint part of an image</th><td>Not available yet</td><td>Edit workflow with a mask or dedicated inpainting workflow</td></tr><tr><th>Replace words inside an image</th><td>Not available yet</td><td>Edit LoRA, followed by careful proofreading</td></tr><tr><th>Preserve a composition while changing its contents</th><td>Not available yet</td><td>Reference-image editing or a reconstructed JSON layout</td></tr>
    </tbody></table></div></section>
    <section id="request"><h2>Which workflow would you use first?</h2><p>Select every option that applies. Your choices determine what we evaluate first.</p><EditingInterestForm/><p className="small-note">We do not accept image uploads on this page. We record your selected workflows and optional note. If you provide an email, it is encrypted for a possible early-access invitation and is not added to a marketing list.</p></section>
    <section id="local"><h2>Run image editing locally today</h2><p>The current community workflow uses a MOSS-Image Edit LoRA with a compatible model and reference-image conditioning in ComfyUI. For native loaders, keep the diffusion model in <code>models/diffusion_models/</code>, Qwen3.5 encoder in <code>models/text_encoders/</code>, VAE in <code>models/vae/</code>, and Edit patch in <code>models/model_patches/</code>.</p><p>Use a workflow written for the exact Edit patch and loader path. A generic text-to-image LoRA graph does not provide the reference-image conditioning required for editing.</p><div className="related-links"><Link href="/moss-image-edit/">Read the editing guide</Link><Link href="/comfyui/">Set up ComfyUI</Link><Link href="/guide/json-layout/">Learn JSON layout control</Link></div></section>
  </EditorialPage></>;
}
