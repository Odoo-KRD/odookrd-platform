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

/**
 * Layout for media in the reader view, matching the editor's rules exactly.
 *
 * A wrapped image floats and text runs beside it; an unwrapped one keeps its
 * own line and is placed by auto margins. If these two ever disagree, the
 * author lays out one article and readers get a different one.
 */
function mediaLayout(
  attrs: Record<string, unknown>,
  fallbackWidth: string,
): { style: React.CSSProperties; floated: boolean } {
  const requested = Number(attrs.width);
  const width =
    Number.isFinite(requested) && requested > 0 ? requested : undefined;
  const wrap = attrs.wrap === "left" || attrs.wrap === "right" ? attrs.wrap : "none";
  const align =
    attrs.align === "left" || attrs.align === "right" ? attrs.align : "center";

  if (wrap !== "none") {
    return {
      floated: true,
      style: {
        float: wrap,
        width: `${width ?? 320}px`,
        maxWidth: "100%",
        marginTop: "0.25rem",
        marginBottom: "0.5rem",
        marginLeft: wrap === "left" ? 0 : "1rem",
        marginRight: wrap === "left" ? "1rem" : 0,
      },
    };
  }

  return {
    floated: false,
    style: {
      marginLeft: align === "left" ? 0 : "auto",
      marginRight: align === "right" ? 0 : "auto",
      width: width ? `${width}px` : fallbackWidth,
      maxWidth: "100%",
    },
  };
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

    const layout = mediaLayout(attrs, "auto");

    return (
      <div key={key} className="my-5" style={layout.style}>
        <img
          src={src}
          alt={typeof attrs.alt === "string" ? attrs.alt : ""}
          title={typeof attrs.title === "string" ? attrs.title : undefined}
          className="block h-auto w-full max-w-full rounded-sm"
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
    const attrs = attrsOf(node);
    const videoId = attrs.videoId;

    // Only ever an id, never a URL taken from the document: an 11-character id
    // can address nothing but YouTube, so a crafted document cannot turn this
    // into an arbitrary embed.
    if (typeof videoId !== "string" || !/^[\w-]{11}$/.test(videoId)) {
      return null;
    }

    const layout = mediaLayout(attrs, "100%");

    return (
      <div key={key} className="my-5" style={layout.style}>
        <div className="relative w-full overflow-hidden rounded-md pt-[56.25%]">
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
      </div>
    );
  }

  if (type === "table") {
    return (
      <div key={key} className="my-5 overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  }

  if (type === "tableRow") return <tr key={key}>{children}</tr>;

  if (type === "tableCell" || type === "tableHeader") {
    const attrs = attrsOf(node);
    const span = (value: unknown): number | undefined => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 1 ? parsed : undefined;
    };

    // colwidth is an array because a merged cell spans several columns.
    const colwidth = Array.isArray(attrs.colwidth)
      ? attrs.colwidth.reduce<number>(
          (total, entry) =>
            total + (Number.isFinite(Number(entry)) ? Number(entry) : 0),
          0,
        )
      : 0;

    const Cell = type === "tableHeader" ? "th" : "td";

    return (
      <Cell
        key={key}
        colSpan={span(attrs.colspan)}
        rowSpan={span(attrs.rowspan)}
        style={colwidth > 0 ? { width: `${colwidth}px` } : undefined}
        className={`border border-line px-2.5 py-2 align-top ${
          type === "tableHeader"
            ? "bg-surface-subtle text-start font-semibold"
            : ""
        }`}
      >
        {children}
      </Cell>
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
    // after:clear-both contains floated media: without it a wrapped image near
    // the end of an article overhangs the last paragraph and collides with
    // whatever follows the article.
    <article dir={dir} className={`${className} after:block after:clear-both`}>
      {renderNode(document, "article", articleAssetBasePath)}
    </article>
  );
}
