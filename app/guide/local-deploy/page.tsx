import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const title = 'MOSS-Image Local Install — Run on Your GPU, No Cloud';
const description = 'Install MOSS-Image locally with native ComfyUI or the optional HF-directory loader. Compare model files, memory options, and matching workflows.';
const canonical = 'https://mossimage.run/guide/local-deploy/';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/guide/local-deploy/' },
  openGraph: { title, description, url: '/guide/local-deploy/', type: 'article' },
};

const sections = [
  { id: 'choose', title: 'Choose an installation path' },
  { id: 'native', title: 'Native ComfyUI' },
  { id: 'plugin', title: 'HF-directory plugin' },
  { id: 'memory', title: 'Manage memory use' },
  { id: 'switch', title: 'Switch Base and SFT' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
] as const;

export default function LocalDeployPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        '@id': `${canonical}#native-install`,
        name: 'Install MOSS-Image with native ComfyUI support',
        description,
        url: canonical,
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Update ComfyUI', text: 'Use a current ComfyUI build that includes native MOSS-Image support and install its current dependencies.' },
          { '@type': 'HowToStep', position: 2, name: 'Download the model components', text: 'Download a matching MOSS-Image diffusion model, text encoder, and VAE from Comfy-Org.' },
          { '@type': 'HowToStep', position: 3, name: 'Place each component', text: 'Put the diffusion model in models/diffusion_models, the text encoder in models/text_encoders, and the VAE in models/vae.' },
          { '@type': 'HowToStep', position: 4, name: 'Import the native workflow', text: 'Import a native MOSS-Image workflow rather than replacing the loader in an HF-directory plugin workflow.' },
          { '@type': 'HowToStep', position: 5, name: 'Run a fixed-seed test', text: 'Run one 1024 by 1024 image with the workflow defaults and a fixed seed before changing the graph.' },
        ],
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Guides', url: 'https://mossimage.run/guide/' },
        { name: 'Local Deploy', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Guides', href: '/guide/' }, { label: 'Local Deploy' }]}
      eyebrow="SELF HOSTING"
      title="Install MOSS-Image Locally"
      intro="Run MOSS-Image on your own hardware. Choose native ComfyUI support for a new setup, or use the optional HF-directory plugin when you need to load a complete local Diffusers model directory."
      sections={sections}
      bottomLink={{ href: '/comfyui/', label: 'ComfyUI setup overview' }}
      publishedDate="October 26, 2026"
    >
      <section id="choose">
        <h2>Choose one installation path</h2>
        <p>The two paths use different model layouts, loader nodes, and sampling graphs. Import the workflow that belongs to the path you choose; replacing only the loader can change sampling behavior or leave the graph incomplete.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Path</th><th>Best for</th><th>Model format</th></tr></thead><tbody><tr><th>Native ComfyUI</th><td>New installations and current ComfyUI workflows</td><td>Separate ComfyUI-format diffusion model, text encoder, and VAE files</td></tr><tr><th>HF-directory plugin</th><td>Existing plugin workflows or direct loading of a local Diffusers directory</td><td>A complete directory containing transformer, text encoder, tokenizer, and VAE components</td></tr></tbody></table></div>
        <p>If you only want to test SFT without managing model files or hardware, use the <Link href="/#studio">browser-based MOSS-Image generator</Link>.</p>
      </section>

      <section id="native">
        <h2>Native ComfyUI is the recommended path</h2>
        <p>MOSS-Image support was merged into ComfyUI on October 16, 2026. Use a current build containing commit <code>e087d8f6</code> or later and install the dependencies from that build. The official OpenMOSS guide notes that release <code>v0.41.3</code> does not contain this support.</p>
        <h3>Place the model components</h3>
        <p>Download matching components from the <a href="https://huggingface.co/Comfy-Org/MOSS-Image" target="_blank" rel="noreferrer">Comfy-Org MOSS-Image repository</a>.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Component</th><th>Folder</th></tr></thead><tbody><tr><th>Diffusion model</th><td><code>ComfyUI/models/diffusion_models/</code></td></tr><tr><th>Text encoder</th><td><code>ComfyUI/models/text_encoders/</code></td></tr><tr><th>VAE</th><td><code>ComfyUI/models/vae/</code></td></tr></tbody></table></div>
        <h3>Use the matching native workflow</h3>
        <p>The documented manual graph uses Load Diffusion Model, CLIP Loader with type <code>moss_image</code>, Load VAE, and the MOSS-Image Layout Prompt node. The model defaults to shift 5; when manually adjusting shift, the official guide specifies ModelSamplingAuraFlow with multiplier 1.</p>
        <p>Download the <Link href="/workflows/">native workflow</Link> and import it as a complete graph. Current official templates may choose faster sampling settings than the OpenMOSS reference settings, so begin with the values stored in the workflow you downloaded instead of mixing settings from another graph.</p>
        <h3>Run a first test</h3>
        <ol><li>Start with a 1024 × 1024 canvas and one image.</li><li>Use a fixed seed and the workflow&apos;s included sampler settings.</li><li>Queue the workflow before adding extensions or changing precision.</li><li>Save the working graph and record the model filenames.</li></ol>
      </section>

      <section id="plugin">
        <h2>Use the HF-directory plugin for Diffusers folders</h2>
        <p>This optional path is useful when you already have a plugin workflow or want to load a complete local Hugging Face Diffusers directory. Download either the <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-Base" target="_blank" rel="noreferrer">Base</a> or <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT" target="_blank" rel="noreferrer">SFT</a> repository without flattening its structure.</p>
        <div className="code-block"><pre><code>{`your-model-directory/
├── transformer/
├── text_encoder/
├── tokenizer/
└── vae/`}</code></pre></div>
        <h3>Install the official plugin</h3>
        <p>From an OpenMOSS MOSS-Image checkout, either copy the node directory or run the repository installer:</p>
        <div className="code-block"><pre><code>{`cp -r comfyui/moss-image/ /path/to/ComfyUI/custom_nodes/moss-image/

python comfyui/install.py --comfy-root /path/to/ComfyUI`}</code></pre></div>
        <p>The installer creates a link in <code>custom_nodes</code> and copies the example workflow into <code>user/default/workflows</code> only when a file with the same name does not already exist. Restart ComfyUI after installation.</p>
        <h3>Set model_path</h3>
        <p>In MOSSImageHFLoader, point <code>model_path</code> at the directory containing the four component folders. An absolute path is the clearest choice. Relative paths are resolved by the ComfyUI process and therefore depend on how it was launched.</p>
        <div className="code-block"><pre><code>/home/user/models/MOSS-Image-SFT</code></pre></div>
        <p>Import the <Link href="/workflows/">official HF-directory workflow</Link> and keep its included 50 steps, CFG 3, shift 5, Euler sampler, and <code>sgm_uniform</code> scheduler for the first test.</p>
      </section>

      <section id="memory">
        <h2>Manage memory by changing one variable at a time</h2>
        <p>Runtime memory depends on model format, precision, offloading, resolution, and which components remain resident. Download size is not a VRAM requirement, so use a working 1024 × 1024 graph to measure your own peak rather than relying on a universal GPU number.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Situation</th><th>Try this</th></tr></thead><tbody><tr><th>Tight VRAM</th><td>Use an official quantized native model, lower the canvas size, and enable supported CPU or sequential offloading.</td></tr><tr><th>More VRAM available</th><td>Use the BF16 native model components when the hardware and ComfyUI build support them.</td></tr><tr><th>Unsure</th><td>Load the official 1024 × 1024 workflow and monitor peak memory during the first run.</td></tr><tr><th>Frequent out-of-memory errors</th><td>Reduce dimensions and confirm that two copies of the model or text encoder are not loaded by separate nodes.</td></tr></tbody></table></div>
        <p>In the HF-directory node, <code>weight_dtype</code> currently offers default, BF16, FP32, and several FP8 modes. It does not expose an INT8 or FP16 option. <code>text_device</code> offers the default device or CPU, and the plugin loads the VAE in FP32.</p>
        <p>For checkpoint-specific CFG, steps, sampler, shift, and precision guidance, use the <Link href="/guide/settings/">settings reference</Link>. If you selected the foundation checkpoint, continue with the <Link href="/guide/base-guide/">Base guide</Link>.</p>
      </section>

      <section id="switch">
        <h2>Switch between Base and SFT without mixing formats</h2>
        <p>For native ComfyUI, select the matching Base or SFT diffusion model while keeping compatible text-encoder and VAE files in their documented folders. For the plugin path, point <code>model_path</code> at the complete Base or SFT Diffusers directory. Keep the workflow type consistent and run a fixed-seed test after switching.</p>
      </section>

      <section id="troubleshooting">
        <h2>Troubleshooting</h2>
        <h3>MOSSImageHFLoader does not appear</h3><p>Confirm that the plugin is linked or copied to <code>ComfyUI/custom_nodes/moss-image/</code>, then fully restart a current ComfyUI build and inspect the startup log for import errors.</p>
        <h3>model_path is invalid</h3><p>Point at the directory containing <code>transformer/</code>, <code>text_encoder/</code>, <code>tokenizer/</code>, and <code>vae/</code>. Do not point at a single safetensors file.</p>
        <h3>The native workflow shows unknown nodes</h3><p>Update ComfyUI to a build with native MOSS-Image support and install that build&apos;s current dependencies. Confirm that the workflow is native rather than an HF-directory plugin graph.</p>
        <h3>The workflow runs out of memory</h3><p>Reduce canvas dimensions, use a supported quantized native model, or move supported components to CPU. Check that the graph does not load the same component twice.</p>
        <h3>The output differs from the hosted studio</h3><p>The online studio uses the hosted SFT endpoint with 50 inference steps. Provider precision and runtime details are not exposed by this site, and the plugin scheduler does not use the standalone pipeline&apos;s training-grid snapping. Matching a seed and visible settings does not guarantee a pixel-identical result.</p>
        <div className="related-links"><Link href="/workflows/">Download workflows</Link><Link href="/comfyui/mossimagehfloader/">MOSSImageHFLoader reference</Link><Link href="/comfyui/">ComfyUI overview</Link></div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Installation details checked October 26, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/README.md" target="_blank" rel="noreferrer">OpenMOSS ComfyUI guide</a>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/install.py" target="_blank" rel="noreferrer">Official plugin installer</a>
        <a href="https://huggingface.co/Comfy-Org/MOSS-Image" target="_blank" rel="noreferrer">ComfyUI-format model files</a>
      </section>
    </EditorialPage>
  </>;
}
