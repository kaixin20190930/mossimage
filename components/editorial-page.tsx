import type { ReactNode } from 'react';
import Link from 'next/link';
import { publishedDate as defaultPublishedDate } from '@/lib/landing-pages';

type Breadcrumb = { label: string; href?: string };
type SectionLink = { id: string; title: string };

export function EditorialPage({
  breadcrumbs,
  eyebrow,
  title,
  intro,
  sections,
  children,
  bottomLink,
  publishedDate = defaultPublishedDate,
}: {
  breadcrumbs: readonly Breadcrumb[];
  eyebrow: string;
  title: string;
  intro: string;
  sections: readonly SectionLink[];
  children: ReactNode;
  bottomLink: { href: string; label: string };
  publishedDate?: string;
}) {
  return <div className="content-page editorial-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => <span className="breadcrumb-item" key={item.label}>
        {index > 0 && <span aria-hidden="true">/</span>} 
        {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
      </span>)}
    </nav>
    <header className="article-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{intro}</p>
      <small className="published-date">Published {publishedDate}</small>
    </header>
    <div className="article-layout">
      <article className="article-body editorial-body">{children}</article>
      <aside>
        <span className="eyebrow">ON THIS PAGE</span>
        {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        <div className="aside-cta">
          <span>Make something<br/><em>only you could imagine.</em></span>
          <Link href="/#studio">Open the studio </Link>
        </div>
      </aside>
    </div>
    <div className="article-bottom">
      <Link href="/">MOSS-Image Generator </Link>
      <Link href={bottomLink.href}>{bottomLink.label}</Link>
    </div>
  </div>;
}
