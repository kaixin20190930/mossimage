import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-posts';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const title = 'MOSS-Image Blog — Guides, Tests & Real Prompts';
const description = 'Practical MOSS-Image tutorials, transparent model tests, JSON layout guidance, Chinese text techniques, and real prompts with saved settings.';

export const metadata: Metadata = {
  title, description, alternates: { canonical: '/blog/' },
  openGraph: { title, description, url: '/blog/', type: 'website', images: ['/images/featured/bilingual-menu.webp'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/images/featured/bilingual-menu.webp'] },
};

export default function BlogPage() {
  const canonical = 'https://mossimage.run/blog/';
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${canonical}#collection`, name: title, description, url: canonical, isPartOf: { '@id': 'https://mossimage.run/#website' } },
      { '@type': 'ItemList', itemListElement: blogPosts.map((post, index) => ({ '@type': 'ListItem', position: index + 1, name: post.heading, url: `${canonical}${post.slug}/` })) },
      breadcrumbStructuredData([{ name: 'MOSS-Image Generator', url: 'https://mossimage.run/' }, { name: 'Blog', url: canonical }]),
    ],
  };
  return <>
    <JsonLd data={structuredData}/>
    <div className="content-page blog-index">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">MOSS-Image Generator</Link><span>/</span><span aria-current="page">Blog</span></nav>
      <header className="article-header"><span className="eyebrow">FIELD NOTES</span><h1>MOSS-Image guides and experiments</h1><p>Practical setup instructions, transparent model tests, structured layout references, and reusable prompts built from real outputs.</p></header>
      <div className="blog-grid">
        {blogPosts.map((post, index) => <article className={index === 0 ? 'featured' : ''} key={post.slug}>
          <Link className="blog-card-image" href={`/blog/${post.slug}/`}><Image src={post.cover} alt="" fill priority={index === 0} sizes={index === 0 ? '(max-width: 760px) 100vw, 66vw' : '(max-width: 760px) 100vw, 33vw'}/></Link>
          <div><span className="eyebrow">GUIDE · {post.publishedLabel.toUpperCase()}</span><h2><Link href={`/blog/${post.slug}/`}>{post.heading}</Link></h2><p>{post.excerpt}</p><Link className="blog-read" href={`/blog/${post.slug}/`}>Read article</Link></div>
        </article>)}
      </div>
    </div>
  </>;
}
