import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialPage } from '@/components/editorial-page';
import { landingPages } from '@/lib/landing-pages';
import { breadcrumbStructuredData, JsonLd } from '@/lib/structured-data';

const page = landingPages.chinese;
const canonical = 'https://mossimage.run/chinese-ai-image-generator/';
const bilingualLayout = JSON.stringify({
  summary: { caption: 'A bilingual café menu card on cream paper, minimal typography.' },
  items: [
    { label: 'text', caption: 'Top line in Chinese serif lettering', text: '今日特调', bbox: [-380, -420, -240, 420] },
    { label: 'text', caption: 'Second line in English sans serif lettering', text: "TODAY'S SPECIAL", bbox: [-200, -380, -80, 380] },
    { label: 'object', caption: 'A small coffee cup illustration', bbox: [40, -160, 360, 160] },
  ],
  bbox_format: 'yxyx',
  bbox_coord_space: 'abs_centralized',
}, null, 2);

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: '/chinese-ai-image-generator/' },
  robots: { index: true, follow: true },
  openGraph: { title: page.title, description: page.description, url: '/chinese-ai-image-generator/', type: 'article' },
};

const sections = [
  { id: 'challenge', title: 'Why Chinese text is difficult' },
  { id: 'prompting', title: 'Write the prompt' },
  { id: 'bilingual', title: 'Mix Chinese and English' },
  { id: 'proofread', title: 'Proofread the result' },
  { id: 'faq', title: 'Questions and answers' },
] as const;

const faqs = [
  ['Can a Chinese AI image generator write Chinese text correctly?', 'MOSS-Image supports Chinese text and the official guide includes Chinese examples. Results remain probabilistic: short strings are easier than dense paragraphs, and every output should be checked for substituted or malformed characters.'],
  ['Do I need to translate my prompt into English first?', 'No. Chinese prompts are supported. The official guide notes that English has the most training data, so you can also describe the scene in English while keeping the exact Chinese words in quotation marks or in a JSON text item.'],
  ['Can I put Chinese and English in the same image?', 'Yes. Describe both strings clearly, or create separate text items in JSON Layout. Give each item enough space and specify its role, position, and visual style. Always check both languages in the final image.'],
  ['How do I control where the text appears?', 'Use JSON Layout to assign a centered bounding box to each text element. The box guides composition rather than acting like a desktop-publishing frame, because layout prompting is still an experimental model capability.'],
  ['Is it free to try?', 'A verified account receives three one-time starter image credits. No credit card or subscription is required. Generation remains subject to the shared service budget and temporary cooldowns.'],
] as const;

