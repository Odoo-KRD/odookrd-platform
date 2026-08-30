"use client";

import {
  Extension,
  mergeAttributes,
  Node,
  type JSONContent,
} from "@tiptap/core";
import Image from "@tiptap/extension-image";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type NodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { editorIconAssets, type EditorIconName } from "./editor-icon-assets";

export type RichTextValue = JSONContent;

export interface RichTextEditorLabels {
  paragraph: string;
  heading2: string;
  heading3: string;
  bold: string;
  italic: string;
  strike: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  codeBlock: string;
  undo: string;
  redo: string;
  image: string;
  attachment: string;
  fullscreen: string;
  exitFullscreen: string;
  uploadFailed: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  directionLtr: string;
  directionRtl: string;
  separator: string;
  separatorPrompt: string;
  imageAlignLeft: string;
  imageAlignCenter: string;
  imageAlignRight: string;
  imageMove: string;
  imageDelete: string;
  imageResize: string;
  imageActualSize: string;
  placeholder: string;
  link: string;
  unlink: string;
  linkPrompt: string;
  linkInvalid: string;
  dialogApply: string;
  dialogCancel: string;
}

export interface RichTextUploadedFile {
  href: string;
  name: string;
}

export interface RichTextEditorProps {
  value: RichTextValue | null;
  onChange: (value: RichTextValue) => void;
  labels: RichTextEditorLabels;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<string>;
  onUploadFile?: (file: File) => Promise<RichTextUploadedFile>;
}

type ImageAlignment = "left" | "center" | "right";
type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type CommandDialog =
  { kind: "link"; value: string } | { kind: "separator"; value: string } | null;

const emptyDocument: RichTextValue = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function normalizeValue(value: RichTextValue | null): RichTextValue {
  return value && value.type === "doc" ? value : emptyDocument;
}

function EditorIcon({
  name,
  className = "size-4",
}: {
  name: EditorIconName;
  className?: string;
}) {
  return (
    <img
      src={editorIconAssets[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
    />
  );
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  icon,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: EditorIconName;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-semibold transition ${
        active
          ? "border-[#714b67]/35 bg-[#714b67]/10"
          : "border-slate-200 bg-white hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon ? <EditorIcon name={icon} /> : children}
    </button>
  );
}

const BlockPresentation = Extension.create({
  name: "blockPresentation",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "blockquote"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => element.style.textAlign || null,
            renderHTML: (attributes) =>
              attributes.textAlign
                ? { style: `text-align: ${String(attributes.textAlign)}` }
                : {},
          },
          dir: {
            default: null,
            parseHTML: (element) => element.getAttribute("dir"),
            renderHTML: (attributes) =>
              attributes.dir ? { dir: String(attributes.dir) } : {},
          },
        },
      },
    ];
  },
});

