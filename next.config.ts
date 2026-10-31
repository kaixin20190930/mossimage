import type { NextConfig } from 'next';
const exporting = process.env.NEXT_STATIC_EXPORT === '1';
const config: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: exporting },
  trailingSlash: true,
  ...(exporting ? { output: 'export' as const, distDir: 'out' } : {
    async rewrites() {
      return [
        'config', 'generate', 'generate/status', 'account', 'auth/request',
        'auth/verify', 'auth/logout', 'billing/checkout', 'billing/portal',
        'stripe/webhook',
        'analytics', 'analytics/summary',
        'account/dashboard', 'account/generations/image', 'account/generations/delete',
      ].map(path => ({
        source: `/api/${path}/`, destination: `http://127.0.0.1:8787/api/${path}/`,
      }));
    },
  }),
};
export default config;
