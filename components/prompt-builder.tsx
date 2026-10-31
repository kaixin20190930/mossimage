'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Braces, Check, Copy, Plus, Trash2 } from 'lucide-react';

const subjectSuggestions = [
  'a cozy bookshop interior',
  'a premium amber glass perfume bottle on a pedestal',
  'a vintage brass teapot on a dark wooden table',
  'a ceramic artist in a sunlit workshop',
  'a cream paper café menu card',
  'a minimalist concert poster',
  'an editorial botanical poster',
  'a clean product showcase',
  'a café menu with prices',
  'a jar of organic wildflower honey',
  'a weekend farmers market poster',
];
const styleSuggestions = [
  'whimsical editorial illustration',
  'minimal studio product photography',
  'editorial still life',
  'environmental portrait, documentary photography',
  'editorial food photography',
  'minimalist poster',
  'editorial botanical poster',
  'clean product showcase',
];
const lightingSuggestions = [
  'warm amber reading lamps',
  'soft diffused light from the upper left',
  'soft afternoon window light from the left',
  'late-afternoon window light',
  'warm natural window light from the left',
  'atmospheric nightclub mood',
  'soft studio lighting',
  'natural daylight',
];

type Language = 'English' | '中文' | 'Bilingual';

function prosePrompt(subject: string, style: string, lighting: string, textLines: string[], language: Language) {
  const parts = [subject.trim() && `A ${style.trim() || 'detailed image'} of ${subject.trim()}`, lighting.trim()];
  const visible = textLines.map(line => line.trim()).filter(Boolean);
  if (visible.length) parts.push(`${language} text ${visible.map(line => `"${line}"`).join(', ')} rendered clearly inside the image`);
  parts.push('balanced composition, 1024×1024');
  return parts.filter(Boolean).join(', ').replace(/^A  of /, 'A ');
}

function layoutPrompt(subject: string, style: string, lighting: string, textLines: string[]) {
  const visible = textLines.map(line => line.trim()).filter(Boolean);
  const boxes = [
    [-400, -420, -260, 420],
    [-220, -380, -120, 380],
    [300, -360, 390, 360],
  ] as const;
  return JSON.stringify({
    summary: { caption: [style, subject, lighting].map(value => value.trim()).filter(Boolean).join(', ') || 'A balanced editorial image with clear text.' },
    items: [
      ...visible.slice(0, 3).map((text, index) => ({ label: 'text', caption: index === 0 ? 'Primary text, centered near the top' : index === 1 ? 'Supporting text below the heading' : 'Small footer text near the bottom', text, bbox: boxes[index] })),
      { label: 'object', caption: subject.trim() || 'Main visual subject in the center of the canvas', bbox: [-80, -360, 280, 360] },
    ],
    bbox_format: 'yxyx',
    bbox_coord_space: 'abs_centralized',
  }, null, 2);
}

export function PromptBuilder() {
  const [subject, setSubject] = useState('a cozy bookshop interior');
  const [style, setStyle] = useState('whimsical editorial illustration');
  const [lighting, setLighting] = useState('warm amber reading lamps');
  const [language, setLanguage] = useState<Language>('English');
  const [textLines, setTextLines] = useState(['MOSS IMAGE', 'Open ideas, thoughtfully made']);
  const [withLayout, setWithLayout] = useState(false);
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => withLayout ? layoutPrompt(subject, style, lighting, textLines) : prosePrompt(subject, style, lighting, textLines, language), [subject, style, lighting, textLines, language, withLayout]);
  const studioHref = `/?${withLayout ? 'layout' : 'prompt'}=${encodeURIComponent(output)}#studio`;

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function updateText(index: number, value: string) {
    setTextLines(lines => lines.map((line, lineIndex) => lineIndex === index ? value : line));
  }

  return <div className="builder-card prompt-builder">
    <div className="builder-heading"><span className="eyebrow">INTERACTIVE TOOL</span><h2>Build your MOSS-Image prompt</h2><p>Combine a subject, medium, light, and visible wording. Every suggestion comes from a prompt used elsewhere in this site&apos;s real gallery.</p></div>
    <div className="builder-fields">
      <BuilderField label="Subject" value={subject} onChange={setSubject} suggestions={subjectSuggestions}/>
      <BuilderField label="Style / Medium" value={style} onChange={setStyle} suggestions={styleSuggestions}/>
      <BuilderField label="Lighting" value={lighting} onChange={setLighting} suggestions={lightingSuggestions}/>
      <div className="builder-field">
        <div className="builder-label-row"><label htmlFor="prompt-language">Text on image</label><select id="prompt-language" value={language} onChange={event => setLanguage(event.target.value as Language)}><option>English</option><option>中文</option><option>Bilingual</option></select></div>
        <div className="text-line-list">{textLines.map((line, index) => <div key={index}><input aria-label={`Text line ${index + 1}`} value={line} onChange={event => updateText(index, event.target.value)} placeholder={index ? 'Subtitle or supporting line' : 'Main visible text'}/>{textLines.length > 1 && <button type="button" aria-label={`Remove text line ${index + 1}`} onClick={() => setTextLines(lines => lines.filter((_, lineIndex) => lineIndex !== index))}><Trash2 size={15}/></button>}</div>)}</div>
        {textLines.length < 3 && <button type="button" className="builder-add" onClick={() => setTextLines(lines => [...lines, ''])}><Plus size={15}/> Add another text line</button>}
      </div>
      <div className="layout-toggle"><label><input type="checkbox" checked={withLayout} onChange={event => setWithLayout(event.target.checked)}/><span><Braces size={18}/><strong>Add JSON layout guidance</strong><small>Switch the output to a valid structured layout with preset text regions.</small></span></label><Link href="/json-layout/">Need the visual editor?</Link></div>
    </div>
    <div className="builder-output"><div className="builder-label-row"><strong>{withLayout ? 'JSON preview' : 'Prompt preview'}</strong><span>{output.length} characters</span></div><pre>{output}</pre><div className="builder-actions"><button type="button" onClick={() => void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copied' : withLayout ? 'Copy JSON' : 'Copy prompt'}</button><Link href={studioHref}>Open in studio</Link></div></div>
  </div>;
}

function BuilderField({ label, value, onChange, suggestions }: { label: string; value: string; onChange: (value: string) => void; suggestions: string[] }) {
  const id = `builder-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return <div className="builder-field"><label htmlFor={id}>{label}</label><input id={id} value={value} onChange={event => onChange(event.target.value)} /><div className="builder-suggestions">{suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => onChange(suggestion)}>{suggestion}</button>)}</div></div>;
}
