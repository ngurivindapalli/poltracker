import React from "react";

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /(https?:\/\/[^\s]+)/g;

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  );
}

export function formatChatMessage(text: string): React.ReactNode {
  const chunks: React.ReactNode[] = [];
  const consumed = new Set<string>();
  let cursor = 0;
  const combined = new RegExp(
    `${MARKDOWN_LINK.source}|${BARE_URL.source}`,
    "g"
  );

  let match: RegExpExecArray | null;
  while ((match = combined.exec(text))) {
    const [full] = match;
    if (consumed.has(`${match.index}:${full}`)) continue;
    if (match.index > cursor) {
      chunks.push(text.slice(cursor, match.index));
    }
    const markdown = full.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (markdown) {
      chunks.push(
        <Link key={`${match.index}-md`} href={markdown[2]}>
          {markdown[1]}
        </Link>
      );
    } else {
      const href = full.replace(/[),.;]+$/, "");
      chunks.push(
        <Link key={`${match.index}-url`} href={href}>
          {href}
        </Link>
      );
    }
    cursor = match.index + full.length;
  }
  if (cursor < text.length) chunks.push(text.slice(cursor));
  return chunks;
}
