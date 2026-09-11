/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, ReactNode } from "react";

const fileContentPath =
  /^\/api\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/content$/i;

function safeHref(
  value: unknown,
  articleAssetBasePath?: string,
): string | null {
  if (typeof value !== "string") return null;

  const fileMatch = value.match(fileContentPath);
  if (fileMatch && articleAssetBasePath) {
    return `${articleAssetBasePath}/${encodeURIComponent(fileMatch[1])}`;
  }

  if (
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("mailto:")
  ) {
    return value;
  }

  return null;
}

function attrsOf(node: Record<string, unknown>): Record<string, unknown> {
  return node.attrs && typeof node.attrs === "object"
    ? (node.attrs as Record<string, unknown>)
    : {};
}

function blockStyle(node: Record<string, unknown>): CSSProperties {
  const attrs = attrsOf(node);
  const style: CSSProperties = {};

  if (
    attrs.textAlign === "left" ||
    attrs.textAlign === "center" ||
    attrs.textAlign === "right"
  ) {
    style.textAlign = attrs.textAlign;
  }

  if (attrs.dir === "ltr" || attrs.dir === "rtl") {
    style.direction = attrs.dir;
  }

  return style;
}

function renderChildren(
  value: unknown,
  key: string,
  articleAssetBasePath?: string,
): ReactNode {
  if (!Array.isArray(value)) return null;
  return value.map((child, index) =>
    renderNode(child, `${key}-${index}`, articleAssetBasePath),
  );
}

