import { defaultOpenGraphImage } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Braces, Type, Sprout } from 'lucide-react';
import { Studio } from '@/components/studio';
import { Pricing } from '@/components/pricing';
import { homeMetadata } from '@/lib/content';
import { creditRestorePolicy } from '@/lib/generation-policy';
import { homeStructuredData, JsonLd } from '@/lib/structured-data';

export const metadata: Metadata = { ...homeMetadata, alternates: { canonical: '/' }, openGraph: { ...defaultOpenGraphImage, ...homeMetadata, url: '/', type: 'website' } };

const features = [
  { number: '01 /', title: 'Words that belong in the picture.', text: 'Create posters, labels, and visual stories with Chinese or English lettering. Always proofread generated text before sharing.', href: '/text-in-image-generator/', link: 'Open the text-in-image generator' },
  { number: '02 /', title: 'A place for every little detail.', text: 'Switch to JSON layout to describe where text and objects should go. A more intentional starting point for your composition.', href: '/guide/json-layout/', link: 'JSON Layout guide' },
  { number: '03 /', title: 'Room to make it your own.', text: 'Start in the browser, then explore official weights and ComfyUI workflows when you want a more hands-on creative process.' },
];
const guides = [
  ['/workflows/','01','ComfyUI workflow download','Import the verified workflow and follow the setup guide.'],
  ['/guide/prompt/','02','The art of a good prompt','Find the words for what you imagine.'],
  ['/guide/json-layout/','03','A guide to JSON layouts','Give every element a place.'],
  ['/compare/','04','Find your model','Compare around your creative needs.'],
];
const faqs = [
  ['What is MOSS-Image?','MOSS-Image is a 5B-parameter image-generation model family from OpenMOSS, with Base and SFT checkpoints. You can explore its official code and model cards through our guides. This site is independently operated.'],
  ['Is the generator free?','Yes. A verified account starts with three images. Credit packs and subscriptions add more images when you need them, subject to the shared daily service budget.'],
  ['What happens when a generation fails?',`${creditRestorePolicy} Artistic variation is part of image generation, so review every result.`],
  ['Can I control the layout?','Yes. JSON layout mode accepts a scene description and bounding boxes for text and objects. It validates your structure and canvas bounds before submitting.'],
  ['Where do my prompts and images go?','Prompts and settings are sent to fal.ai for generation. Completed images are copied to private Cloudflare R2 storage and require your signed-in account to access. You can permanently delete saved images from your account; see the Privacy page for details.'],
];

export default function Home() {
  return <>
    <JsonLd data={homeStructuredData}/>
    <section className="hero"><span className="hero-badge"><span/> OPEN MODEL. OPEN POSSIBILITIES.</span><h1>MOSS-Image Generator</h1><p>Let your ideas <em>take shape.</em></p><div className="hero-description">MOSS-Image is an open-source text-to-image model family with Base and SFT checkpoints. SFT is the hosted option for posters, menus, labels, and images with Chinese or English text. Try one preview without signing in, or run Base and SFT locally with ComfyUI.</div><div className="feature-chips"><span><Sprout size={14}/> Open-source model</span><span><Type size={15}/> Chinese & English text</span><span><Braces size={15}/> JSON layout control</span></div><div className="hero-proof"><Link href="/free/">3 starter images after verification</Link><span>1 preview without signing in</span><Link href="/pricing/">View pricing</Link></div></section>
    <section className="trust-strip" aria-label="Product details"><div><strong>Open model</strong><span>Built on MOSS-Image</span></div><div><strong>Apache 2.0</strong><span>Model checkpoints</span></div><div><strong>fal.ai</strong><span>Hosted generation</span></div><div><strong>No watermark</strong><span>Clean downloads</span></div></section>
    <Studio/>
    <section className="about-section"><div><span className="eyebrow">A NEW KIND OF CREATIVE SPACE</span><h2>Big ideas.<br/><em>Thoughtful details.</em></h2><p><Link className="inline-text-link" href="/moss-image-ai/">MOSS-Image</Link> is an image model from OpenMOSS. This independent studio brings its creative possibilities into a simple place to start.</p><Link className="text-link" href="/guide/">Meet your new creative toolkit</Link></div><div className="about-features">{features.map(feature=><article key={feature.number}><span>{feature.number}</span><div><h3>{feature.title}</h3><p>{feature.text}{feature.href&&<> <Link className="inline-text-link" href={feature.href}>{feature.link}</Link></>}</p></div></article>)}</div></section>
    <section className="how-section"><div className="section-heading"><div><span className="eyebrow">FROM THOUGHT TO THING</span><h2>A small spark is all you need.</h2></div></div><div className="steps"><article><span>01</span><h3>Imagine something.</h3><p>Describe the subject, mood, and light. Add exact words in quotes if your image needs text.</p></article><article><span>02</span><h3>Give it a little direction.</h3><p>Choose a canvas shape, or use a JSON layout to guide the placement of specific elements.</p></article><article><span>03</span><h3>Make it yours.</h3><p>Generate, review, and download. Refine your prompt to explore another direction.</p></article></div></section>
    <Pricing/>
    <section className="learning"><div className="section-heading"><div><span className="eyebrow">KEEP EXPLORING</span><h2>A little know-how goes a long way.</h2></div><Link href="/guide/" className="text-link">All guides</Link></div><div className="learning-grid">{guides.map(([href,n,title,desc])=><Link key={href} href={href}><span>{n}</span><h3>{title}</h3><p>{desc}</p></Link>)}</div></section>
    <section className="early-access-promo"><span className="eyebrow">IMAGE EDITING EARLY ACCESS</span><h2>Want to edit an image you already have?</h2><p>The hosted studio generates new images from text and JSON layouts today. Tell us whether style changes, selective repainting, text replacement, or composition-preserving edits should come next.</p><Link className="inline-action" href="/image-editing-early-access/">Join image-editing early access</Link></section>
    <section className="faq"><span className="eyebrow">GOOD TO KNOW</span><h2>A few things you might be wondering.</h2>{faqs.map(([question,answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</section>
    <section aria-label="Listings" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <a href="https://publishyoursaas.com" target="_blank" rel="noopener" data-publishyoursaas-badge="manual-submission">
        {/* The directory verifier requires its original badge image URL. */}
        <img src="https://publishyoursaas.com/publishyoursaas-badge.svg" alt="Listed on PublishYourSaaS" width={240} height={60} loading="lazy"/>
      </a>
      <a href="https://saasvault.pro/p/MossImage-Studio" target="_blank" rel="noopener">
        <img src="https://saasvault.pro/saasvault-badge.svg" alt="Listed on SaaSVault" width={204} height={46} loading="lazy"/>
      </a>
    </section>
  </>;
}
