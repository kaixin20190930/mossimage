'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { featuredImageById } from '@/lib/featured-images';

const comparisons = [
  { id: 'menu', label: 'Menu text', promptId: 'm1', moss: '/images/evaluation/m1.webp', flux: '/images/evaluation/f1.webp' },
  { id: 'label', label: 'Product label', promptId: 'm5', moss: '/images/evaluation/m5.webp', flux: '/images/evaluation/f2.webp' },
  { id: 'poster', label: 'Bilingual poster', promptId: 'm6', moss: '/images/evaluation/m6.webp', flux: '/images/evaluation/f3.webp' },
] as const;

export function GalleryComparison() {
  const [active, setActive] = useState<(typeof comparisons)[number]['id']>('menu');
  const comparison = comparisons.find(item => item.id === active)!;
  const source = featuredImageById(comparison.promptId)!;
  return <section className="gallery-comparison" aria-labelledby="controlled-comparison-title">
    <div className="gallery-group-heading"><h2 id="controlled-comparison-title">Controlled comparison view</h2><p>Same prompt, seed, and 1024×1024 canvas; each model keeps its recommended steps and guidance. These are first outputs, not cherry-picked winners.</p></div>
    <div className="comparison-tabs" role="tablist" aria-label="Comparison prompt">{comparisons.map(item => <button type="button" role="tab" aria-selected={active === item.id} key={item.id} onClick={() => setActive(item.id)}>{item.label}</button>)}</div>
    <div className="model-comparison-grid">
      <figure><div><Image src={comparison.moss} alt={`MOSS-Image SFT ${comparison.label} comparison output`} fill sizes="(max-width: 760px) 100vw, 50vw"/></div><figcaption><strong>MOSS-Image SFT</strong><span>50 steps · CFG 3</span></figcaption></figure>
      <figure><div><Image src={comparison.flux} alt={`FLUX.1 dev ${comparison.label} comparison output`} fill sizes="(max-width: 760px) 100vw, 50vw"/></div><figcaption><strong>FLUX.1 dev</strong><span>28 steps · guidance 3.5</span></figcaption></figure>
    </div>
    <details className="comparison-prompt"><summary>View the shared prompt and seed</summary><pre>{source.prompt}</pre><p>Seed: {source.seed}</p></details>
    <p className="comparison-scope"><strong>Comparison scope:</strong> these examples compare controlled SFT and FLUX outputs using the same prompt, seed, and canvas size. Each model keeps its recommended settings, so the images show a repeatable workflow rather than a universal winner. <Link href="/compare/base-vs-sft/">Read the verified Base vs SFT guidance</Link>.</p>
  </section>;
}
