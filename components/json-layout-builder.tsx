'use client';

import Link from 'next/link';
import { useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Check, Copy, Move, Plus, Upload } from 'lucide-react';
import { layoutSchema } from '@/lib/generation';

type TemplateName = 'menu' | 'poster' | 'label';
type LayoutName = TemplateName | 'imported';
type Box = [number, number, number, number];
type Field = { key: string; label: 'text' | 'object'; name: string; caption: string; value: string; bbox: Box };
type Template = { name: string; description: string; summary: string; fields: Field[] };

const templates: Record<TemplateName, Template> = {
  menu: {
    name: 'Menu Card', description: 'Seven regions for a bilingual heading, two items, prices, and a footer.', summary: 'A cream paper café menu card photographed from above on a wooden table, warm natural light, refined editorial food photography.',
    fields: [
      { key: 'title', label: 'text', name: 'Title', caption: 'Large Chinese title centered at the top', value: '今日特调', bbox: [-380, -420, -240, 420] },
      { key: 'subtitle', label: 'text', name: 'Subtitle', caption: 'Small English subtitle below the title', value: "TODAY'S SPECIAL", bbox: [-220, -400, -140, 400] },
      { key: 'item1', label: 'text', name: 'Item 1', caption: 'First menu item aligned left', value: '桂花拿铁 Osmanthus Latte', bbox: [-100, -420, -40, 200] },
      { key: 'price1', label: 'text', name: 'Price 1', caption: 'First price aligned right', value: '$6.50', bbox: [-100, 220, -40, 400] },
      { key: 'item2', label: 'text', name: 'Item 2', caption: 'Second menu item aligned left', value: '抹茶芝士蛋糕 Matcha Cheesecake', bbox: [0, -420, 60, 200] },
      { key: 'price2', label: 'text', name: 'Price 2', caption: 'Second price aligned right', value: '$8.00', bbox: [0, 220, 60, 400] },
      { key: 'footer', label: 'text', name: 'Footer', caption: 'Small availability note near the bottom', value: '每日限量 · while supplies last', bbox: [120, -400, 180, 400] },
    ],
  },
  poster: {
    name: 'Poster', description: 'Four wide regions for a headline, subtitle, event details, and CTA.', summary: 'A bold vertical event poster with high contrast typography, a restrained color palette, and clear visual hierarchy.',
    fields: [
      { key: 'headline', label: 'text', name: 'Headline', caption: 'Large bold headline across the top', value: 'WEEKEND MARKET', bbox: [-450, -450, -350, 450] },
      { key: 'subtitle', label: 'text', name: 'Subtitle', caption: 'Supporting subtitle below the headline', value: 'Local makers · food · music', bbox: [-300, -350, -220, 350] },
      { key: 'info', label: 'text', name: 'Date / Place', caption: 'Event date and location in the upper middle', value: 'SAT 10:00–18:00 · RIVERSIDE PARK', bbox: [-180, -300, -120, 300] },
      { key: 'cta', label: 'text', name: 'CTA', caption: 'Short call to action near the bottom', value: 'FREE ENTRY', bbox: [340, -200, 400, 200] },
    ],
  },
  label: {
    name: 'Product Label', description: 'Five regions for a brand, product name, split description, and footer.', summary: 'A premium product label on warm textured paper, elegant restrained typography, photographed with soft studio light.',
    fields: [
      { key: 'brand', label: 'text', name: 'Brand', caption: 'Elegant brand name at the top', value: 'BOTANICA', bbox: [-420, -300, -340, 300] },
      { key: 'product', label: 'text', name: 'Product', caption: 'Product name centered below the brand', value: 'WILDFLOWER HONEY', bbox: [-300, -300, -220, 300] },
      { key: 'descL', label: 'text', name: 'Description left', caption: 'Short feature statement on the left', value: 'Raw & Unfiltered', bbox: [-180, -400, -80, 0] },
      { key: 'descR', label: 'text', name: 'Description right', caption: 'Short origin statement on the right', value: 'Small Batch', bbox: [-180, 0, -80, 400] },
      { key: 'footer', label: 'text', name: 'Footer', caption: 'Net weight centered near the bottom', value: 'Net Wt. 12 oz (340 g)', bbox: [300, -300, 360, 300] },
    ],
  },
};

const emptyImported: Template = { name: 'Imported layout', description: 'A layout loaded from JSON.', summary: 'Describe the complete image.', fields: [] };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

