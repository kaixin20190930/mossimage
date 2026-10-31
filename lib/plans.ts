export type PlanId = 'free' | 'pack' | 'monthly' | 'annual';
export type PaidPlanId = Exclude<PlanId, 'free'>;

export type PricingPlan = {
  id: PlanId;
  name: string;
  eyebrow: string;
  priceUsd: number;
  priceLabel: string;
  unit: string;
  amount: string;
  note: string;
  description: string;
  features: readonly string[];
  cta: string;
  badge: string;
  billing: 'free' | 'one-time' | 'monthly' | 'annual';
};

export const pricingPlans = [
  {
    id: 'free',
    name: 'MOSS-Image Free',
    eyebrow: 'FREE',
    priceUsd: 0,
    priceLabel: '$0',
    unit: '',
    amount: '3 starter images',
    note: 'A first look at the studio.',
    description: 'Three starter images for a verified account, with all generation modes, Chinese and English text, JSON layout control, and no watermark.',
    features: ['All generation modes', 'Chinese & English text', 'JSON layout control', 'No watermark'],
    cta: 'Start creating',
    badge: '',
    billing: 'free',
  },
  {
    id: 'pack',
    name: 'MOSS-Image Credit Pack',
    eyebrow: 'ONE-TIME',
    priceUsd: 9.99,
    priceLabel: '$9.99',
    unit: '',
    amount: '30 images',
    note: 'Credits never expire.',
    description: 'Thirty non-expiring image credits in a one-time purchase, used after plan credits.',
    features: ['One-time payment', 'Use after plan credits', 'All canvas shapes', 'No subscription required'],
    cta: 'Buy credit pack',
    badge: 'MOST FLEXIBLE',
    billing: 'one-time',
  },
  {
    id: 'monthly',
    name: 'MOSS-Image Pro Monthly',
    eyebrow: 'MONTHLY',
    priceUsd: 14.99,
    priceLabel: '$14.99',
    unit: '/mo',
    amount: '80 images each month',
    note: 'Up to 160 with rollover.',
    description: 'Eighty image credits each month, with one-cycle rollover up to 160 credits.',
    features: ['One-cycle rollover', 'Higher generation limits', 'Cancel renewal anytime', 'Pack credits stay separate'],
    cta: 'Choose Monthly',
    badge: 'MOST POPULAR',
    billing: 'monthly',
  },
  {
    id: 'annual',
    name: 'MOSS-Image Pro Annual',
    eyebrow: 'ANNUAL',
    priceUsd: 119,
    priceLabel: '$119',
    unit: '/year',
    amount: '800 images per year',
    note: 'About $0.15 per image.',
    description: 'Eight hundred image credits available for the paid annual term.',
    features: ['All credits available now', '21% less per image', 'Best for ongoing projects', 'Cancel renewal anytime'],
    cta: 'Choose Annual',
    badge: 'BEST VALUE',
    billing: 'annual',
  },
] as const satisfies readonly PricingPlan[];

export const paidPlans = pricingPlans.filter(
  (plan): plan is (typeof pricingPlans)[number] & { id: PaidPlanId } => plan.id !== 'free',
);
