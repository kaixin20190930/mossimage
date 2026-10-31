import Link from 'next/link';
import type { ReactNode } from 'react';

export type BlogMedia = {
  after: string;
  node: ReactNode;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
}

function internalHref(href: string) {
  if (href.startsWith('https://mossimage.run/')) return href.slice('https://mossimage.run'.length);
  return href;
}

function inline(value: string): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const pieces = value.split(pattern).filter(Boolean);
  return pieces.map((piece, index) => {
    const link = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = internalHref(link[2]);
      return href.startsWith('/')
        ? <Link href={href} key={index}>{link[1]}</Link>
        : <a href={href} key={index} target="_blank" rel="noreferrer">{link[1]}</a>;
    }
    if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={index}>{piece.slice(2, -2)}</strong>;
    if (piece.startsWith('`') && piece.endsWith('`')) return <code key={index}>{piece.slice(1, -1)}</code>;
    if (piece.startsWith('*') && piece.endsWith('*')) return <em key={index}>{piece.slice(1, -1)}</em>;
    return piece;
  });
}

function isSpecial(line: string, next = '') {
  return !line.trim() || /^###\s/.test(line) || /^```/.test(line) || /^>\s?/.test(line) || /^[-*]\s/.test(line) || /^\d+\.\s/.test(line) || (line.startsWith('|') && /^\|?\s*:?-+/.test(next));
}

export function BlogMarkdown({ markdown, media = [] }: { markdown: string; media?: readonly BlogMedia[] }) {
  const lines = markdown.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  let key = 0;
  const mediaByHeading = new Map(media.map(item => [item.after, item.node]));

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || line.trim() === '---') { index += 1; continue; }

    if (line.startsWith('### ')) {
      const title = line.slice(4).trim();
      blocks.push(<h2 id={slugify(title)} key={key++}>{inline(title)}</h2>);
      const visual = mediaByHeading.get(title);
      if (visual) blocks.push(<div className="blog-inline-media" key={key++}>{visual}</div>);
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const content: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) content.push(lines[index++]);
      index += 1;
      blocks.push(<div className="code-block" key={key++}><pre><code data-language={language || undefined}>{content.join('\n')}</code></pre></div>);
      continue;
    }

    if (line.startsWith('|') && index + 1 < lines.length && /^\|?\s*:?-+/.test(lines[index + 1])) {
      const rows: string[][] = [];
      const splitRow = (row: string) => row.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
      rows.push(splitRow(line));
      index += 2;
      while (index < lines.length && lines[index].startsWith('|')) rows.push(splitRow(lines[index++]));
      blocks.push(<div className="comparison-table-wrap" key={key++}><table><thead><tr>{rows[0].map((cell, cellIndex) => <th key={cellIndex}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex}>{inline(cell)}</th> : <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const ordered = /^\d+\.\s/.test(line);
      const items: string[] = [];
      const expression = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (index < lines.length && expression.test(lines[index])) items.push(lines[index++].replace(expression, ''));
      const children = items.map((item, itemIndex) => <li key={itemIndex}>{inline(item.replace(/^\[ \]\s*/, '□ '))}</li>);
      blocks.push(ordered ? <ol key={key++}>{children}</ol> : <ul key={key++}>{children}</ul>);
      continue;
    }

    if (line.startsWith('>')) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith('>')) quote.push(lines[index++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={key++}>{inline(quote.join(' '))}</blockquote>);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !isSpecial(lines[index], lines[index + 1] || '')) paragraph.push(lines[index++].trim());
    blocks.push(<p key={key++}>{inline(paragraph.join(' '))}</p>);
  }

  return <>{blocks}</>;
}

export function blogHeadingId(value: string) { return slugify(value); }
