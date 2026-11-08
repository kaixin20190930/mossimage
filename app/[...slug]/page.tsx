export const dynamicParams = false;
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articles, directories } from '@/lib/content';
import { landingPages } from '@/lib/landing-pages';
import { policyUpdatedLabels } from '@/lib/content-dates';

const legal = {
  privacy: {
    slug:'privacy', title:'Privacy — MOSS Image', heading:'Privacy Policy', description:'How MOSS Image handles account, generation, payment, and operational data.',
    sections:[
      {title:'Information we process',text:'We process your email address to create and secure your account. A server-side session identifier is stored in an HttpOnly cookie. We keep credit balances, purchase and subscription references, generation status, and limited operational records needed to provide the service and prevent abuse. Do not submit confidential or sensitive personal information in prompts.'},
      {title:'Image generation and private history',text:'Prompts, selected dimensions, seeds, and generation settings are sent to fal.ai for processing. For signed-in accounts, completed images are copied to private Cloudflare R2 storage and listed in account history together with their prompt and settings. Images are served only after an account session check and remain until you delete them or request account deletion. Provider systems and infrastructure logs are governed by their own retention and privacy practices.'},
      {title:'Payments',text:'Stripe processes Checkout, subscriptions, refunds, and billing management. MOSS Image stores Stripe customer, subscription, event, and transaction references, but does not receive or store full payment card numbers. Stripe may process billing contact, payment, fraud-prevention, and tax information under its own privacy terms.'},
      {title:'First-party usage analytics',text:'We count a limited set of product events, such as generation attempts, email verification steps, pricing views, and checkout steps. These records use a random browser identifier that is signed before storage and do not contain email addresses, prompts, generated images, or IP addresses. Event records are retained for up to 90 days and are used to understand where the product flow succeeds or fails.'},
      {title:'Image-editing early access',text:'The early-access request form stores the editing workflows you select and an optional short note. If you provide an email for a possible invitation, the address is encrypted before storage and a keyed summary is used for deduplication. It is not added to a marketing list. The form does not accept or store image uploads. Email support@mossimage.run to request deletion of an early-access submission.'},
      {title:'Security, retention, and choices',text:'Account sessions normally expire after 30 days. One-time login codes expire after 10 minutes. From your account page, you can delete saved images, export account and generation data with seven-day image download links, or permanently delete the account. Account deletion also deletes the Stripe customer profile and immediately cancels active subscriptions; it does not automatically create a refund. We retain an irreversible keyed summary of the account email only to prevent repeated starter-credit claims and abuse. Stripe may retain required transaction history under its own policies. If you cannot sign in, email support@mossimage.run; verified privacy requests are normally completed within 30 days.'},
    ],
  },
  terms: {
    slug:'terms', title:'Terms — MOSS Image', heading:'Terms of Use', description:'Rules for accounts, image credits, subscriptions, and use of the independent MOSS Image studio.',
    sections:[
      {title:'The service',text:'MOSS Image is operated by Moxion Labs LLC and is not affiliated with OpenMOSS or fal.ai. Generation depends on third-party infrastructure and a shared operating budget. Availability, completion time, and artistic quality are not guaranteed. You must be able to enter a binding agreement in your jurisdiction to make a purchase.'},
      {title:'Accounts and credits',text:'A verified account receives three starter image credits once. A successful image request consumes one credit. Subscription credits are used before starter and non-expiring pack credits. Monthly credits may roll over for one additional cycle up to 160 total; annual credits remain available during the paid annual term. Credits have no cash value, cannot be transferred, and may not be resold.'},
      {title:'Subscriptions and cancellation',text:'Monthly and annual subscriptions renew automatically until canceled. Prices are in US dollars before applicable tax. You can cancel renewal through the billing portal; access and remaining current-term credits continue until the end of the paid period unless the account is suspended for abuse or a payment is reversed. Canceling does not itself create a refund.'},
      {title:'Account deletion',text:'You can permanently delete your account from the account page. Deletion removes saved images and local account records, deletes the Stripe customer profile, and immediately cancels active subscriptions without automatically issuing a refund. If you cannot access the account, email support@mossimage.run. After verifying the request, we normally complete it within 30 days, subject to records we must retain for payment, fraud-prevention, dispute, or legal obligations.'},
      {title:'Generation results and failures',text:'A technical failure, safety block, or response without a usable image restores the reserved credit automatically. Generated content can contain errors, unwanted material, or inaccurate text. A result that is technically delivered but does not match a subjective preference is not a technical failure. Review every result before use.'},
      {title:'Acceptable use',text:'Submit only content you have permission to use. Do not use the service for illegal activity, fraud, harassment, non-consensual intimate imagery, sexual content involving minors, rights violations, security abuse, automated account farming, or attempts to bypass quotas and safety controls. We may freeze or close accounts involved in abuse, disputes, or payment fraud.'},
    ],
  },
  refund: {
    slug:'refund', title:'Refund Policy — MOSS Image', heading:'Refund Policy', description:'When MOSS Image purchases and subscriptions qualify for a refund.',
    sections:[
      {title:'Credit packs',text:'A one-time credit pack can be refunded within 14 days of purchase if none of its credits have been used. Once any credit from that pack has been consumed, the pack is ordinarily non-refundable except where required by law or where the payment was duplicated or processed incorrectly.'},
      {title:'Subscriptions',text:'A first monthly or annual subscription payment can be refunded within 7 days if no paid subscription credit has been used. Renewals and partially used billing periods are ordinarily non-refundable. Cancel through the billing portal before renewal to prevent the next charge. Mandatory consumer rights in your jurisdiction take precedence over this policy.'},
      {title:'Failed generations',text:'Technical failures, safety blocks, and responses without a usable image return the reserved image credit automatically. Because image generation is probabilistic, artistic preference, prompt interpretation, and correct-but-unwanted variations do not qualify as technical failures.'},
      {title:'How to request help',text:'Email support@mossimage.run from the address on your account and include the Stripe receipt or invoice number. Approved refunds return to the original payment method. Bank processing time is outside our control. Duplicate charges, unauthorized transactions, and account access problems should be reported promptly.'},
    ],
  },
  contact: {
    slug:'contact', title:'Contact — MOSS Image', heading:'Contact MOSS Image', description:'Get help with generation, credits, billing, privacy, or account access.',
    sections:[
      {title:'Customer support',text:'Email support@mossimage.run for account access, generation credits, billing, refunds, or privacy requests. Include the email address on your account and a receipt or request ID when relevant. Never send a full card number, password, or one-time sign-in code.'},
      {title:'Billing and cancellation',text:'Subscribers can cancel renewal or update billing details through the account billing portal. If you cannot access the portal, contact support from the account email before the renewal date.'},
      {title:'Service identity',text:'MOSS Image is an independent digital image-generation service operated by Moxion Labs LLC. Legal correspondence may be sent to its registered agent address: 30 N Gould St, Ste N, Sheridan, WY 82801, USA. Customer support is provided by email at support@mossimage.run during published business hours.'},
    ],
  },
} as const;

