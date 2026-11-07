import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDownToLine } from 'lucide-react';
import { EditorialPage } from '@/components/editorial-page';
import { contentLastModified } from '@/lib/content-dates';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.workflows;
const canonical = 'https://mossimage.run/workflows/';
const pluginUpstream = 'https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/moss-image/example_workflows/moss-image.json';
const nativeUpstream = 'https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_moss_image_t2i.json';
const modifiedDate = contentLastModified.workflows;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/workflows/' },
  openGraph: { title: page.title, description: page.description, url: '/workflows/', type: 'website' },
};

const sections = [
  { id: 'download', title: 'Download a workflow' },
  { id: 'inside', title: 'What is inside' },
  { id: 'install', title: 'Install and run' },
  { id: 'settings', title: 'Verified defaults' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
  { id: 'online', title: 'Use it online' },
] as const;

export default function WorkflowsPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${canonical}#native-workflow`,
        name: 'MOSS-Image native ComfyUI SFT workflow',
        description: 'Official Comfy-Org native MOSS-Image SFT workflow for current ComfyUI builds.',
        codeRepository: nativeUpstream,
        downloadUrl: 'https://mossimage.run/workflows/moss-image-native-sft-workflow.json',
        license: 'https://www.apache.org/licenses/LICENSE-2.0',
        programmingLanguage: 'JSON',
        runtimePlatform: 'ComfyUI',
        softwareVersion: '0.4',
        dateModified: modifiedDate,
        author: { '@type': 'Organization', name: 'Comfy-Org', url: 'https://github.com/Comfy-Org' },
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${canonical}#plugin-workflow`,
        name: 'MOSS-Image ComfyUI HF-directory workflow',
        description: page.description,
        codeRepository: pluginUpstream,
        downloadUrl: 'https://mossimage.run/workflows/moss-image-workflow.json',
        license: 'https://www.apache.org/licenses/LICENSE-2.0',
        programmingLanguage: 'JSON',
        runtimePlatform: 'ComfyUI',
        softwareVersion: '0.4',
        dateModified: modifiedDate,
        author: { '@type': 'Organization', name: 'OpenMOSS', url: 'https://github.com/OpenMOSS/MOSS-Image' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'ComfyUI workflow', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'ComfyUI workflow' }]}
      eyebrow="WORKFLOW DOWNLOAD"
      title={page.heading}
      intro="Download a matching workflow for native ComfyUI or the optional HF-directory plugin. Each file is mirrored from its official source and labeled with the model format and loader it expects."
      sections={sections}
      bottomLink={{ href: '/comfyui/', label: 'Read the ComfyUI guide' }}
      publishedDate="October 26, 2026 · Updated November 7, 2026"
    >
      <section id="download">
        <h2>Download a workflow that matches your installation</h2>
        <p>Native ComfyUI and the optional HF-directory plugin use different model files and sampling graphs. Import one complete workflow and keep its matching loader path.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Download</th><th>Loader and model files</th><th>Checkpoint</th><th>Choose it when</th></tr></thead><tbody>
          <tr><th>Native ComfyUI workflow</th><td>Built-in loaders with separate diffusion model, text encoder, and VAE files</td><td>SFT</td><td>You are starting a current ComfyUI setup</td></tr>
          <tr><th>HF-directory workflow</th><td><code>MOSSImageHFLoader</code> with a complete local Diffusers directory</td><td>Base</td><td>You already use the optional plugin path</td></tr>
        </tbody></table></div>
        <p className="small-note">These are the two files available on this page. Each includes its own sampling graph; do not switch paths by replacing only the loader node.</p>
        <div className="download-card">
          <div>
            <strong>Native ComfyUI SFT workflow</strong>
            <span>Recommended · official Comfy-Org template · JSON format 0.4</span>
          </div>
          <a className="download-button" href="/workflows/moss-image-native-sft-workflow.json" download>
            <ArrowDownToLine size={16}/> Download JSON
          </a>
        </div>
        <p className="small-note">Uses native ComfyUI loaders and separate Comfy-Org model components. Compare this mirror with the <a href={nativeUpstream} target="_blank" rel="noreferrer">upstream template</a>.</p>
        <div className="callout"><strong>Requires current Subgraph support.</strong><p>The native file uses Subgraph nodes and needs a ComfyUI build that supports them. If import fails with unknown node types, update ComfyUI instead of mapping nodes manually. The template also includes a resolution selector and a prompt-enhancement switch; keep their stored defaults for the first run.</p></div>
        <div className="download-card">
          <div>
            <strong>HF-directory Base workflow</strong>
            <span>Optional HF-directory loader plugin · JSON format 0.4</span>
          </div>
          <a className="download-button" href="/workflows/moss-image-workflow.json" download>
            <ArrowDownToLine size={16}/> Download JSON
          </a>
        </div>
        <p className="small-note">Uses a complete local Base Diffusers directory and requires the <Link href="/comfyui/mossimagehfloader/"><code>MOSSImageHFLoader</code> plugin</Link>. Open the node guide for installation, the <code>model_path</code> format, and loader-specific errors. Compare this mirror with the <a href={pluginUpstream} target="_blank" rel="noreferrer">upstream plugin file</a>.</p>
        <p className="small-note">Both files were refreshed from their official sources on October 26, 2026. The download selector was clarified on November 7, 2026.</p>
      </section>

      <section id="inside">
        <h2>What is inside the workflow</h2>
        <p>The native SFT graph uses current built-in ComfyUI loaders and the MOSS-Image layout prompt node. Its model files belong in the diffusion-model, text-encoder, and VAE directories shown below.</p>
        <p>The HF-directory Base graph contains nine nodes: a directory loader, positive and negative prompt encoders, an empty Flux latent canvas, skip-layer guidance, SD3 model sampling, a KSampler, VAE decoding, and image saving. Its bilingual sample prompt is useful for checking that the complete local model directory loaded correctly.</p>
      </section>

      <section id="install">
        <h2>Install and run the matching path</h2>
        <ol>
          <li>Install and start a current ComfyUI build.</li>
          <li>For the native workflow, place the matching model files in <code>models/diffusion_models/</code>, <code>models/text_encoders/</code>, and <code>models/vae/</code>.</li>
          <li>For the plugin workflow, copy <code>comfyui/moss-image/</code> from the official repository into <code>ComfyUI/custom_nodes/moss-image/</code>. Keep the downloaded Base repository&apos;s transformer, text encoder, tokenizer, and VAE folders together.</li>
          <li>Import the JSON for your path. Only the plugin graph requires setting the loader&apos;s <code>model_path</code> to the complete local model directory.</li>
          <li>Queue one square test image before changing nodes or adding extensions.</li>
        </ol>
        <div className="callout">
          <strong>Using native ComfyUI support?</strong>
          <p>Download the <a href={nativeUpstream} target="_blank" rel="noreferrer">native workflow and ComfyUI-format models</a> from Comfy-Org. Place the diffusion model in <code>models/diffusion_models/</code>, the text encoder in <code>models/text_encoders/</code>, and the VAE in <code>models/vae/</code>. Import the native workflow as a complete graph; do not start from the HF-directory workflow and swap only the loader.</p>
        </div>
      </section>

      <section id="settings">
        <h2>Start from each workflow&apos;s verified defaults</h2>
        <p>The HF-directory example is configured for a 1024 × 1024 image with 50 steps, CFG 3, shift 5, skip layer 22, the Euler sampler, and the <code>sgm_uniform</code> scheduler. The current native Comfy-Org template stores its own settings. Preserve the values in the workflow you chose, keep the seed fixed, and change one setting at a time.</p>
        <p>These are workflow defaults, not universal performance recommendations. Generation time and memory use depend on your GPU, precision, offloading, ComfyUI version, and any custom nodes you install.</p>
      </section>

      <section id="troubleshooting">
        <h2>Troubleshooting</h2>
        <ul>
          <li><strong>Missing HF-directory loader:</strong> confirm the optional custom-node folder and its dependencies are installed, then restart ComfyUI.</li>
          <li><strong>Model path error:</strong> point the loader at the full Hugging Face model directory, not a single <code>.safetensors</code> file.</li>
          <li><strong>Out of memory:</strong> lower the canvas dimensions and use ComfyUI&apos;s supported memory-management options for your hardware.</li>
          <li><strong>Unknown nodes after an update:</strong> confirm whether the workflow expects native loaders or the optional HF-directory plugin, then use the matching workflow file.</li>
          <li><strong>Text is imperfect:</strong> shorten the requested wording, make placement explicit, and proofread every generated image.</li>
        </ul>
      </section>

      <section id="online">
        <h2>Use MOSS-Image without a local setup</h2>
        <p>If you want to test a prompt or structured layout before downloading model files, the online studio provides three starter image credits after email verification. No card or subscription is required.</p>
        <Link className="inline-action" href="/#studio">Open the online studio </Link>
        <div className="related-links"><Link href="/guide/local-deploy/">Local install guide</Link><Link href="/comfyui/mossimagehfloader/">HF-directory loader reference</Link><Link href="/moss-image-edit/">Image editing workflows</Link><Link href="/comfyui/">ComfyUI overview</Link></div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Installation, model, and workflow references checked October 26, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/README.md" target="_blank" rel="noreferrer">OpenMOSS ComfyUI guide </a>
        <a href={nativeUpstream} target="_blank" rel="noreferrer">Native Comfy-Org workflow JSON </a>
        <a href={pluginUpstream} target="_blank" rel="noreferrer">HF-directory plugin workflow JSON </a>
        <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-Base" target="_blank" rel="noreferrer">MOSS-Image Base model card </a>
      </section>
    </EditorialPage>
  </>;
}