function renderNode(
  value: unknown,
  key: string,
  articleAssetBasePath?: string,
): ReactNode {
  if (!value || typeof value !== "object") return null;
  const node = value as Record<string, unknown>;
  const type = typeof node.type === "string" ? node.type : "";

  if (type === "text") {
    let content: ReactNode = typeof node.text === "string" ? node.text : "";
    const marks = Array.isArray(node.marks) ? node.marks : [];

    for (const [index, markValue] of marks.entries()) {
      if (!markValue || typeof markValue !== "object") continue;
      const mark = markValue as Record<string, unknown>;
      const markType = typeof mark.type === "string" ? mark.type : "";

      if (markType === "bold") {
        content = <strong key={`${key}-b-${index}`}>{content}</strong>;
      }
      if (markType === "italic") {
        content = <em key={`${key}-i-${index}`}>{content}</em>;
      }
      if (markType === "strike") {
        content = <s key={`${key}-s-${index}`}>{content}</s>;
      }
      if (markType === "code") {
        content = (
          <code
            key={`${key}-c-${index}`}
            className="rounded bg-slate-100 px-1 py-0.5 text-[0.92em]"
          >
            {content}
          </code>
        );
      }
      if (markType === "link") {
        const href = safeHref(attrsOf(mark).href, articleAssetBasePath);
        if (href) {
          const external =
            href.startsWith("http://") || href.startsWith("https://");
          content = (
            <a
              key={`${key}-a-${index}`}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="font-medium text-brand underline underline-offset-2"
            >
              {content}
            </a>
          );
        }
      }
    }

    return content;
  }

  if (type === "image") {
    const attrs = attrsOf(node);
    const src = safeHref(attrs.src, articleAssetBasePath);
    if (!src) return null;

    const requestedWidth = Number(attrs.width);
    const width =
      Number.isFinite(requestedWidth) && requestedWidth > 0
        ? requestedWidth
        : undefined;
    const align =
      attrs.align === "left" || attrs.align === "right"
        ? attrs.align
        : "center";
    const justifyClass =
      align === "left"
        ? "justify-start"
        : align === "right"
          ? "justify-end"
          : "justify-center";

    return (
      <div key={key} className={`my-5 flex w-full ${justifyClass}`}>
        <img
          src={src}
          alt={typeof attrs.alt === "string" ? attrs.alt : ""}
          title={typeof attrs.title === "string" ? attrs.title : undefined}
          className="block h-auto max-h-[42rem] max-w-full rounded-sm object-contain"
          style={{
            width: width ? `${width}px` : "auto",
            maxWidth: "100%",
          }}
        />
      </div>
    );
  }

  if (type === "separator") {
    const attrs = attrsOf(node);
    const label = typeof attrs.label === "string" ? attrs.label.trim() : "";

    return (
      <div key={key} className="my-6 flex items-center gap-3">
        <span className="h-px min-w-6 flex-1 bg-slate-200" />
        {label ? (
          <span className="max-w-[70%] truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </span>
        ) : null}
        <span className="h-px min-w-6 flex-1 bg-slate-200" />
      </div>
    );
  }

  const children = renderChildren(node.content, key, articleAssetBasePath);
  const style = blockStyle(node);

  if (type === "doc") {
    return (
      <div key={key} className="grid gap-4">
        {children}
      </div>
    );
  }

  if (type === "paragraph") {
    return (
      <p key={key} style={style} className="min-h-[1.75rem] leading-7">
        {children}
      </p>
    );
  }

  if (type === "heading") {
    const level = Number(attrsOf(node).level);

    if (level === 2) {
      return (
        <h2
          key={key}
          style={style}
          className="mt-2 text-xl font-semibold text-content"
        >
          {children}
        </h2>
      );
    }

    if (level === 3) {
      return (
        <h3
          key={key}
          style={style}
          className="mt-2 text-lg font-semibold text-content"
        >
          {children}
        </h3>
      );
    }

    return (
      <h1
        key={key}
        style={style}
        className="mt-2 text-2xl font-semibold text-content"
      >
        {children}
      </h1>
    );
  }

  if (type === "bulletList") {
    return (
      <ul key={key} className="list-disc space-y-2 ps-6">
        {children}
      </ul>
    );
  }

  if (type === "orderedList") {
    return (
      <ol key={key} className="list-decimal space-y-2 ps-6">
        {children}
      </ol>
    );
  }

  if (type === "listItem") return <li key={key}>{children}</li>;

  if (type === "blockquote") {
    return (
      <blockquote
        key={key}
        style={style}
        className="border-s-4 border-line ps-4 text-muted"
      >
        {children}
      </blockquote>
    );
  }

  if (type === "codeBlock") {
    return (
      <pre
        key={key}
        className="overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100"
      >
        <code>{children}</code>
      </pre>
    );
  }

  if (type === "hardBreak") return <br key={key} />;
  if (type === "youtubeEmbed") {
    const videoId = attrsOf(node).videoId;

    // Only ever an id, never a URL taken from the document: an 11-character id
    // can address nothing but YouTube, so a crafted document cannot turn this
    // into an arbitrary embed.
    if (typeof videoId !== "string" || !/^[\w-]{11}$/.test(videoId)) {
      return null;
    }

    return (
      <div
        key={key}
        className="relative my-5 w-full overflow-hidden rounded-md pt-[56.25%]"
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title="YouTube video"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }

  if (type === "callout") {
    const variant = attrsOf(node).variant;
    const tone =
      variant === "warning"
        ? "border-amber-300 bg-amber-50"
        : variant === "tip"
          ? "border-emerald-300 bg-emerald-50"
          : "border-sky-300 bg-sky-50";

    // border-s-4 rather than border-l-4: the accent belongs on the reading
    // edge, which flips in Kurdish and Arabic.
    return (
      <div key={key} className={`my-5 rounded-md border-s-4 px-4 py-3 ${tone}`}>
        {children}
      </div>
    );
  }

  if (type === "horizontalRule") {
    return <hr key={key} className="my-5 border-line" />;
  }

  return <div key={key}>{children}</div>;
}

/**
 * Renders a rich text document for reading.
 *
 * The counterpart to LocalizedRichTextEditor: whatever node types the editor
 * can produce, this has to render, or the content is stored and shown as
 * nothing. Keep the two together when adding to either.
 *
 * Nothing here trusts the document. Links and image sources go through
 * safeHref, because a document is data and data can be crafted.
 */
const LESSON_PLAYER_CLASS_NAME =
  "h-full min-h-0 overflow-y-auto overscroll-contain rounded-md bg-white p-5 text-sm text-content shadow-xl sm:p-7 lg:p-8";

export function RichTextViewer({
  document,
  dir = "ltr",
  articleAssetBasePath,
  className = LESSON_PLAYER_CLASS_NAME,
}: {
  document: unknown;
  dir?: "ltr" | "rtl";
  articleAssetBasePath?: string;
  /** Defaults to the lesson player's scrolling container. */
  className?: string;
}) {
  return (
    <article dir={dir} className={className}>
      {renderNode(document, "article", articleAssetBasePath)}
    </article>
  );
}
