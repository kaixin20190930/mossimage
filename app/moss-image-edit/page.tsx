import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const canonical = 'https://mossimage.run/moss-image-edit/';
const title = 'Can MOSS-Image Edit Images? Files, Nodes & Edit LoRA Guide';
const description = 'Edit images with MOSS-Image community LoRAs and ComfyUI. Find the correct Edit patch, model folders, text encoder, native nodes, and Ostris requirements.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/moss-image-edit/' },
  openGraph: { title, description, url: '/moss-image-edit/', type: 'article' },
};

const sections = [
  { id: 'answer', title: 'The short answer' },
  { id: 'chinoll', title: 'Moss-Image-Edit LoRA' },
  { id: 'files', title: 'Files and nodes you need' },
  { id: 'native-comfyui', title: 'Native ComfyUI support' },
  { id: 'ostris', title: 'Ostris edit nodes' },
  { id: 'choose', title: 'Choose an editing path' },
  { id: 'layout', title: 'The JSON layout alternative' },
  { id: 'limitations', title: 'Limits and dedicated tools' },
] as const;

export default function MossImageEditPage() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${canonical}#article`,
        headline: 'Can MOSS-Image Edit Images?',
        description,
        datePublished: '2026-10-27',
        dateModified: '2026-11-08',
        mainEntityOfPage: canonical,
        author: { '@type': 'Organization', name: 'Moxion Labs LLC', url: 'https://mossimage.run/' },
        publisher: { '@id': 'https://mossimage.run/#organization' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'MOSS-Image editing guide', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={data}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'MOSS-Image editing guide' }]}
      eyebrow="IMAGE EDITING GUIDE"
      title="Can MOSS-Image Edit Images?"
      intro="MOSS-Image Base and SFT are text-to-image checkpoints, but community Edit LoRAs and current ComfyUI support can add reference-image editing. This guide separates those local workflows from the hosted studio's current capabilities."
      sections={sections}
      bottomLink={{ href: '/workflows/', label: 'Download ComfyUI workflows' }}
      publishedDate="October 27, 2026 · Updated November 8, 2026"
    >
      <section id="answer">
        <h2>The short answer</h2>
        <div className="callout">
          <strong>Yes, through community Edit LoRAs and matching ComfyUI workflows—not through the Base or SFT checkpoint alone.</strong>
          <p>The hosted studio on mossimage.run currently generates new images from text or JSON layout guidance. It does not accept an uploaded image for editing, inpainting, or image-to-image generation.</p>
        </div>
        <p>The clearest verified route is <a href="https://huggingface.co/chinoll/Moss-Image-Edit" target="_blank" rel="noreferrer">chinoll/Moss-Image-Edit</a>, a community LoRA that works with MOSS-Image Base or SFT. ComfyUI also merged native support for MOSS-Image edit LoRAs on October 22, 2026. These tools can follow a reference image and text instruction, but they remain diffusion-based generation: faces, lettering, textures, and areas outside the intended change can move.</p>
        <p>OpenMOSS has said it is exploring reference-related features, but that discussion is not a promise of an official edit checkpoint. Treat community repositories, workflows, and recommended settings as versioned dependencies.</p>
      </section>

      <section id="chinoll">
        <h2>Path 1: the Moss-Image-Edit LoRA</h2>
        <p>The community <a href="https://huggingface.co/chinoll/Moss-Image-Edit" target="_blank" rel="noreferrer">Moss-Image-Edit LoRA</a> applies text instructions to one or more reference images. Its published examples cover color, clothing, lighting, season, and visual-style changes. The model card supports both Base and SFT and provides separate single-reference and multi-reference workflows.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Capability</th><th>Verified behavior</th></tr></thead><tbody>
          <tr><th>Single reference</th><td>Upload one source image, describe the desired change, and generate a new result.</td></tr>
          <tr><th>Multiple references</th><td>Connect up to four images and explain each image&apos;s role in the instruction.</td></tr>
          <tr><th>Base or SFT</th><td>The published LoRA can be used with either checkpoint; keep the workflow and model path consistent.</td></tr>
          <tr><th>License and hosting</th><td>The project code is GPLv3. The Hugging Face model card currently lists no hosted inference provider.</td></tr>
        </tbody></table></div>
        <h3>Download the model files</h3>
        <pre><code>{`hf download chinoll/Moss-Image-Edit \\
  adapter_config.json adapter_model.safetensors \\
  --local-dir models/Moss-Image-Edit

hf download OpenMOSS-Team/MOSS-Image-SFT \\
  --local-dir models/MOSS-Image-SFT`}</code></pre>
        <p>Import a workflow published for this LoRA rather than adding a generic LoRA node to an unrelated text-to-image graph. The reference image must reach the model using the edit workflow&apos;s conditioning path.</p>
      </section>

      <section id="files">
        <h2>Which file or node do you actually need?</h2>
        <p>Most setup problems come from mixing the older Hugging Face directory workflow with the current native ComfyUI workflow. Choose one loading path first, then keep every file in the directory that workflow expects.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>What you found</th><th>What it is</th><th>Where it belongs</th></tr></thead><tbody>
          <tr><th>chinoll/Moss-Image-Edit</th><td>Community instruction-edit LoRA</td><td>Download from the author&apos;s Hugging Face repository</td></tr>
          <tr><th><code>adapter_model.safetensors</code></th><td>The published Edit LoRA weight; it may be renamed <code>moss_image_edit.safetensors</code></td><td><code>ComfyUI/models/model_patches/</code> for native loaders</td></tr>
          <tr><th>MOSS-Image Base or SFT</th><td>The diffusion model used with the Edit patch</td><td><code>ComfyUI/models/diffusion_models/</code></td></tr>
          <tr><th>Qwen3.5-9B text encoder</th><td>Encodes the instruction and reference image</td><td><code>ComfyUI/models/text_encoders/</code></td></tr>
          <tr><th>Matching FLUX.2 VAE</th><td>Encodes source images and decodes the result</td><td><code>ComfyUI/models/vae/</code></td></tr>
          <tr><th>Text Encode MOSS-Image Edit</th><td>Native reference-conditioning node</td><td>Current ComfyUI; set <code>edit_format</code> to <code>Moss-Image-Edit</code></td></tr>
          <tr><th>MOSS-Image Ostris Edit Model Patch</th><td>Lets ai-toolkit Edit LoRAs consume reference latents</td><td>Install its package in <code>ComfyUI/custom_nodes/</code></td></tr>
        </tbody></table></div>
        <p>Do not move a complete Diffusers repository into the native single-file folders and expect the same graph to load it. The directory-based workflow keeps <code>adapter_config.json</code>, <code>adapter_model.safetensors</code>, and the Base or SFT snapshot in their downloaded structure.</p>
        <p>If an Ostris graph reads the prompt but ignores the reference, confirm that the Qwen3.5 checkpoint includes vision weights and that the model-patch node is connected after the LoRA loader.</p>
        <p><Link href="/image-editing-early-access/">Request hosted image-editing early access</Link> if you would rather not install the local workflow.</p>
      </section>

      <section id="native-comfyui">
        <h2>Path 2: current native ComfyUI edit support</h2>
        <p><a href="https://github.com/Comfy-Org/ComfyUI/pull/17296" target="_blank" rel="noreferrer">ComfyUI pull request #17296</a> merged support for MOSS-Image edit LoRAs into the main project. It adds reference-latent handling for the chinoll workflow and edit LoRAs trained with ai-toolkit.</p>
        <ol>
          <li>Update ComfyUI to a current build containing the merged edit support.</li>
          <li>Use the official MOSS-Image model loaders and an edit workflow that matches your LoRA.</li>
          <li>In <strong>Text Encode MOSS-Image Edit</strong>, select the edit format required by the workflow; the chinoll guide uses <code>Moss-Image-Edit</code>.</li>
          <li>Start with the published SFT single-reference workflow before adding more images or changing sampling settings.</li>
        </ol>
        <p>The <a href="https://github.com/Chenkin-x/ComfyUI-Moss-Image-Edit" target="_blank" rel="noreferrer">Chenkin-x ComfyUI repository</a> remains useful for workflows, installation notes, and a custom-node fallback. Its maintainer explicitly recommends native ComfyUI support for current installations. Base BF16 and multi-image graphs are included, but the repository says their effects still need evaluation.</p>
      </section>

      <section id="ostris">
        <h2>Path 3: Ostris edit nodes for ai-toolkit LoRAs</h2>
        <p><a href="https://github.com/ostris/ComfyUI-MOSS-Image-Ostris-Edit" target="_blank" rel="noreferrer">ComfyUI-MOSS-Image-Ostris-Edit</a> is an optional MIT-licensed node package for edit LoRAs trained with ai-toolkit. It is not a drop-in replacement for the chinoll workflow.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Node</th><th>Role</th></tr></thead><tbody>
          <tr><th>Text Encode MOSS-Image Ostris Edit</th><td>Encodes the instruction and up to three reference images with the Qwen3.5 vision-capable text encoder.</td></tr>
          <tr><th>MOSS-Image Ostris Edit Model Patch</th><td>Allows the model to consume the reference latents; the repository warns that the stock graph otherwise ignores them.</td></tr>
        </tbody></table></div>
        <pre><code>{`cd ComfyUI/custom_nodes
git clone https://github.com/ostris/ComfyUI-MOSS-Image-Ostris-Edit.git`}</code></pre>
        <p>The package requires a ComfyUI build with native MOSS-Image support and the Qwen3.5 vision weights used by its text encoder. Its example graph uses 30 steps, CFG 3, skip-layer guidance on layer 22, and a model patch configured for the LoRA&apos;s reference-latent method. Treat those values as an example for that workflow, not universal edit settings.</p>
      </section>

      <section id="choose">
        <h2>Choose an editing path</h2>
        <div className="comparison-table-wrap"><table><thead><tr><th>Your goal</th><th>Start here</th><th>Important limit</th></tr></thead><tbody>
          <tr><th>Change color, clothing, lighting, season, or style</th><td>chinoll Moss-Image-Edit with its single-reference SFT workflow.</td><td>Unrequested details can still change.</td></tr>
          <tr><th>Use current built-in ComfyUI nodes</th><td>Update ComfyUI and import a workflow written for native edit support.</td><td>Older builds may not recognize the edit nodes or reference-latent method.</td></tr>
          <tr><th>Run an ai-toolkit edit LoRA</th><td>Use the Ostris encoder and model-patch nodes together.</td><td>It supports up to three references and needs the matching vision encoder.</td></tr>
          <tr><th>Edit online without installing ComfyUI</th><td>Use a dedicated hosted image editor.</td><td>The mossimage.run studio does not currently accept image uploads.</td></tr>
        </tbody></table></div>
        <p>There are other community inpainting graphs and shared workflow packs, but their dependencies and claims change quickly. This page does not present an unverified Civitai or forum workflow as an official MOSS-Image feature.</p>
      </section>

      <section id="layout">
        <h2>The JSON layout alternative: control before generation</h2>
        <p>MOSS-Image JSON layout is not image editing. It guides a new generation by describing regions for text and objects with <code>items</code>, <code>bbox</code>, <code>yxyx</code>, and <code>abs_centralized</code>. It can help establish composition before generation, but it does not guarantee an exact coordinate, font, color, or unchanged pixel region.</p>
        <p>If your real goal is to position menu text, a poster heading, a product label, or multiple visual elements, build the layout first and generate a new image. That path works in the hosted studio and does not require a local GPU.</p>
        <div className="related-links">
          <Link href="/json-layout/">Build a JSON layout</Link>
          <Link href="/guide/json-layout/">Read the layout reference</Link>
          <Link href="/#studio">Open the hosted studio</Link>
        </div>
      </section>

      <section id="limitations">
        <h2>Limits and when to use a dedicated editor</h2>
        <p>Reference-image generation is useful when you want a creative reinterpretation that follows an instruction. It is a poor fit when the task demands deterministic pixels or a specialized computer-vision operation.</p>
        <ul>
          <li><strong>Identity-critical face changes:</strong> use a tool designed for identity preservation and review consent and usage rights.</li>
          <li><strong>Background removal:</strong> use a segmentation or matting tool rather than regenerating the whole image.</li>
          <li><strong>Exact text replacement:</strong> use a layer-based editor when spelling, typography, and unchanged surrounding pixels are mandatory.</li>
          <li><strong>Upscaling:</strong> use a dedicated super-resolution model; an edit workflow is not an upscaler.</li>
          <li><strong>Masked object replacement:</strong> prefer a documented inpainting model if the untouched region must stay as stable as possible.</li>
        </ul>
        <p>Always save the source image, prompt, seed, workflow JSON, LoRA version, and ComfyUI revision. Compare at full resolution and proofread any generated lettering before publishing.</p>
        <div className="related-links">
          <Link href="/troubleshooting/">Troubleshoot MOSS-Image</Link>
          <Link href="/guide/settings/">Check generation settings</Link>
          <Link href="/compare/base-vs-sft/">Choose Base or SFT</Link>
        </div>
      </section>

      <section className="sources">
        <h2>Primary sources</h2>
        <p>Editing support, workflows, and repository status checked October 27, 2026.</p>
        <a href="https://huggingface.co/chinoll/Moss-Image-Edit" target="_blank" rel="noreferrer">chinoll/Moss-Image-Edit model card</a>
        <a href="https://github.com/Chenkin-x/ComfyUI-Moss-Image-Edit" target="_blank" rel="noreferrer">Chenkin-x ComfyUI edit workflows</a>
        <a href="https://github.com/Comfy-Org/ComfyUI/pull/17296" target="_blank" rel="noreferrer">ComfyUI native edit support pull request</a>
        <a href="https://github.com/ostris/ComfyUI-MOSS-Image-Ostris-Edit" target="_blank" rel="noreferrer">Ostris edit-node repository</a>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT/discussions/1" target="_blank" rel="noreferrer">OpenMOSS reference-feature discussion</a>
      </section>
    </EditorialPage>
  </>;
}
