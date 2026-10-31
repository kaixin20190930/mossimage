export const dynamic = 'force-static';
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { return {rules:{userAgent:'*',allow:'/',disallow:['/admin/','/api/generate/','/api/config/','/api/account/','/api/auth/','/api/billing/','/api/stripe/','/api/analytics/']},sitemap:'https://mossimage.run/sitemap.xml'}; }
