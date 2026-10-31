import type { Metadata } from 'next';
import Link from 'next/link';
import { presets } from '@/lib/presets';

export const metadata: Metadata = {
  title: 'MOSS-Image Presets — Tested Prompts & Settings',
  description: 'Open tested MOSS-Image SFT starting points for product photos, posters, menus, labels, infographics, and quote cards with real outputs.',
  alternates: { canonical: '/presets/' },
};

export default function PresetsPage() {
  return <div className="content-page preset-index"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Presets</span></nav><header className="article-header"><span className="eyebrow">TESTED STARTING POINTS</span><h1>MOSS-Image Studio Presets</h1><p>Choose a tested prompt and open it with the hosted SFT reference settings. Every preset is backed by real studio outputs. These presets apply CFG and inference steps; local ComfyUI controls such as shift and SLG remain part of their matching workflows.</p></header><div className="directory-grid">{Object.entries(presets).map(([slug, preset]) => <Link href={`/presets/${slug}/`} key={slug}><span>HOSTED SFT PRESET</span><h2>{preset.name}</h2><p>{preset.intro}</p></Link>)}</div></div>;
}
