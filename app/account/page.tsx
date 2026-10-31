import type { Metadata } from 'next';
import { AccountDashboard } from '@/components/account-dashboard';

export const metadata: Metadata = {
  title: 'Your MOSS-Image Account — Generations, Credits & Billing',
  description: 'View your MOSS-Image generation history, remaining credits, and billing details in one place.',
  alternates: { canonical: '/account/' },
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return <AccountDashboard/>;
}