function ResizableImageNodeView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<number | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);

  const attrs = node.attrs as {
    src?: string;
    alt?: string | null;
    title?: string | null;
    width?: number | null;
    align?: ImageAlignment | null;
  };
  const align: ImageAlignment =
    attrs.align === "left" || attrs.align === "right" ? attrs.align : "center";
  const storedWidth =
    typeof attrs.width === "number" && Number.isFinite(attrs.width)
      ? attrs.width
      : null;
  const displayWidth = previewWidth ?? storedWidth;

  useEffect(() => {
    if (!selected) setPreviewWidth(null);
  }, [selected]);

  function selectImageNode(): void {
    const position = getPos();
    if (typeof position === "number") {
      editor.commands.setNodeSelection(position);
    }
  }

  function actualSize(): void {
    const naturalWidth = imageRef.current?.naturalWidth;
    if (!naturalWidth || naturalWidth <= 0) return;
    updateAttributes({ width: naturalWidth });
  }

  function prepareSmallDragPreview(): void {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const previousTransform = wrapper.style.transform;
    const previousTransformOrigin = wrapper.style.transformOrigin;
    const previousOpacity = wrapper.style.opacity;
    const previousTransition = wrapper.style.transition;

    wrapper.style.transition = "none";
    wrapper.style.transformOrigin = "top left";
    wrapper.style.transform = "scale(0.18)";
    wrapper.style.opacity = "0.42";

    window.setTimeout(() => {
      wrapper.style.transform = previousTransform;
      wrapper.style.transformOrigin = previousTransformOrigin;
      wrapper.style.opacity = previousOpacity;
      wrapper.style.transition = previousTransition;
    }, 0);
  }

  function beginResize(
    event: ReactPointerEvent<HTMLButtonElement>,
    corner: ResizeCorner,
  ): void {
    if (!editor.isEditable || !imageRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    selectImageNode();

    const image = imageRef.current;
    const rect = image.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height || Math.max(1, startWidth);
    const startX = event.clientX;
    const startY = event.clientY;
    const horizontalSign = corner.endsWith("right") ? 1 : -1;
    const verticalSign = corner.startsWith("bottom") ? 1 : -1;
    const maximumWidth =
      image.parentElement?.parentElement?.clientWidth ??
      Math.max(120, startWidth);
    widthRef.current = Math.round(startWidth);

    const onMove = (moveEvent: PointerEvent): void => {
      const horizontalScale =
        (startWidth + (moveEvent.clientX - startX) * horizontalSign) /
        startWidth;
      const verticalScale =
        (startHeight + (moveEvent.clientY - startY) * verticalSign) /
        startHeight;
      const scale =
        Math.abs(horizontalScale - 1) >= Math.abs(verticalScale - 1)
          ? horizontalScale
          : verticalScale;
      const nextWidth = Math.min(
        Math.max(80, Math.round(startWidth * Math.max(0.1, scale))),
        Math.max(80, maximumWidth),
      );
      widthRef.current = nextWidth;
      setPreviewWidth(nextWidth);
    };

    const onUp = (): void => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const nextWidth = widthRef.current;
      if (nextWidth) updateAttributes({ width: nextWidth });
      setPreviewWidth(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  const justifyClass =
    align === "left"
      ? "justify-start"
      : align === "right"
        ? "justify-end"
        : "justify-center";

  const cornerClass: Record<ResizeCorner, string> = {
    "top-left": "-start-1.5 -top-1.5",
    "top-right": "-end-1.5 -top-1.5",
    "bottom-left": "-start-1.5 -bottom-1.5",
    "bottom-right": "-end-1.5 -bottom-1.5",
  };
  const cornerCursor: Record<ResizeCorner, string> = {
    "top-left": "nwse-resize",
    "top-right": "nesw-resize",
    "bottom-left": "nesw-resize",
    "bottom-right": "nwse-resize",
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`my-5 flex w-full ${justifyClass} ${
        editor.isEditable ? "cursor-pointer" : ""
      }`}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        if (!editor.isEditable) return;
        const target = event.target as HTMLElement;
        if (target.closest("button")) return;
        selectImageNode();
      }}
      onDragStartCapture={() => prepareSmallDragPreview()}
    >
      <div
        className="group relative max-w-full"
        style={{
          width: displayWidth ? `${displayWidth}px` : "fit-content",
          maxWidth: "100%",
        }}
      >
        {selected && editor.isEditable ? (
          <div
            contentEditable={false}
            className="absolute -top-11 start-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          >
            <button
              type="button"
              title="Move image"
              aria-label="Move image"
              data-drag-handle
              className="cursor-grab rounded px-2 py-1 text-xs font-semibold tracking-[-0.16em] text-slate-600 hover:bg-slate-100 active:cursor-grabbing"
            >
              ⋮⋮
            </button>
            <button
              type="button"
              title="Align image left"
              aria-label="Align image left"
              onClick={() => updateAttributes({ align: "left" })}
              className={`inline-flex size-8 items-center justify-center rounded ${
                align === "left" ? "bg-[#714b67]/10" : "hover:bg-slate-100"
              }`}
            >
              <EditorIcon name="alignLeft" />
            </button>
            <button
              type="button"
              title="Align image center"
              aria-label="Align image center"
              onClick={() => updateAttributes({ align: "center" })}
              className={`inline-flex size-8 items-center justify-center rounded ${
                align === "center" ? "bg-[#714b67]/10" : "hover:bg-slate-100"
              }`}
            >
              <EditorIcon name="alignCenter" />
            </button>
            <button
              type="button"
              title="Align image right"
              aria-label="Align image right"
              onClick={() => updateAttributes({ align: "right" })}
              className={`inline-flex size-8 items-center justify-center rounded ${
                align === "right" ? "bg-[#714b67]/10" : "hover:bg-slate-100"
              }`}
            >
              <EditorIcon name="alignRight" />
            </button>
            <button
              type="button"
              title="Actual size (100%)"
              aria-label="Actual size (100%)"
              onClick={actualSize}
              className="inline-flex h-8 items-center justify-center rounded px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
            >
              100%
            </button>
            <button
              type="button"
              title="Delete image"
              aria-label="Delete image"
              onClick={deleteNode}
              className="inline-flex size-8 items-center justify-center rounded text-sm font-bold text-red-700 hover:bg-red-50"
            >
              ×
            </button>
          </div>
        ) : null}

        <img
          ref={imageRef}
          src={attrs.src ?? ""}
          alt={attrs.alt ?? ""}
          title={attrs.title ?? undefined}
          data-drag-handle={editor.isEditable ? "" : undefined}
          draggable={editor.isEditable}
          onClick={(event) => {
            if (!editor.isEditable) return;
            event.preventDefault();
            event.stopPropagation();
            selectImageNode();
          }}
          className={`block h-auto max-h-[42rem] max-w-full rounded-sm border-2 object-contain transition ${
            selected
              ? "border-[#2563eb] shadow-sm"
              : "border-transparent group-hover:border-amber-400"
          }`}
          style={{ width: "100%", maxWidth: "100%" }}
        />

        {editor.isEditable
          ? (
              ["top-left", "top-right", "bottom-left", "bottom-right"] as const
            ).map((corner) => (
              <button
                key={corner}
                type="button"
                contentEditable={false}
                aria-label={`Resize image: ${corner}`}
                title={`Resize image: ${corner}`}
                onPointerDown={(event) => beginResize(event, corner)}
                style={{
                  cursor: cornerCursor[corner],
                  touchAction: "none",
                }}
                className={`absolute z-10 size-3 rounded-none border border-white bg-[#2563eb] shadow-sm transition-opacity ${cornerClass[corner]} ${
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              />
            ))
          : null}
      </div>
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-width");
          const parsed = raw ? Number(raw) : Number.NaN;
          return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        },
        renderHTML: (attributes) =>
          attributes.width ? { "data-width": String(attributes.width) } : {},
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") ?? "center",
        renderHTML: (attributes) => ({
          "data-align": String(attributes.align ?? "center"),
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

function SeparatorNodeView({ node, selected, editor }: NodeViewProps) {
  const attrs = node.attrs as { label?: string | null };
  const label = typeof attrs.label === "string" ? attrs.label.trim() : "";

  return (
    <NodeViewWrapper
      data-drag-handle={editor.isEditable ? "" : undefined}
      className={`my-6 flex w-full cursor-grab items-center gap-3 rounded-md px-2 py-2 ${
        selected ? "bg-[#714b67]/5 ring-1 ring-[#714b67]/25" : ""
      }`}
    >
      <span className="h-px min-w-6 flex-1 bg-slate-300" />
      {label ? (
        <span className="max-w-[70%] truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
      ) : null}
      <span className="h-px min-w-6 flex-1 bg-slate-300" />
    </NodeViewWrapper>
  );
}

const Separator = Node.create({
  name: "separator",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      label: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-label") ?? "",
        renderHTML: (attributes) => ({
          "data-label": String(attributes.label ?? ""),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-odookrd-separator="true"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-odookrd-separator": "true",
      }),
      String(node.attrs.label ?? ""),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SeparatorNodeView);
  },
});

function normalizeLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function RichTextEditor({
  value,
  onChange,
  labels,
  dir = "ltr",
  disabled = false,
  onUploadImage,
  onUploadFile,
}: RichTextEditorProps) {
  const imageUploadId = useId();
  const fileUploadId = useId();
  const commandInputId = useId();
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"image" | "file" | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [commandDialog, setCommandDialog] = useState<CommandDialog>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      BlockPresentation,
      Separator,
      ResizableImage.configure({ allowBase64: false, inline: false }),
    ],
    content: normalizeValue(value),
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON()),
    editorProps: {
      attributes: {
        class: "px-4 py-3 text-sm leading-7 text-slate-800 outline-none",
        dir,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const incoming = normalizeValue(value);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(incoming)) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !commandDialog) setFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [commandDialog, fullscreen]);

  async function uploadImage(file: File): Promise<void> {
    if (!editor || !onUploadImage || disabled) return;
    setEditorError(null);
    setUploading("image");
    try {
      const src = await onUploadImage(file);
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src, alt: file.name, align: "center", width: null },
        })
        .run();
    } catch {
      setEditorError(labels.uploadFailed);
    } finally {
      setUploading(null);
      if (imageUploadRef.current) imageUploadRef.current.value = "";
    }
  }

  async function uploadFile(file: File): Promise<void> {
    if (!editor || !onUploadFile || disabled) return;
    setEditorError(null);
    setUploading("file");
    try {
      const uploaded = await onUploadFile(file);
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "text",
            text: uploaded.name,
            marks: [
              {
                type: "link",
                attrs: {
                  href: uploaded.href,
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
          },
          { type: "text", text: " " },
        ])
        .run();
    } catch {
      setEditorError(labels.uploadFailed);
    } finally {
      setUploading(null);
      if (fileUploadRef.current) fileUploadRef.current.value = "";
    }
  }

  function currentTextBlock(): "heading" | "blockquote" | "paragraph" {
    if (editor?.isActive("heading")) return "heading";
    if (editor?.isActive("blockquote")) return "blockquote";
    return "paragraph";
  }

  function updateBlockAttribute(
    attribute: "textAlign" | "dir",
    nextValue: string | null,
  ): void {
    if (!editor || disabled) return;
    editor
      .chain()
      .focus()
      .updateAttributes(currentTextBlock(), { [attribute]: nextValue })
      .run();
  }

  function isBlockAttributeActive(
    attribute: "textAlign" | "dir",
    valueToCheck: string,
  ): boolean {
    if (!editor) return false;
    return editor.isActive(currentTextBlock(), {
      [attribute]: valueToCheck,
    });
  }

  function toggleRtl(): void {
    const active = isBlockAttributeActive("dir", "rtl");
    updateBlockAttribute("dir", active ? null : "rtl");
  }

  function openSeparatorDialog(): void {
    if (!editor || disabled) return;
    setCommandDialog({ kind: "separator", value: "" });
  }

  function openLinkDialog(): void {
    if (!editor || disabled) return;
    setEditorError(null);
    const currentHref =
      typeof editor.getAttributes("link").href === "string"
        ? String(editor.getAttributes("link").href)
        : "https://";
    setCommandDialog({ kind: "link", value: currentHref });
  }

  function applyCommandDialog(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (!editor || disabled || !commandDialog) return;

    if (commandDialog.kind === "separator") {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "separator",
          attrs: { label: commandDialog.value.trim() },
        })
        .run();
      setCommandDialog(null);
      return;
    }

    const href = normalizeLink(commandDialog.value);
    if (!href) {
      setEditorError(labels.linkInvalid);
      return;
    }

    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: href,
          marks: [
            {
              type: "link",
              attrs: {
                href,
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }

    setCommandDialog(null);
  }

  function removeLink(): void {
    if (!editor || disabled) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }

  const editorShell = (
    <div
      dir={dir}
      className={`flex min-h-0 flex-col overflow-hidden bg-white focus-within:border-[#714b67] focus-within:ring-2 focus-within:ring-[#714b67]/10 ${
        fullscreen
          ? "h-[100dvh] w-screen rounded-none border-0"
          : "rounded-lg border border-slate-300"
      }`}
    >
      <div
        dir={dir}
        className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b border-slate-200 bg-slate-50/80 px-2.5 py-2"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <ToolButton
            label={labels.paragraph}
            active={editor?.isActive("paragraph") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().setParagraph().run()}
            icon="paragraph"
          />
          <ToolButton
            label={labels.heading2}
            active={editor?.isActive("heading", { level: 2 }) ?? false}
            disabled={!editor || disabled}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            icon="heading2"
          />
          <ToolButton
            label={labels.heading3}
            active={editor?.isActive("heading", { level: 3 }) ?? false}
            disabled={!editor || disabled}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
            icon="heading3"
          />

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          <ToolButton
            label={labels.bold}
            active={editor?.isActive("bold") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            icon="bold"
          />
          <ToolButton
            label={labels.italic}
            active={editor?.isActive("italic") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            icon="italic"
          />
          <ToolButton
            label={labels.strike}
            active={editor?.isActive("strike") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            icon="strike"
          />

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          <ToolButton
            label={labels.alignLeft}
            active={isBlockAttributeActive("textAlign", "left")}
            disabled={!editor || disabled}
            onClick={() => updateBlockAttribute("textAlign", "left")}
            icon="alignLeft"
          />
          <ToolButton
            label={labels.alignCenter}
            active={isBlockAttributeActive("textAlign", "center")}
            disabled={!editor || disabled}
            onClick={() => updateBlockAttribute("textAlign", "center")}
            icon="alignCenter"
          />
          <ToolButton
            label={labels.alignRight}
            active={isBlockAttributeActive("textAlign", "right")}
            disabled={!editor || disabled}
            onClick={() => updateBlockAttribute("textAlign", "right")}
            icon="alignRight"
          />
          <ToolButton
            label={labels.directionRtl}
            active={isBlockAttributeActive("dir", "rtl")}
            disabled={!editor || disabled}
            onClick={toggleRtl}
            icon="rtl"
          />

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          <ToolButton
            label={labels.bulletList}
            active={editor?.isActive("bulletList") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            icon="bulletList"
          />
          <ToolButton
            label={labels.orderedList}
            active={editor?.isActive("orderedList") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            icon="orderedList"
          />
          <ToolButton
            label={labels.blockquote}
            active={editor?.isActive("blockquote") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            icon="blockquote"
          />
          <ToolButton
            label={labels.codeBlock}
            active={editor?.isActive("codeBlock") ?? false}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            icon="codeBlock"
          />
          <ToolButton
            label={labels.separator}
            disabled={!editor || disabled}
            onClick={openSeparatorDialog}
            icon="separator"
          />

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          <ToolButton
            label={labels.link}
            active={editor?.isActive("link") ?? false}
            disabled={!editor || disabled}
            onClick={openLinkDialog}
            icon="link"
          />
          <ToolButton
            label={labels.unlink}
            disabled={
              !editor || disabled || !(editor?.isActive("link") ?? false)
            }
            onClick={removeLink}
            icon="unlink"
          />

          {onUploadImage ? (
            <>
              <input
                ref={imageUploadRef}
                id={imageUploadId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.svg"
                className="sr-only"
                disabled={disabled || uploading !== null}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />
              <ToolButton
                label={labels.image}
                disabled={!editor || disabled || uploading !== null}
                onClick={() => imageUploadRef.current?.click()}
                icon="image"
              />
            </>
          ) : null}

          {onUploadFile ? (
            <>
              <input
                ref={fileUploadRef}
                id={fileUploadId}
                type="file"
                accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,application/zip,.zip"
                className="sr-only"
                disabled={disabled || uploading !== null}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
              <ToolButton
                label={labels.attachment}
                disabled={!editor || disabled || uploading !== null}
                onClick={() => fileUploadRef.current?.click()}
                icon="attachment"
              />
            </>
          ) : null}

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          <ToolButton
            label={labels.undo}
            disabled={
              !editor ||
              disabled ||
              !(editor?.can().chain().focus().undo().run() ?? false)
            }
            onClick={() => editor?.chain().focus().undo().run()}
            icon="undo"
          />
          <ToolButton
            label={labels.redo}
            disabled={
              !editor ||
              disabled ||
              !(editor?.can().chain().focus().redo().run() ?? false)
            }
            onClick={() => editor?.chain().focus().redo().run()}
            icon="redo"
          />
        </div>

        <div className="shrink-0 self-start">
          <ToolButton
            label={fullscreen ? labels.exitFullscreen : labels.fullscreen}
            disabled={!editor}
            onClick={() => setFullscreen((current) => !current)}
            icon={fullscreen ? "exitFullscreen" : "fullscreen"}
          />
        </div>
      </div>

      {editorError ? (
        <p
          role="alert"
          className="shrink-0 border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {editorError}
        </p>
      ) : null}

      <div
        className={`relative cursor-text ${
          fullscreen
            ? "min-h-0 flex-1 overflow-y-auto"
            : "h-64 min-h-48 max-h-[70vh] resize-y overflow-auto"
        } [&_.ProseMirror]:min-h-[11rem] [&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-[#714b67] [&_.ProseMirror_a]:underline [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ps-6 [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ps-6 [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-s-2 [&_.ProseMirror_blockquote]:border-slate-300 [&_.ProseMirror_blockquote]:ps-4 [&_.ProseMirror_pre]:my-3 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-slate-950 [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:text-slate-100 ${
          fullscreen ? "[&_.ProseMirror]:min-h-[calc(100dvh-4.5rem)]" : ""
        }`}
        onMouseDown={(event) => {
          if (!editor || disabled) return;
          const target = event.target as HTMLElement;
          if (
            target.closest(
              "button,a,img,[data-node-view-wrapper],[data-drag-handle]",
            )
          ) {
            return;
          }
          if (
            event.target === event.currentTarget ||
            target.classList.contains("ProseMirror") ||
            !target.closest(".ProseMirror")
          ) {
            event.preventDefault();
            editor.commands.focus("end");
          }
        }}
      >
        {editor?.isEmpty ? (
          <p className="pointer-events-none absolute start-4 top-3 z-10 text-sm text-slate-400">
            {labels.placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} className="min-h-full cursor-text" />
      </div>
    </div>
  );

  const commandDialogContent = commandDialog ? (
    <div
      dir={dir}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) setCommandDialog(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") setCommandDialog(null);
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${commandInputId}-title`}
        onSubmit={applyCommandDialog}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
      >
        <header className="border-b border-slate-200 px-5 py-4">
          <h3
            id={`${commandInputId}-title`}
            className="text-base font-semibold text-slate-900"
          >
            {commandDialog.kind === "link" ? labels.link : labels.separator}
          </h3>
        </header>

        <div className="grid gap-2 px-5 py-5">
          <label
            htmlFor={commandInputId}
            className="text-sm font-medium text-slate-700"
          >
            {commandDialog.kind === "link"
              ? labels.linkPrompt
              : labels.separatorPrompt}
          </label>
          <input
            id={commandInputId}
            type={commandDialog.kind === "link" ? "url" : "text"}
            autoFocus
            value={commandDialog.value}
            onChange={(event) =>
              setCommandDialog({
                ...commandDialog,
                value: event.currentTarget.value,
              })
            }
            maxLength={commandDialog.kind === "link" ? 2048 : 200}
            placeholder={commandDialog.kind === "link" ? "https://" : undefined}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
          />
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={() => setCommandDialog(null)}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {labels.dialogCancel}
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-[#714b67] px-4 text-sm font-semibold text-white hover:bg-[#5f3f57]"
          >
            {labels.dialogApply}
          </button>
        </footer>
      </form>
    </div>
  ) : null;

  const commandDialogElement =
    commandDialogContent && typeof document !== "undefined"
      ? createPortal(commandDialogContent, document.body)
      : null;

  if (!fullscreen) {
    return (
      <>
        {editorShell}
        {commandDialogElement}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-white">
        {editorShell}
      </div>
      {commandDialogElement}
    </>
  );
}
