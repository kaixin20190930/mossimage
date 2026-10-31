import type { Metadata } from 'next';
import Link from 'next/link';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

export const metadata: Metadata = {
  title: 'Funnel Analytics — MOSS Image',
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return <div className="content-page analytics-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">MOSS-Image Generator</Link><span aria-hidden="true">/</span><span>Funnel analytics</span></nav>
    <header className="article-header"><span className="eyebrow">PRIVATE REPORT</span><h1>Funnel analytics</h1><p>First-party product events stored in the existing Cloudflare Durable Object.</p></header>
    <AnalyticsDashboard/>
  </div>;
}
