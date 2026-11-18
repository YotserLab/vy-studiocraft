import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface MarkdownSectionActionContext {
  heading: string;
  body: string;
  index: number;
}

export interface MarkdownListItemActionContext {
  text: string;
  heading?: string;
  ordered: boolean;
  index: number;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
  renderSectionAction?: (ctx: MarkdownSectionActionContext) => React.ReactNode;
  renderListItemAction?: (ctx: MarkdownListItemActionContext) => React.ReactNode;
}

function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // Match **bold**, `code`, *italic*, or [label](https://...)
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(text.slice(lastIdx, match.index));
    }
    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push(
        <strong key={keyIdx++} className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 rounded font-mono-num text-[0.88em]"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-hairline)',
            color: 'var(--text-primary)',
          }}
        >
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push(
        <em key={keyIdx++} className="italic">
          {raw.slice(1, -1)}
        </em>
      );
    } else if (raw.startsWith('[')) {
      const linkMatch = raw.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (linkMatch) {
        tokens.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="underline hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        tokens.push(raw);
      }
    }
    lastIdx = pattern.lastIndex;
  }

  if (lastIdx < text.length) {
    tokens.push(text.slice(lastIdx));
  }
  return tokens;
}

function CopyCodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="rounded-lg border overflow-hidden my-2"
      style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}
    >
      <div
        className="px-3 py-1.5 border-b flex items-center justify-between text-[11px]"
        style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}
      >
        <span className="font-mono-num uppercase">{lang || 'texto'}</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 hover:opacity-80 font-medium"
          style={{ color: copied ? 'var(--status-ok)' : 'var(--accent)' }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>
      <pre className="p-3 text-xs font-mono-num whitespace-pre-wrap leading-relaxed overflow-x-auto" style={{ color: 'var(--text-primary)' }}>
        {code}
      </pre>
    </div>
  );
}

type BlockNode =
  | { type: 'heading'; level: number; text: string; sectionBody: string; sectionIndex: number }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'list'; ordered: boolean; items: string[]; heading?: string };

function parseBlocks(markdown: string): BlockNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: BlockNode[] = [];
  let i = 0;
  let currentHeading: string | undefined;
  let sectionCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push({ type: 'code', lang, code: codeLines.join('\n').trim() });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      currentHeading = text;

      // Look ahead for section body until next heading of same/higher level
      const bodyLines: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextHeading = lines[j].trim().match(/^(#{1,4})\s+/);
        if (nextHeading && nextHeading[1].length <= level) break;
        bodyLines.push(lines[j]);
        j += 1;
      }

      blocks.push({
        type: 'heading',
        level,
        text,
        sectionBody: bodyLines.join('\n').trim(),
        sectionIndex: sectionCounter++,
      });
      i += 1;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join('\n') });
      continue;
    }

    // Ordered or unordered list
    const isOrdered = /^\d+[\).\s]\s*/.test(trimmed);
    const isBullet = /^([-*•])\s+/.test(trimmed);
    if (isOrdered || isBullet) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        if (isOrdered && /^\d+[\).\s]\s*/.test(t)) {
          items.push(t.replace(/^\d+[\).\s]+/, '').trim());
          i += 1;
        } else if (!isOrdered && /^([-*•])\s+/.test(t)) {
          items.push(t.replace(/^([-*•])\s+/, '').trim());
          i += 1;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        blocks.push({ type: 'list', ordered: isOrdered, items, heading: currentHeading });
        continue;
      }
    }

    // Regular paragraph
    const paraLines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (
        !t ||
        t.startsWith('```') ||
        /^#{1,4}\s+/.test(t) ||
        t.startsWith('>') ||
        /^([-*•])\s+/.test(t) ||
        /^\d+[\).\s]\s*/.test(t) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(t)
      ) {
        break;
      }
      paraLines.push(lines[i].trim());
      i += 1;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    } else {
      i += 1;
    }
  }

  return blocks;
}

export function MarkdownRenderer({
  content,
  className = '',
  compact = false,
  renderSectionAction,
  renderListItemAction,
}: MarkdownRendererProps) {
  const blocks = parseBlocks(content || '');
  let globalListItemIndex = 0;

  return (
    <div className={`${compact ? 'space-y-2 text-xs' : 'space-y-3 text-sm'} leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'hr') {
          return <hr key={idx} className="my-3" style={{ borderColor: 'var(--border-hairline)' }} />;
        }

        if (block.type === 'code') {
          return <CopyCodeBlock key={idx} code={block.code} lang={block.lang} />;
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={idx}
              className="px-3.5 py-2 rounded-r-md italic"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderLeft: '2px solid var(--accent)',
                color: 'var(--text-secondary)',
              }}
            >
              {renderInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === 'heading') {
          const actionNode = renderSectionAction
            ? renderSectionAction({
                heading: block.text,
                body: block.sectionBody,
                index: block.sectionIndex,
              })
            : null;

          return (
            <div
              key={idx}
              className={`flex flex-wrap items-center justify-between gap-2 ${
                compact ? 'pt-2 pb-0.5' : 'pt-3 pb-1 border-b'
              }`}
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              {block.level <= 2 ? (
                <h3
                  className={`font-display font-semibold ${compact ? 'text-xs' : 'text-sm'}`}
                  style={{ color: 'var(--accent)' }}
                >
                  {renderInline(block.text)}
                </h3>
              ) : (
                <h4
                  className={`font-display font-semibold ${compact ? 'text-xs' : 'text-sm'}`}
                  style={{ color: 'var(--text-primary)' }}
                >
                  {renderInline(block.text)}
                </h4>
              )}
              {actionNode && <div className="shrink-0">{actionNode}</div>}
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={idx} className="space-y-1.5">
              {block.items.map((itemText, itemIdx) => {
                const currentIdx = globalListItemIndex++;
                const actionNode = renderListItemAction
                  ? renderListItemAction({
                      text: itemText,
                      heading: block.heading,
                      ordered: block.ordered,
                      index: currentIdx,
                    })
                  : null;
                return (
                  <li
                    key={itemIdx}
                    className="flex items-start justify-between gap-3 py-0.5 rounded px-1.5 transition-colors hover:bg-[var(--bg-subtle)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span
                        className="font-mono-num shrink-0 mt-0.5 select-none"
                        style={{ color: 'var(--accent)' }}
                      >
                        {block.ordered ? `${itemIdx + 1}.` : '•'}
                      </span>
                      <span className="min-w-0 break-words" style={{ color: 'var(--text-primary)' }}>
                        {renderInline(itemText)}
                      </span>
                    </div>
                    {actionNode && <div className="shrink-0 pt-0.5">{actionNode}</div>}
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={idx} style={{ color: 'var(--text-secondary)' }}>
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
