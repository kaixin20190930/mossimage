import { paidPlans } from '@/lib/plans';

type JsonLdValue = Record<string, unknown>;

export function JsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export const homeStructuredData: JsonLdValue = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://mossimage.run/#website',
      name: 'MOSS-Image Generator',
      url: 'https://mossimage.run/',
      description: 'Try MOSS-Image online with text prompts, Chinese and English lettering, and JSON layout control. Verified accounts receive three starter images.',
      publisher: { '@id': 'https://mossimage.run/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://mossimage.run/#organization',
      name: 'Moxion Labs LLC',
      url: 'https://mossimage.run/',
      email: 'support@mossimage.run',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@mossimage.run',
        contactType: 'customer support',
      },
    },
  ],
};

export const pricingStructuredData: JsonLdValue = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://mossimage.run/pricing/#service',
  name: 'MOSS-Image Generator',
  url: 'https://mossimage.run/pricing/',
  description: 'Online AI image generation with text prompts, Chinese and English text rendering, and JSON layout control.',
  serviceType: 'AI image generation',
  areaServed: 'Worldwide',
  provider: {
    '@type': 'Organization',
    '@id': 'https://mossimage.run/#organization',
    name: 'Moxion Labs LLC',
    url: 'https://mossimage.run/',
  },
  offers: paidPlans.map((plan) => ({
    '@type': 'Offer',
    name: plan.name,
    description: plan.description,
    url: 'https://mossimage.run/pricing/',
    price: plan.priceUsd.toFixed(2),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    category: plan.billing,
  })),
};

export function breadcrumbStructuredData(items: readonly { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
