import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const canonical = 'https://mossimage.run/featured-on/';
const title = 'MOSS-Image Generator — Featured On & Listed At';
const description = 'Published MossImage Studio listings, community resources, launch platforms, and directory submissions that are still under review.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/featured-on/' },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: '/featured-on/', type: 'website' },
};

const groups = [
  {
    id: 'directories',
    title: 'AI Tool Directories',
    links: [
      { name: 'SaaSHub', href: 'https://www.saashub.com/', description: 'Software discovery and alternative comparison directory.' },
      { name: 'AI Best Tool', href: 'https://aibesttool.com/', description: 'AI tool discovery and evidence-based comparison directory.' },
      { name: 'Publish Your SaaS', href: 'https://publishyoursaas.com/listing/mossimage-run', description: 'Published MossImage Studio product listing.' },
    ],
  },
  {
    id: 'launch-platforms',
    title: 'Launch Platforms',
    links: [
      { name: 'Product Hunt', href: 'https://www.producthunt.com/products/moss-image-generator', description: 'MOSS-Image Generator product launch page.' },
      { name: 'Medium', href: 'https://medium.com/@hello_23399', description: 'Articles about MOSS-Image workflows and product updates.' },
    ],
  },
  {
    id: 'open-source',
    title: 'Open-Source Communities',
    links: [
      { name: 'Hugging Face Space', href: 'https://huggingface.co/spaces/kaixin20190930/mossimage-studio', description: 'MossImage Studio community Space and browser demo.' },
      { name: 'GitHub — mossimage-workflow', href: 'https://github.com/kaixin20190930/mossimage-workflow', description: 'Downloadable MOSS-Image ComfyUI workflow resources.' },
      { name: 'GitHub — mossimage-prompts', href: 'https://github.com/kaixin20190930/mossimage-prompts', description: 'Reusable prompt examples and JSON layout ideas.' },
      { name: 'DEV Community', href: 'https://dev.to/kai_liu_9dbaeadb110db2d41/generate-images-by-describing-object-positions-in-json-moss-image-walkthrough-1nk0', description: 'Practical walkthrough of MOSS-Image JSON layouts.' },
    ],
  },
  {
    id: 'directory-submissions',
    title: 'Directory Submissions',
    links: [
      { name: 'Nick Launches', href: 'https://nicklaunches.com/', description: 'Reciprocal link prepared; submission not yet sent.' },
      { name: 'Dang AI', href: 'https://dang.ai/', description: 'Submitted for review; publication expected around November 10.' },
      { name: 'SaaSVault', href: 'https://saasvault.pro/p/MossImage-Studio', description: 'Submitted for review; the directory is temporarily unavailable.' },
    ],
  },
] as const;

export default function FeaturedOnPage() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        name: title,
        description,
        url: canonical,
        dateModified: '2026-10-28',
        isPartOf: { '@id': 'https://mossimage.run/#website' },
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Featured On', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={data}/>
    <div className="content-page featured-on-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">MOSS-Image Generator</Link><span aria-hidden="true">/</span><span>Featured On</span>
      </nav>
      <header className="article-header">
        <span className="eyebrow">AROUND THE WEB</span>
        <h1>MossImage Studio Around the Web</h1>
        <p>MossImage Studio is a browser-based interface for the MOSS-Image model, with three starter images for verified accounts. Published listings and community resources are shown separately from directory submissions that are still pending review or publication.</p>
      </header>

      <div className="featured-groups">
        {groups.map(group => <section id={group.id} key={group.id}>
          <h2>{group.title}</h2>
          <ul>
            {group.links.map(item => <li key={item.href}>
              <a href={item.href}>{item.name}</a>
              <span>{item.description}</span>
            </li>)}
          </ul>
        </section>)}
      </div>

      <section className="featured-contact">
        <p>If you run a directory and would like to list MossImage Studio, contact <a href="mailto:support@mossimage.run">support@mossimage.run</a>.</p>
      </section>
    </div>
  </>;
}
