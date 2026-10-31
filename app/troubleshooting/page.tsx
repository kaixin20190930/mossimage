import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const canonical = 'https://mossimage.run/troubleshooting/';
const title = 'MOSS-Image Troubleshooting — Fix Noise, Blur & Stripes';
const description = 'Diagnose MOSS-Image vertical stripes, pure noise, weak Base output, blurry previews, Turbo smearing, missing ComfyUI nodes, and FP16 errors.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/troubleshooting/' }, openGraph: { title, description, url: '/troubleshooting/', type: 'website' } };
const issues = [
  { title: 'Faint vertical stripes in SFT', symptom: 'Smooth skies, fog, walls, or gradients show evenly spaced color bands.', cause: 'A community analysis isolated the artifact to SFT and published an optional adapter.', href: '/compare/base-vs-sft/#fixing-sft-vertical-stripes', action: 'Compare stripe fixes' },
  { title: 'Output is pure noise', symptom: 'The graph completes, but no coherent image appears.', cause: 'First check whether a plugin workflow was mixed with native loader nodes.', href: '/guide/settings/#noise', action: 'Align the workflow' },
  { title: 'Base looks flat or weak', symptom: 'A short prompt produces low-contrast or poorly guided output.', cause: 'Base may need a controlled CFG test within the official 3–6 range.', href: '/guide/settings/#base-cfg', action: 'Tune Base guidance' },
  { title: 'SFT suddenly looks blurry', symptom: 'A previously working graph changes after an update or only the preview looks soft.', cause: 'Check the saved file, node versions, console warnings, and a clean environment before retuning.', href: '/guide/settings/#sft-blurry', action: 'Diagnose the regression' },
  { title: 'Turbo output is smeared', symptom: 'A few-step adapter looks overcooked in the standard workflow.', cause: 'The steps, CFG, or sampler do not match that adapter release.', href: '/guide/turbo-lora/#recipes', action: 'Use the matching recipe' },
  { title: 'MOSSImageHFLoader is missing', symptom: 'A plugin workflow opens with an unknown loader node.', cause: 'The optional plugin is absent, in the wrong directory, or failed during startup.', href: '/comfyui/mossimagehfloader/#troubleshooting', action: 'Repair the loader' },
  { title: 'FP16 gives NaN or black output', symptom: 'Lower-precision output fails while BF16 works.', cause: 'Precision support and transformer range vary by setup; test a verified baseline first.', href: '/guide/settings/#precision', action: 'Review precision choices' },
  { title: 'Text or style is inconsistent', symptom: 'Words need correction or a style label does not reproduce the expected look.', cause: 'Image generation is probabilistic; use explicit visual language, save seeds, and proofread.', href: '/guide/prompt/#known-limitations', action: 'Improve the prompt' },
  { title: 'Need to edit an existing image', symptom: 'You want to change clothing, lighting, color, or style while following a reference image.', cause: 'Base and SFT are text-to-image checkpoints; editing requires a compatible Edit LoRA and workflow.', href: '/moss-image-edit/', action: 'Compare edit workflows' },
] as const;

export default function TroubleshootingPage() {
  const data = { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', '@id': `${canonical}#webpage`, name: title, description, url: canonical, dateModified: '2026-10-27' }, breadcrumbStructuredData([{ name: 'MOSS-Image Generator', url: 'https://mossimage.run/' }, { name: 'Troubleshooting', url: canonical }])] };
  return <><JsonLd data={data}/><div className="content-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">MOSS-Image Generator</Link><span aria-hidden="true">/</span><span>Troubleshooting</span></nav><header className="article-header"><span className="eyebrow">PROBLEM SOLVER</span><h1>Common MOSS-Image Problems</h1><p>Start with the symptom you can observe. Each guide separates official defaults from community workarounds and gives you a controlled first test.</p><small className="published-date">Updated October 27, 2026</small></header><div className="directory-grid">{issues.map(issue=><Link href={issue.href} key={issue.title}><span className="eyebrow">{issue.action}</span><h2>{issue.title}</h2><p><strong>Symptom:</strong> {issue.symptom}</p><p><strong>Check first:</strong> {issue.cause}</p></Link>)}</div><div className="article-bottom"><Link href="/">MOSS-Image Generator</Link><Link href="/guide/">All guides</Link></div></div></>;
}
