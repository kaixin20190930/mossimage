import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { contentLastModified } from '@/lib/content-dates';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.comfyui;
const canonical = 'https://mossimage.run/comfyui/';
const modifiedDate = contentLastModified.comfyui;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/comfyui/' },
  openGraph: { title: page.title, description: page.description, url: '/comfyui/', type: 'article' },
};

const sections = [
  { id: 'choose', title: 'Choose a setup path' },
  { id: 'native', title: 'Native ComfyUI' },
  { id: 'loader', title: 'MOSSImageHFLoader' },
  { id: 'first-run', title: 'Run the first test' },
  { id: 'next', title: 'Go to the right guide' },
] as const;

export default function ComfyUIPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        name: page.title,
        description: page.description,
        url: canonical,
        dateModified: modifiedDate,
        isPartOf: { '@id': 'https://mossimage.run/#website' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'MOSS Image ComfyUI Setup', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'ComfyUI Setup' }]}
      eyebrow="COMFYUI SETUP"
      title={page.heading}
      intro="Choose native ComfyUI for a new installation, or MOSSImageHFLoader when a complete Diffusers repository is already on disk. Match the model files, loader, and workflow before you queue the first image."
      sections={sections}
      bottomLink={{ href: '/guide/', label: 'All setup guides' }}
      publishedDate="October 23, 2026 · Updated November 7, 2026"
    >
      <section id="choose">
        <h2>Choose native ComfyUI or MOSSImageHFLoader</h2>
        <p>Use one complete path. Native support and the optional HF-directory plugin expect different model layouts and workflow graphs, so replacing only the loader node is not a reliable conversion.</p>
        <div className="comparison-table-wrap"><table><thead><tr><th>Path</th><th>What it loads</th><th>Choose it when</th><th>Continue to</th></tr></thead><tbody>
          <tr><th>Native ComfyUI</th><td>Separate diffusion model, text encoder, and VAE files</td><td>You are starting fresh or already use a current ComfyUI build</td><td><Link href="/guide/local-deploy/#native">Native installation steps</Link></td></tr>
          <tr><th>MOSSImageHFLoader</th><td>A complete local Diffusers directory containing <code>transformer/</code>, <code>text_encoder/</code>, <code>tokenizer/</code>, and <code>vae/</code></td><td>You already downloaded the Diffusers repository or use a plugin workflow</td><td><Link href="/comfyui/mossimagehfloader/">Loader setup and errors</Link></td></tr>
        </tbody></table></div>
        <div className="callout"><strong>Recommended starting point: native ComfyUI.</strong><p>Use MOSSImageHFLoader only for its documented directory-based path. It does not download a Hugging Face repository from an ID and it does not accept a single checkpoint file.</p></div>
      </section>

      <section id="native">
        <h2>Native ComfyUI uses built-in loaders</h2>
        <p>Update to a current ComfyUI build that includes MOSS-Image support. Place the diffusion model in <code>models/diffusion_models/</code>, the text encoder in <code>models/text_encoders/</code>, and the VAE in <code>models/vae/</code>. Import the native workflow as a complete graph.</p>
        <div className="related-links"><Link href="/guide/local-deploy/#native">Follow the native install</Link><Link href="/workflows/#download">Download the native SFT workflow</Link></div>
      </section>

      <section id="loader">
        <h2>MOSSImageHFLoader uses a complete local directory</h2>
        <p>Install the optional OpenMOSS custom node, restart ComfyUI, and point <code>model_path</code> at the directory that contains all four required component folders. The mirrored plugin workflow on this site uses the Base checkpoint and its own sampling graph.</p>
        <div className="related-links"><Link href="/comfyui/mossimagehfloader/">Configure every loader field</Link><Link href="/workflows/#download">Download the HF-directory Base workflow</Link></div>
      </section>

      <section id="first-run">
        <h2>Run one controlled image before changing the graph</h2>
        <ol>
          <li>Import the complete workflow that matches your loader path.</li>
          <li>Keep its stored sampler, scheduler, steps, CFG, and shift settings.</li>
          <li>Use one square image and a fixed seed for the first queue.</li>
          <li>Save the working graph and model filenames before adding extensions or changing precision.</li>
        </ol>
        <p>If native nodes are unknown, update ComfyUI. If MOSSImageHFLoader is missing, inspect the startup log for custom-node import errors. If <code>model_path</code> is invalid, confirm that it points to the complete directory rather than a single file.</p>
      </section>

      <section id="next" className="prompt-final-cta">
        <h2>Go straight to the guide for your next job</h2>
        <p>Use the local install guide for the full setup, the workflows page for the two verified downloads, or the loader reference for plugin-specific parameters and errors.</p>
        <div className="related-links"><Link href="/guide/local-deploy/">Install MOSS-Image locally</Link><Link href="/workflows/">Choose a workflow</Link><Link href="/comfyui/mossimagehfloader/">Fix MOSSImageHFLoader</Link><Link href="/guide/settings/">Check generation settings</Link></div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Setup and workflow behavior checked against the official sources on October 26, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/comfyui/README.md" target="_blank" rel="noreferrer">OpenMOSS ComfyUI guide</a>
        <a href="https://huggingface.co/Comfy-Org/MOSS-Image" target="_blank" rel="noreferrer">ComfyUI-format model files</a>
      </section>
    </EditorialPage>
  </>;
}