export function generateStaticParams(){return [...articles.filter(page=>page.slug!=='guide/local-deploy'),...directories,...Object.values(legal)].map(page=>({slug:page.slug.split('/')}))}
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}):Promise<Metadata>{const{slug}=await params;const path=slug.join('/');const page=articles.find(item=>item.slug===path)||directories.find(item=>item.slug===path)||legal[path as keyof typeof legal];if(!page)return{};return{title:page.title,description:page.description,alternates:{canonical:`/${path}/`},openGraph:{title:page.title,description:page.description,url:`/${path}/`,type:'article'}}}

export default async function ContentPage({params}:{params:Promise<{slug:string[]}>}){
  const{slug}=await params;const path=slug.join('/');const directory=directories.find(item=>item.slug===path);const article=articles.find(item=>item.slug===path);const policy=legal[path as keyof typeof legal];if(!directory&&!article&&!policy)notFound();const parent=path.includes('/')?path.split('/')[0]:null;const sections=article?.sections||policy?.sections||[];
  const directoryArticles = directory ? [
    ...(path === 'compare' ? [
      { ...landingPages.baseVsSft, heading: 'MOSS-Image Base vs SFT: Which Model Should You Use?', category: 'MODEL COMPARISON', intro: 'Compare text rendering, JSON layouts, licensing, and ComfyUI setup between the two checkpoints.' },
      { ...landingPages.flux, category: 'COMPARISON', intro: 'Compare structured layouts, bilingual text support, licensing, and workflow fit.' },
    ] : []),
    ...(path === 'guide' ? [
      { ...landingPages.prompt, category: 'INTERACTIVE TOOL', intro: 'Build a complete prompt from subjects, styles, lighting, visible text, and optional layout guidance.' },
      { ...landingPages.jsonLayoutGenerator, category: 'LAYOUT BUILDER', intro: 'Choose a menu, poster, or label template, edit its text, and export valid layout JSON.' },
      { ...landingPages.jsonLayout, category: 'LAYOUT CONTROL', intro: 'Build a structured prompt with documented fields and centered bounding boxes.' },
      { ...landingPages.chinese, category: 'TEXT RENDERING', intro: 'Write Chinese and English text, build bilingual layouts, and proofread generated lettering.' },
      { slug: 'comfyui', heading: 'MOSS Image ComfyUI Setup', category: 'WORKFLOWS', intro: 'Install native support or MOSSImageHFLoader and use the matching workflow.' },
      { ...landingPages.baseVsSft, heading: 'MOSS-Image Base vs SFT', category: 'MODEL COMPARISON', intro: 'Choose between the foundation checkpoint and its supervised fine-tuned version.' },
      { slug: 'compare', heading: 'MOSS Image Comparisons', category: 'MODEL SELECTION', intro: 'Compare MOSS-Image with other checkpoints and image model families.' },
      { slug: 'gallery', heading: 'Real MOSS-Image Creations', category: 'GALLERY', intro: 'Explore 31 real outputs with their original prompts, settings, and layouts.' },
      { slug: 'guide/settings', heading: 'MOSS-Image Settings', category: 'SETTINGS REFERENCE', intro: 'Match Base, SFT, native, plugin, and Turbo settings to the workflow you actually loaded.' },
      { slug: 'guide/turbo-lora', heading: 'MOSS-Image Turbo LoRA Guide', category: 'FEW-STEP GENERATION', intro: 'Use adapter-specific steps, CFG, samplers, and strengths without smudged output.' },
      { slug: 'guide/base-guide', heading: 'MOSS-Image Base Guide', category: 'BASE CHECKPOINT', intro: 'Use verified Base sampling, prompt, workflow, and LoRA-training guidance.' },
      { slug: 'troubleshooting', heading: 'MOSS-Image Troubleshooting', category: 'PROBLEM SOLVER', intro: 'Find focused fixes for stripes, noise, blur, loader errors, and precision problems.' },
      { slug: 'moss-image-edit', heading: 'Can MOSS-Image Edit Images?', category: 'IMAGE EDITING', intro: 'Compare verified Edit LoRAs, native ComfyUI support, reference-image workflows, and their limits.' },
    ] : []),
    ...articles.filter(item=>item.slug.startsWith(path+'/')),
  ] : [];
  return <div className="content-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">MOSS-Image Generator</Link><span aria-hidden="true">/</span>{parent&&<><Link href={`/${parent}/`}>{parent==='guide'?'Guides':'Comparisons'}</Link><span aria-hidden="true">/</span></>}<span>{directory?directory.slug:article?.heading||policy?.heading}</span></nav><header className="article-header"><span className="eyebrow">{article?.category||(directory?'THE FIELD NOTES':'INFORMATION')}</span><h1>{directory?.heading||article?.heading||policy?.heading}</h1><p>{directory?.intro||article?.intro||policy?.description}</p>{policy&&<small className="policy-date">Last updated {policyUpdatedLabels[path]}</small>}</header>{directory?<div className="directory-grid">{directoryArticles.map(item=><Link href={`/${item.slug}/`} key={item.slug}><span className="eyebrow">{item.category}</span><h2>{item.heading}</h2><p>{item.intro}</p></Link>)}</div>:<div className="article-layout"><article className="article-body">{sections.map((section,index)=><section id={`section-${index}`} key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}{article?.relatedLinks&&<section><h2>Related guides</h2><div className="related-links">{article.relatedLinks.map(link=><Link key={link.href} href={link.href}>{link.label}</Link>)}</div></section>}{article?.links&&<section className="sources"><h2>Go to the source</h2><p>Official references, checked October 21, 2026.</p>{article.links.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</section>}</article><aside><span className="eyebrow">ON THIS PAGE</span>{sections.map((section,index)=><a key={section.title} href={`#section-${index}`}>{section.title}</a>)}<div className="aside-cta"><span>Make something<br/><em>only you could imagine.</em></span><Link href="/#studio">Open the studio </Link></div></aside></div>}<div className="article-bottom"><Link href="/">MOSS-Image Generator </Link><Link href={parent?`/${parent}/`:'/pricing/'}>{parent==='compare'?'All comparisons':'View pricing'}</Link></div></div>;
}
