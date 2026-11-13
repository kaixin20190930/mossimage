import { defaultOpenGraphImage } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { contentLastModified } from '@/lib/content-dates';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const title = 'MOSSImageHFLoader — Install the MOSS-Image ComfyUI Node';
const description = 'Learn what MOSSImageHFLoader does, install the optional HF-directory plugin, point it at a complete MOSS-Image model directory, and fix common loading errors.';
const canonical = 'https://mossimage.run/comfyui/mossimagehfloader/';
const modifiedDate = contentLastModified['comfyui/mossimagehfloader'];
const faqItems = [
  {
    question: 'Why does MOSSImageHFLoader not appear in ComfyUI?',
    answer: 'Confirm that ComfyUI/custom_nodes/moss-image/ resolves to the official node directory. Fully restart ComfyUI and inspect the startup log for API or dependency errors.',
  },
  {
    question: 'Why is model_path invalid or a file missing?',
    answer: 'Point model_path to the parent directory containing transformer, text_encoder, tokenizer, and vae, not to a safetensors file or an individual component folder. Confirm that the ComfyUI process can read the path.',
  },
  {
    question: 'Does MOSSImageHFLoader support INT8?',
    answer: 'No. INT8 is not a weight_dtype choice in this node. Official quantized single-file models belong to the native ComfyUI path; MOSSImageHFLoader exposes BF16, FP32, and FP8 casting choices alongside its default mode.',
  },
] as const;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/comfyui/mossimagehfloader/' },
  openGraph: { ...defaultOpenGraphImage, title, description, url: '/comfyui/mossimagehfloader/', type: 'article' },
};

const sections = [
  { id: 'what-it-does', title: 'What it does' },
  { id: 'compare', title: 'Native ComfyUI or HF loader' },
  { id: 'install', title: 'Install the plugin' },
  { id: 'configure', title: 'Configure model_path' },
  { id: 'options', title: 'Node options' },
  { id: 'troubleshooting', title: 'FAQ and troubleshooting' },
] as const;