export default function ChineseImagePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.description,
        dateModified: '2026-10-31',
        isPartOf: { '@id': 'https://mossimage.run/#website' },
        about: [
          { '@type': 'Thing', name: 'Chinese text rendering' },
          { '@type': 'SoftwareApplication', name: 'MOSS-Image Generator', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web' },
        ],
      },
      breadcrumbStructuredData([
        { name: 'MOSS-Image Generator', url: 'https://mossimage.run/' },
        { name: 'Chinese text guide', url: canonical },
      ]),
    ],
  };

  return <>
    <JsonLd data={structuredData}/>
    <EditorialPage
      breadcrumbs={[{ label: 'MOSS-Image Generator', href: '/' }, { label: 'Chinese text guide' }]}
      eyebrow="BILINGUAL TEXT GUIDE"
      title={page.heading}
      intro="Create images with Chinese and English lettering, keep the exact words visible in your prompt, and use structured regions when the composition needs more direction."
      sections={sections}
      bottomLink={{ href: '/guide/json-layout/', label: 'Build a JSON image prompt' }}
    >
      <section id="challenge">
        <h2>Why Chinese text is difficult in generated images</h2>
        <p>A Chinese AI image generator has to solve two jobs at once: create a coherent visual scene and draw recognizable characters as part of that scene. Dense strokes, similar-looking characters, mixed punctuation, decorative lettering, and long lines all increase the chance of an error. A beautiful poster can still contain one substituted stroke or an invented character.</p>
        <p>MOSS-Image is a compact 5B model family from OpenMOSS. Its official project highlights text rendering and layout control, and its user guide includes Chinese prompts and visible Chinese writing. This studio uses the hosted MOSS-Image SFT endpoint through fal.ai. Chinese is supported, but generated lettering is never a substitute for proofreading.</p>
        <p>For three practical prompt patterns and a character-by-character checklist, read <Link href="/blog/generate-readable-chinese-text-ai-images/">how to get readable Chinese characters</Link>.</p>
      </section>

      <section id="prompting">
        <h2>Type 中文 directly, or keep exact text inside an English prompt</h2>
        <p>You do not have to translate a Chinese idea before using it. The official guide supports Chinese prompts, while also noting that English has the most training data. Choose the form that preserves your intent and makes the visible wording unambiguous.</p>
        <div className="comparison-table-wrap">
          <table>
            <thead><tr><th>Approach</th><th>Example</th><th>When to use it</th></tr></thead>
            <tbody>
              <tr><th>Chinese description</th><td lang="zh-Hans">一只戴圆框眼镜的橘猫坐在窗台上，木牌上写着“慢慢来”</td><td>Fast iteration when the full idea is naturally written in Chinese.</td></tr>
              <tr><th>English scene + Chinese text</th><td>An orange cat with round glasses on a windowsill. The wooden sign reads “慢慢来”.</td><td>Use an English scene description while preserving the required Chinese string.</td></tr>
              <tr><th>JSON Layout</th><td><code>{'"text": "慢慢来"'}</code></td><td>Give the wording and its intended region separate, explicit fields.</td></tr>
            </tbody>
          </table>
        </div>
        <p>Keep required words in quotation marks. Describe whether they belong on a sign, label, poster, menu, or screen, then add the intended position and lettering style. Short, distinct strings are easier to inspect than a paragraph.</p>
      </section>

      <section id="bilingual">
        <h2>Mixing 中文 and English in one image</h2>
        <p>For a bilingual poster or menu, give each language its own text item. This avoids asking one sentence to carry the wording, hierarchy, style, and placement for the whole design. The following structure uses the same fields accepted by this site:</p>
        <div className="code-block"><pre><code>{bilingualLayout}</code></pre></div>
        <p>Each <code>bbox</code> is ordered as <code>[top, left, bottom, right]</code>. Coordinates are measured in pixels from the center of the selected canvas. A <code>label</code> of <code>text</code> identifies a text element, and its <code>text</code> field contains the requested visible string.</p>
        <div className="callout">
          <strong>Layout is direction, not desktop publishing.</strong>
          <p>OpenMOSS describes layout prompts as experimental. Bounding boxes guide the model toward a composition, but the final lettering and position can vary. Leave generous space around each line and review the rendered image.</p>
        </div>
        <Link className="inline-action" href="/guide/json-layout/">Learn every JSON Layout field </Link>
      </section>

      <section id="proofread">
        <h2>Proofread before you publish</h2>
        <p>Inspect generated text at full size. Pay particular attention to:</p>
        <ul>
          <li>characters with many strokes, such as 繁, 餐, and 鑫;</li>
          <li>similar forms such as 未 and 末, or 己 and 已;</li>
          <li>full-width and half-width punctuation in mixed-language lines;</li>
          <li>crowded English letters, numbers, and Chinese characters;</li>
          <li>line breaks, reading order, and text that drifts outside its intended region.</li>
        </ul>
        <p>Shorten a line when accuracy matters, enlarge its layout region, and compare more than one result when your available credits allow. For production work, correct critical lettering in a design editor after generation.</p>
      </section>

      <section id="faq" className="inline-faq">
        <h2>Questions about Chinese text generation</h2>
        {faqs.map(([question, answer]) => <details key={question}>
          <summary>{question}<span>+</span></summary>
          <p>{answer}</p>
        </details>)}
      </section>

      <section>
        <h2>Try a short bilingual design</h2>
        <p>Start with one Chinese line, one English line, and a simple visual object. Three starter images are available after email verification, with no card required.</p>
        <Link className="inline-action" href="/?mode=layout#studio">Open the studio in JSON mode </Link>
        <div className="related-links">
          <Link href="/gallery/">View real MOSS-Image creations</Link>
          <Link href="/guide/prompt/">Prompt writing tips </Link>
          <Link href="/compare/flux/">Compare with FLUX </Link>
        </div>
      </section>

      <section className="sources">
        <h2>Official sources</h2>
        <p>Capabilities and prompt guidance checked October 23, 2026.</p>
        <a href="https://github.com/OpenMOSS/MOSS-Image" target="_blank" rel="noreferrer">MOSS-Image project </a>
        <a href="https://github.com/OpenMOSS/MOSS-Image/blob/main/USERGUIDE.md" target="_blank" rel="noreferrer">Official prompt and layout guide </a>
      </section>
    </EditorialPage>
  </>;
}
