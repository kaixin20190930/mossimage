export const dynamic = 'force-static';
import type { MetadataRoute } from 'next';
import { articles, directories } from '@/lib/content';
import { landingPageMetadata } from '@/lib/landing-pages';
import { blogPosts } from '@/lib/blog-posts';
import { contentLastModified } from '@/lib/content-dates';

export default function sitemap(): MetadataRoute.Sitemap {
  const excluded = new Set(['guide/json-layout-generator', 'moss-image-generator-online', 'use-cases/menu']);
  const slugs = [...new Set(['', ...articles.map(a=>a.slug), ...directories.map(d=>d.slug), ...landingPageMetadata.map(p=>p.slug), 'guide/settings', 'guide/turbo-lora', 'guide/base-guide', 'troubleshooting', 'moss-image-edit', 'image-editing-early-access', 'featured-on', 'presets', 'presets/photoreal', 'presets/poster', 'presets/menu', 'presets/product-label', 'presets/infographic', 'presets/quote-card', 'comfyui/mossimagehfloader', 'use-cases', 'text-in-image-generator', 'gallery', 'blog', ...blogPosts.map(post=>`blog/${post.slug}`), 'pricing', 'privacy', 'terms', 'refund', 'contact'])].filter(slug=>!excluded.has(slug));
  return slugs.map(slug=>({
    url: `https://mossimage.run/${slug ? `${slug}/` : ''}`,
    lastModified: contentLastModified[slug] || '2026-10-23',
    changeFrequency: slug ? 'monthly' : 'weekly',
    priority: slug === '' ? 1 : slug === 'json-layout' || slug.startsWith('presets/') ? 0.8 : slug === 'gallery' || slug === 'presets' ? 0.7 : slug === 'use-cases' ? 0.3 : slug.startsWith('guide') || slug.startsWith('compare') ? 0.6 : 0.7,
  }));
}
