import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { EditorialPage } from '@/components/editorial-page';
import { landingPages } from '@/lib/landing-pages';
import { pricingPlans } from '@/lib/plans';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.free;
const canonical = 'https://mossimage.run/free/';

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/free/' },
  openGraph: { title: page.title, description: page.description, url: '/free/', type: 'website' },
};

const sections = [
  { id: 'included', title: 'What is included' },
  { id: 'start', title: 'How to start' },
  { id: 'modes', title: 'What you can create' },
  { id: 'after', title: 'After three images' },
] as const;

export default function FreePage() {
  const free = pricingPlans[0];
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.description,
        isPartOf: { '@id': 'https://mossimage.run/#website' },
        about: { '@type': 'SoftwareApplication', name: 'MOSS-Image Generator', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Free generator', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Free generator' }]}
      eyebrow="START FREE"
      title={page.heading}
      intro="Create three full-quality starter images after a quick email verification. Explore text prompts, bilingual lettering, and structured layouts without entering payment details."
      sections={sections}
      bottomLink={{ href: '/pricing/', label: 'Compare all plans' }}
      publishedDate="October 26, 2026"
    >
      <section id="included">
        <h2>Three starter images, with the full creative toolkit</h2>
        <p>Every verified account receives three one-time starter credits. Each completed generation uses one credit, regardless of the available canvas shape. The credits remain on the account until used.</p>
        <div className="feature-list">
          {free.features.map(feature => <span key={feature}><Check size={15}/>{feature}</span>)}
        </div>
        <p className="small-note">Generation uses a shared service budget and cooldown. Availability can pause temporarily when the daily budget is reached.</p>
        <p className="small-note">When the service confirms a technical failure or safety rejection, the reserved credit is restored automatically. If a submitted job is still being checked, the studio lets you check that original job before starting another.</p>
      </section>

      <section id="start">
        <h2>How to start</h2>
        <ol>
          <li>Open the studio and choose <strong>Sign in</strong>.</li>
          <li>Enter your email address, then submit the one-time code sent to that inbox.</li>
          <li>Write a prompt or switch to JSON Layout, choose a canvas, and generate.</li>
        </ol>
        <p>No credit card is requested and no subscription begins automatically.</p>
        <Link className="inline-action" href="/#studio">Generate your first image </Link>
      </section>

      <section id="modes">
        <h2>What you can create</h2>
        <p>Use a natural-language prompt for illustrations, posters, product concepts, social graphics, or editorial scenes. Put exact words in quotation marks when the design needs visible lettering in English or Chinese.</p>
        <p>For more deliberate composition, JSON Layout lets you describe text and object regions with centered bounding boxes. It is useful when a headline, product, and supporting element need distinct areas of the canvas.</p>
        <div className="related-links">
          <Link href="/guide/prompt/">Read the prompt guide </Link>
          <Link href="/guide/json-layout/">Learn JSON layouts </Link>
        </div>
      </section>

      <section id="after">
        <h2>After your starter credits</h2>
        <p>You can stop with no charge, buy 30 non-expiring credits for $9.99, or choose a monthly or annual plan. The account menu shows your remaining balance and opens Stripe&apos;s billing portal for active subscriptions.</p>
        <div className="plan-summary">
          {pricingPlans.slice(1).map(plan => <article key={plan.id}>
            <span className="eyebrow">{plan.eyebrow}</span>
            <h3>{plan.priceLabel}<small>{plan.unit}</small></h3>
            <p>{plan.amount}</p>
          </article>)}
        </div>
        <Link className="inline-action" href="/pricing/">See pricing details </Link>
      </section>
    </EditorialPage>
  </>;
}
