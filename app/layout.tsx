import type { Metadata } from 'next';
import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { AccountMenu } from '@/components/account-menu';
import './globals.css';
import './billing.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mossimage.run'),
  title: { default: 'MOSS Image Generator', template: '%s' },
  description: 'An independent creative studio for MOSS-Image.',
  robots: { index: true, follow: true },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="header">
      <Link href="/" className="brand" aria-label="MOSS-Image Generator">
        <span className="brand-icon"><Sprout size={24}/></span>moss<span className="brand-light">image</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/#studio" className="nav-create">Studio</Link>
        <Link href="/gallery/">Gallery</Link>
        <Link href="/presets/" className="nav-desktop-secondary">Presets</Link>
        <details className="nav-guide-menu">
          <summary>Guide</summary>
          <div>
            <Link href="/guide/">All guides</Link>
            <Link href="/guide/prompt/">Prompt guide</Link>
            <Link href="/guide/json-layout/">JSON layout reference</Link>
            <Link href="/guide/settings/">Settings guide</Link>
            <Link href="/blog/">Blog</Link>
          </div>
        </details>
        <Link href="/comfyui/" className="nav-desktop-secondary">ComfyUI</Link>
      </nav>
      <div className="header-actions">
        <AccountMenu/>
      </div>
    </header>
    <main id="main">{children}</main>
    <footer id="footer" className="site-footer">
      <div className="footer-intro">
        <Link href="/" className="brand"><Sprout size={22}/>moss<span className="brand-light">image</span></Link>
        <p>An independent studio powered by open possibilities.</p>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <div><span>CREATE</span><Link href="/#studio">Online Generator</Link><Link href="/presets/">Presets</Link><Link href="/json-layout/">JSON Layout Tool</Link><Link href="/free/">Free</Link><Link href="/pricing/">Pricing</Link><Link href="/gallery/">Gallery</Link></div>
        <div><span>LEARN</span><Link href="/blog/">Blog</Link><Link href="/moss-image-ai/">MOSS Image AI</Link><Link href="/guide/">Guides</Link><Link href="/workflows/">Workflows</Link><Link href="/chinese-ai-image-generator/">Chinese Text Guide</Link><Link href="/compare/">Comparisons</Link></div>
        <div><span>COMPANY</span><Link href="/featured-on/">Featured On</Link><Link href="/privacy/">Privacy</Link><Link href="/terms/">Terms</Link><Link href="/refund/">Refunds</Link><Link href="/contact/">Contact</Link></div>
      </nav>
      <div className="footer-meta"><span>Not affiliated with OpenMOSS or fal.ai.</span><span>© 2026 mossimage.run</span></div>
    </footer>
  </body></html>;
}
