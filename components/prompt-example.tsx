'use client';

import Link from 'next/link';
import { useState } from 'react';

export function PromptExample({ label, prompt, href }: { label: string; prompt: string; href: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return <div className="prompt-example">
    <div className="prompt-example-heading"><span>{label}</span><button type="button" onClick={copyPrompt}>{copied ? 'Copied' : 'Copy prompt'}</button></div>
    <pre><code>{prompt}</code></pre>
    <Link className="inline-action" href={href}>Try in studio</Link>
  </div>;
}