export function JsonLayoutBuilder() {
  const [selected, setSelected] = useState<LayoutName>('menu');
  const [layouts, setLayouts] = useState<Record<LayoutName, Template>>(() => ({ ...structuredClone(templates), imported: emptyImported }));
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const template = layouts[selected];
  const activeFields = template.fields.filter(field => field.value.trim());
  const output = useMemo(() => JSON.stringify({
    summary: { caption: template.summary },
    items: activeFields.map(field => field.label === 'text'
      ? { label: 'text', caption: field.caption, text: field.value.trim(), bbox: field.bbox }
      : { label: 'object', caption: field.value.trim(), bbox: field.bbox }),
    bbox_format: 'yxyx', bbox_coord_space: 'abs_centralized',
  }, null, 2), [template, activeFields]);
  const studioHref = `/?layout=${encodeURIComponent(output)}#studio`;

  function updateTemplate(updater: (current: Template) => Template) {
    setLayouts(current => ({ ...current, [selected]: updater(current[selected]) }));
  }

  function updateField(index: number, changes: Partial<Field>) {
    updateTemplate(current => ({ ...current, fields: current.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...changes } : field) }));
  }

  function updateBox(index: number, bbox: Box) {
    const [top, left, bottom, right] = bbox;
    if (![top, left, bottom, right].every(Number.isFinite)) return;
    updateField(index, { bbox: [clamp(top, -512, 480), clamp(left, -512, 480), clamp(bottom, -480, 512), clamp(right, -480, 512)] });
  }

  function startPointer(event: ReactPointerEvent<HTMLElement>, index: number, action: 'move' | 'resize') {
    event.preventDefault();
    event.stopPropagation();
    const canvas = event.currentTarget.closest('.layout-canvas') as HTMLElement | null;
    if (!canvas) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const start = [...template.fields[index].bbox] as Box;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (next: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dx = (next.clientX - startX) / rect.width * 1024;
      const dy = (next.clientY - startY) / rect.height * 1024;
      if (action === 'move') {
        const height = start[2] - start[0];
        const width = start[3] - start[1];
        const top = clamp(start[0] + dy, -512, 512 - height);
        const left = clamp(start[1] + dx, -512, 512 - width);
        updateBox(index, [top, left, top + height, left + width]);
      } else {
        updateBox(index, [start[0], start[1], clamp(start[2] + dy, start[0] + 32, 512), clamp(start[3] + dx, start[1] + 32, 512)]);
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function addRegion() {
    const count = template.fields.length + 1;
    updateTemplate(current => ({ ...current, fields: [...current.fields, { key: `region-${Date.now()}`, label: 'text', name: `Text region ${count}`, caption: 'Custom text region', value: 'NEW TEXT', bbox: [-80, -220, 20, 220] }] }));
  }

  function importLayout() {
    setImportError('');
    try {
      const parsed = layoutSchema.parse(JSON.parse(importText));
      const imported: Template = {
        name: 'Imported layout', description: `${parsed.items.length} regions loaded from JSON.`, summary: parsed.summary.caption,
        fields: parsed.items.map((item, index) => ({
          key: `imported-${index}`, label: item.label, name: item.label === 'text' ? `Text ${index + 1}` : `Object ${index + 1}`,
          caption: item.caption, value: item.label === 'text' ? item.text || '' : item.caption, bbox: [...item.bbox] as Box,
        })),
      };
      setLayouts(current => ({ ...current, imported }));
      setSelected('imported');
    } catch {
      setImportError('Paste a valid MOSS-Image layout with summary.caption, items, yxyx boxes, and abs_centralized coordinates.');
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return <div className="builder-card layout-builder">
    <div className="builder-heading"><span className="eyebrow">VISUAL LAYOUT EDITOR</span><h2>Move the regions, then make them yours</h2><p>Drag a box to move it, use its lower-right handle to resize it, or import an existing MOSS-Image JSON layout.</p></div>
    <div className="template-picker" role="radiogroup" aria-label="Layout template">{(Object.keys(templates) as TemplateName[]).map(key => <button type="button" role="radio" aria-checked={selected === key} className={selected === key ? 'selected' : ''} key={key} onClick={() => setSelected(key)}><span className={`template-mini template-${key}`} aria-hidden="true"><i/><i/><i/><i/></span><strong>{templates[key].name}</strong><small>{templates[key].description}</small></button>)}</div>
    <details className="layout-import"><summary><Upload size={15}/> Import a JSON layout</summary><textarea aria-label="JSON layout to import" value={importText} onChange={event => setImportText(event.target.value)} placeholder='Paste { "summary": ..., "items": ... }'/><button type="button" onClick={importLayout}>Load JSON</button>{importError && <p role="alert">{importError}</p>}</details>
    <div className="layout-builder-grid">
      <div className="layout-editor-column">
        <div className="layout-canvas" aria-label="1024 by 1024 visual layout canvas"><span className="canvas-axis horizontal"/><span className="canvas-axis vertical"/>{activeFields.map(field => { const index = template.fields.indexOf(field); const [top, left, bottom, right] = field.bbox; return <div className={`layout-region ${field.label}`} key={field.key} style={{ top: `${(top + 512) / 1024 * 100}%`, left: `${(left + 512) / 1024 * 100}%`, width: `${(right - left) / 1024 * 100}%`, height: `${(bottom - top) / 1024 * 100}%` }} onPointerDown={event => startPointer(event, index, 'move')}><span><Move size={11}/>{field.value}</span><i aria-label={`Resize ${field.name}`} onPointerDown={event => startPointer(event, index, 'resize')}/></div>; })}</div>
        <div className="layout-fields"><div className="layout-fields-title"><h3>{template.name}</h3><button type="button" onClick={addRegion}><Plus size={14}/> Add text region</button></div><label>Scene summary<input value={template.summary} onChange={event => updateTemplate(current => ({ ...current, summary: event.target.value }))}/></label>{template.fields.map((field, index) => <div className="layout-field-row" key={field.key}><label>{field.name}<input value={field.value} onChange={event => updateField(index, { value: event.target.value })}/></label><div className="bbox-inputs">{field.bbox.map((value, position) => <label key={position}>{['T','L','B','R'][position]}<input aria-label={`${field.name} ${['top','left','bottom','right'][position]}`} type="number" min="-512" max="512" value={value} onChange={event => { const next = [...field.bbox] as Box; next[position] = Number(event.target.value); updateBox(index, next); }}/></label>)}</div></div>)}</div>
      </div>
      <div className="builder-output"><div className="builder-label-row"><strong>JSON preview</strong><span>{output.length} characters</span></div><pre>{output}</pre><div className="builder-actions"><button type="button" disabled={!activeFields.length} onClick={() => void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copied' : 'Copy JSON'}</button>{activeFields.length ? <Link href={studioHref}>Open in studio</Link> : <span className="builder-disabled">Add at least one region</span>}</div></div>
    </div>
    <p className="builder-reference">Need coordinate rules or troubleshooting? Read the <Link href="/guide/json-layout/">JSON Layout reference</Link>.</p>
  </div>;
}