export default function MossImageHfLoaderPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${canonical}#software`,
        name: 'MOSSImageHFLoader',
        description,
        url: canonical,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Windows, macOS, Linux',
        dateModified: modifiedDate,
        isAccessibleForFree: true,
        license: 'https://www.apache.org/licenses/LICENSE-2.0',
        sameAs: 'https://github.com/OpenMOSS/MOSS-Image/tree/main/comfyui/moss-image',
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'ComfyUI', url: 'https://mossimage.run/comfyui/' },
        { name: 'MOSSImageHFLoader', url: canonical },
      ]),
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'ComfyUI', href: '/comfyui/' }, { label: 'MOSSImageHFLoader' }]}
      eyebrow="COMFYUI NODE REFERENCE"
      title="MOSSImageHFLoader"
      intro="MOSSImageHFLoader is the optional ComfyUI node for loading MOSS-Image from a complete local Hugging Face Diffusers directory. New installations can usually use native ComfyUI support instead."
      sections={sections}
      bottomLink={{ href: '/workflows/', label: 'Download matching workflows' }}
      publishedDate="October 26, 2026 · Updated November 7, 2026"
    >
      <section id="what-it-does">
        <h2>What MOSSImageHFLoader does</h2>
        <p>The node loads the MOSS-Image transformer, Qwen text encoder, tokenizer, and VAE from one local model directory. It returns standard MODEL, CLIP, and VAE outputs for the rest of the ComfyUI graph. It does not accept a Hugging Face Hub repository ID and does not download model files for you.</p>
        <div className="code-block"><pre><code>{`your-model-directory/
├── transformer/
├── text_encoder/
├── tokenizer/
└── vae/`}</code></pre></div>
        <p>The component directories may contain single or sharded safetensors files plus their configuration files. Keep the repository structure intact.</p>
      </section>

      <section id="compare">
        <h2>Choose native ComfyUI or the HF loader</h2>
        <div className="comparison-table-wrap"><table><thead><tr><th></th><th>Native ComfyUI</th><th>MOSSImageHFLoader</th></tr></thead><tbody><tr><th>Status</th><td>Recommended for new installations</td><td>Optional; useful for plugin workflows</td></tr><tr><th>Model format</th><td>Separate ComfyUI-format model files</td><td>Complete Hugging Face Diffusers directory</td></tr><tr><th>Loading nodes</th><td>Native diffusion model, CLIP, and VAE loaders</td><td>One MOSSImageHFLoader node</td></tr><tr><th>Workflow source</th><td>Comfy-Org native template</td><td>OpenMOSS plugin workflow</td></tr></tbody></table></div>
        <p>The two workflow types use different sampling graphs and timestep multipliers. Do not convert one by replacing only its loader. If you are starting fresh, follow the <Link href="/guide/local-deploy/">native installation path</Link>.</p>
      </section>

      <section id="install">
        <h2>Install the official HF-directory plugin</h2>
        <p>Clone or download the official <a href="https://github.com/OpenMOSS/MOSS-Image" target="_blank" rel="noreferrer">OpenMOSS MOSS-Image repository</a>, then choose one installation method.</p>
        <h3>Copy the node directory</h3>
        <div className="code-block"><pre><code>cp -r comfyui/moss-image/ /path/to/ComfyUI/custom_nodes/moss-image/</code></pre></div>
        <h3>Run the official installer</h3>
        <div className="code-block"><pre><code>python comfyui/install.py --comfy-root /path/to/ComfyUI</code></pre></div>
        <p>The installer creates a relative link at <code>custom_nodes/moss-image</code>. It also copies the official plugin workflow into <code>user/default/workflows</code> when a file with the same name is not already there. Restart ComfyUI after installation.</p>
        <p>The plugin uses ComfyUI&apos;s dependencies. If startup reports an import error, update the ComfyUI environment and compare it with the current requirements documented by OpenMOSS instead of installing an unverified requirements file.</p>
      </section>

      <section id="configure">
        <h2>Configure model_path</h2>
        <ol><li>Download the complete <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-Base" target="_blank" rel="noreferrer">MOSS-Image Base</a> or <a href="https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT" target="_blank" rel="noreferrer">MOSS-Image SFT</a> repository.</li><li>Add MOSSImageHFLoader to the graph or import the matching <Link href="/workflows/">official plugin workflow</Link>.</li><li>Set <code>model_path</code> to the directory containing <code>transformer/</code>, <code>text_encoder/</code>, <code>tokenizer/</code>, and <code>vae/</code>.</li><li>Queue one fixed-seed 1024 × 1024 test before changing the graph.</li></ol>
        <p>An absolute path avoids ambiguity:</p>
        <div className="code-block"><pre><code>/home/user/models/MOSS-Image-SFT</code></pre></div>
        <p>A relative path is resolved from the ComfyUI process working directory, which depends on how ComfyUI was launched.</p>
      </section>

      <section id="options">
        <h2>Node options</h2>
        <div className="comparison-table-wrap"><table><thead><tr><th>Parameter</th><th>Current behavior</th></tr></thead><tbody><tr><th><code>model_path</code></th><td>Local path to the complete Diffusers model directory</td></tr><tr><th><code>weight_dtype</code></th><td>Default, BF16, FP32, or one of the exposed FP8 modes</td></tr><tr><th><code>text_device</code></th><td>Default device or CPU</td></tr></tbody></table></div>
        <p>Installing MOSS-Image for the first time? Follow the <Link href="/blog/moss-image-comfyui-guide/">full MOSS-Image ComfyUI setup guide</Link> before tuning loader parameters.</p>
        <p>The loader reads transformer weights from the <code>transformer</code> directory, Qwen3.5 weights from <code>text_encoder</code>, tokenizer data from <code>tokenizer</code>, and VAE weights from <code>vae</code>. The VAE is loaded in FP32, and text encoding is capped at 4096 tokens.</p>
        <div className="callout"><strong>INT8 is not a weight_dtype choice in this node.</strong><p>Official quantized single-file models belong to the native ComfyUI path. The current HF loader exposes BF16, FP32, and FP8 casting choices alongside its default mode.</p></div>
      </section>

      <section id="troubleshooting">
        <h2>MOSSImageHFLoader FAQ and troubleshooting</h2>
        {faqItems.map(item => <div key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}
        <h3>The workflow runs out of memory</h3><p>Reduce canvas dimensions, try a supported FP8 mode when suitable for your hardware, or set <code>text_device</code> to CPU. The best option depends on GPU support and the current ComfyUI memory manager.</p>
        <h3>The output differs from the online studio</h3><p>The online studio submits to a hosted SFT endpoint with 50 inference steps. Its infrastructure and numerical precision are controlled by the provider. The plugin scheduler also differs from the standalone pipeline, so matching a seed does not guarantee a pixel-identical image.</p>
        <h3>Text is imperfect</h3><p>Shorten the requested wording, quote exact text, use explicit line breaks when needed, and proofread every result before publishing.</p>
        <div className="related-links"><Link href="/workflows/">Download plugin workflow</Link><Link href="/guide/local-deploy/">Local install guide</Link><Link href="/comfyui/">ComfyUI overview</Link><Link href="/guide/json-layout/">JSON layout guide</Link></div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Node behavior and installation steps checked October 26, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/README.md" target="_blank" rel="noreferrer">OpenMOSS ComfyUI guide</a>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/install.py" target="_blank" rel="noreferrer">Official install script</a>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/moss-image/nodes.py" target="_blank" rel="noreferrer">MOSSImageHFLoader source</a>
      </section>
    </EditorialPage>
  </>;
}
