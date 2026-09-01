import type { ReactNode } from "react";

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("http://")
  ) {
    return value;
  }
  return null;
}

function renderChildren(value: unknown, key: string): ReactNode {
  if (!Array.isArray(value)) return null;
  return value.map((child, index) => renderNode(child, `${key}-${index}`));
}

function renderNode(value: unknown, key: string): ReactNode {
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
      if (markType === "bold")
        content = <strong key={`${key}-b-${index}`}>{content}</strong>;
      if (markType === "italic")
        content = <em key={`${key}-i-${index}`}>{content}</em>;
      if (markType === "strike")
        content = <s key={`${key}-s-${index}`}>{content}</s>;
      if (markType === "code")
        content = (
          <code
            key={`${key}-c-${index}`}
            className="rounded bg-slate-100 px-1 py-0.5 text-[0.92em]"
          >
            {content}
          </code>
        );
      if (markType === "link") {
        const attrs =
          mark.attrs && typeof mark.attrs === "object"
            ? (mark.attrs as Record<string, unknown>)
            : {};
        const href = safeHref(attrs.href);
        if (href) {
          content = (
            <a
              key={`${key}-a-${index}`}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              className="text-brand underline underline-offset-2"
            >
              {content}
            </a>
          );
        }
      }
    }
    return content;
  }

  const children = renderChildren(node.content, key);
  if (type === "doc")
    return (
      <div key={key} className="grid gap-4">
        {children}
      </div>
    );
  if (type === "paragraph")
    return (
      <p key={key} className="leading-7">
        {children}
      </p>
    );
  if (type === "heading") {
    const attrs =
      node.attrs && typeof node.attrs === "object"
        ? (node.attrs as Record<string, unknown>)
        : {};
    const level = Number(attrs.level);
    if (level === 2)
      return (
        <h2 key={key} className="mt-2 text-xl font-semibold text-content">
          {children}
        </h2>
      );
    if (level === 3)
      return (
        <h3 key={key} className="mt-2 text-lg font-semibold text-content">
          {children}
        </h3>
      );
    return (
      <h1 key={key} className="mt-2 text-2xl font-semibold text-content">
        {children}
      </h1>
    );
  }
  if (type === "bulletList")
    return (
      <ul key={key} className="list-disc space-y-2 ps-6">
        {children}
      </ul>
    );
  if (type === "orderedList")
    return (
      <ol key={key} className="list-decimal space-y-2 ps-6">
        {children}
      </ol>
    );
  if (type === "listItem") return <li key={key}>{children}</li>;
  if (type === "blockquote")
    return (
      <blockquote key={key} className="border-s-4 border-line ps-4 text-muted">
        {children}
      </blockquote>
    );
  if (type === "codeBlock")
    return (
      <pre
        key={key}
        className="overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100"
      >
        <code>{children}</code>
      </pre>
    );
  if (type === "hardBreak") return <br key={key} />;
  if (type === "horizontalRule")
    return <hr key={key} className="border-line" />;
  return <div key={key}>{children}</div>;
}

export function LessonArticleViewer({ document }: { document: unknown }) {
  return (
    <article className="h-full min-h-0 overflow-y-auto overscroll-contain rounded-lg border border-line bg-white p-5 text-sm text-content sm:p-7 lg:p-8">
      {renderNode(document, "article")}
    </article>
  );
}
