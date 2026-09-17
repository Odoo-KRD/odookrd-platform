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
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { EditorIcon, type EditorIconName } from "./editor-icons";
import {
  RepositionOverlay,
  useNodeReposition,
} from "./rich-text-reposition";
import {
  EditorToolbar,
  type EditorToolbarGroupId,
  type RichTextToolbarConfig,
  type ToolbarGroup,
  type ToolbarMenuAction,
} from "./rich-text-toolbar";
import {
  TABLE_STYLE_ELEMENT_ID,
  TABLE_STYLES,
  tableExtensions,
} from "./rich-text-tables";

export type RichTextValue = JSONContent;

export interface RichTextEditorLabels {
  paragraph: string;
  heading1: string;
  heading2: string;
  heading3: string;
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  clearFormatting: string;
  indent: string;
  outdent: string;
  resizeEditor: string;
  words: string;
  characters: string;
  table: string;
  tableInsert: string;
  tableAddRowBefore: string;
  tableAddRowAfter: string;
  tableDeleteRow: string;
  tableAddColumnBefore: string;
  tableAddColumnAfter: string;
  tableDeleteColumn: string;
  tableToggleHeaderRow: string;
  tableToggleHeaderColumn: string;
  tableMergeOrSplit: string;
  tableDelete: string;
  videoAlignLeft: string;
  videoAlignCenter: string;
  videoAlignRight: string;
  videoFullWidth: string;
  videoMove: string;
  videoDelete: string;
  videoEditUrl: string;
  wrapLeft: string;
  wrapRight: string;
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
  youtube: string;
  youtubePrompt: string;
  youtubeInvalid: string;
  calloutNote: string;
  calloutWarning: string;
  calloutTip: string;
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
  more: string;
  groupHistory: string;
  groupBlocks: string;
  groupMarks: string;
  groupAlignment: string;
  groupLists: string;
  groupInsert: string;
  groupCallouts: string;
  groupLinks: string;
  groupMedia: string;
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
  /**
   * Which toolbar groups to show, in what order, and which of them keep their
   * place when the editor is narrow. Omit for every group in the default
   * order.
   */
  toolbar?: RichTextToolbarConfig;
}

type ImageAlignment = "left" | "center" | "right";
type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** Shared by the image and video node views. */
const cornerCursor: Record<ResizeCorner, string> = {
  "top-left": "nwse-resize",
  "top-right": "nesw-resize",
  "bottom-left": "nesw-resize",
  "bottom-right": "nwse-resize",
};
/**
 * Groups that keep their place in the bar when space runs short, unless the
 * caller says otherwise.
 *
 * Render order doubles as collapse priority — groups are dropped from the end
 * — and undo/redo sits at the end by design, so history has to be pinned or it
 * would be the very first thing to disappear. Blocks and marks are here
 * because they are what someone reaches for on every paragraph.
 */
const DEFAULT_COMPACT_GROUPS: EditorToolbarGroupId[] = [
  "blocks",
  "marks",
  "history",
];

/**
 * Media that sits narrower than the writing column, and so has empty space
 * beside it that belongs to the document rather than to the node.
 */
const GUTTER_SAFE_NODES = new Set(["image", "youtubeEmbed"]);

/**
 * How media sits relative to the text around it.
 *
 * "none" is a block on its own line, positioned by `align`. "left" and "right"
 * float it so the following paragraphs run alongside — CKEditor calls these
 * wrapped images, and they are a different question from alignment: a wrapped
 * image is always on the side it floats to, and an unwrapped one always has
 * the line to itself. Keeping them as two attributes means an author can say
 * "centred, on its own line" or "float right", and neither setting quietly
 * overwrites the other.
 */
type MediaWrap = "none" | "left" | "right";

function readWrap(value: unknown): MediaWrap {
  return value === "left" || value === "right" ? value : "none";
}


/** Preset widths, as a share of the writing column. */
const SIZE_PRESETS = [100, 75, 50, 25] as const;

/**
 * Sets media width to a share of the writing column.
 *
 * A percentage of the column rather than of the file's own pixels: the column
 * is what the reader sees, and "50%" should mean half the page whether the
 * source image is 800px or 4000px wide. 100% clears the stored width instead
 * of writing a number, so the media goes back to flowing with the column
 * rather than being pinned to whatever it happened to measure today.
 */
function MediaSizeMenu({
  label,
  element,
  onPick,
}: {
  label: string | undefined;
  /** Any node inside the editor; used to measure the writing column. */
  element: HTMLElement | null;
  onPick: (width: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof globalThis.Node && ref.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function pick(percent: number): void {
    setOpen(false);
    if (percent === 100) {
      onPick(null);
      return;
    }
    const column = element?.closest(".ProseMirror")?.clientWidth ?? 0;
    onPick(column > 0 ? Math.round((column * percent) / 100) : null);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center justify-center gap-0.5 rounded px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
      >
        100%
        <span aria-hidden="true" className="text-[8px]">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          dir="ltr"
          className="absolute left-1/2 top-9 z-30 grid w-20 -translate-x-1/2 gap-0.5 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
        >
          {SIZE_PRESETS.map((percent) => (
            <button
              key={percent}
              type="button"
              role="menuitem"
              onClick={() => pick(percent)}
              className="rounded px-2 py-1 text-center text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              {percent}%
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Width a floated image takes when the author has not sized it. */
const DEFAULT_WRAP_WIDTH = 320;

/**
 * Positioning for the node view wrapper.
 *
 * Float and auto-margin alignment are mutually exclusive: a floated box is
 * already hard against one side, and auto margins on it do nothing. The sides
 * are physical, so "float left" is the left of the screen in Kurdish too.
 */
function mediaLayoutStyle(
  wrap: MediaWrap,
  align: ImageAlignment,
  width: number | null,
  fallbackWidth: string,
): Record<string, string | number> {
  if (wrap !== "none") {
    return {
      float: wrap,
      width: `${width ?? DEFAULT_WRAP_WIDTH}px`,
      maxWidth: "100%",
      marginTop: "0.25rem",
      marginBottom: "0.5rem",
      marginLeft: wrap === "left" ? 0 : "1rem",
      marginRight: wrap === "left" ? "1rem" : 0,
    };
  }

  return {
    float: "none",
    marginLeft: align === "left" ? 0 : "auto",
    marginRight: align === "right" ? 0 : "auto",
    width: width ? `${width}px` : fallbackWidth,
    maxWidth: "100%",
  };
}

/**
 * Editor body height, in pixels.
 *
 * Roughly a screenful of prose. The old 256 was about four lines once the
 * toolbar and status bar took their share, which meant scrolling almost
 * immediately on an article of any length.
 */
const DEFAULT_EDITOR_HEIGHT = 440;
const MINIMUM_EDITOR_HEIGHT = 176;
const MINIMUM_VIDEO_WIDTH = 200;

function clampHeight(value: number): number {
  const ceiling =
    typeof window === "undefined"
      ? 900
      : Math.max(MINIMUM_EDITOR_HEIGHT, Math.round(window.innerHeight * 0.85));
  return Math.min(Math.max(MINIMUM_EDITOR_HEIGHT, Math.round(value)), ceiling);
}

type CommandDialog =
  | { kind: "link"; value: string }
  | { kind: "separator"; value: string }
  | { kind: "youtube"; value: string }
  | null;

const emptyDocument: RichTextValue = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function normalizeValue(value: RichTextValue | null): RichTextValue {
  return value && value.type === "doc" ? value : emptyDocument;
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
  extension,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const labels = (extension.options as MediaNodeOptions).labels;
  const { repositioning, beginReposition } = useNodeReposition(editor, getPos);
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
    wrap?: string | null;
  };
  const align: ImageAlignment =
    attrs.align === "left" || attrs.align === "right" ? attrs.align : "center";
  const wrap = readWrap(attrs.wrap);
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
    // Measured against the writing column. Walking up two parents used to
    // reach it, but the wrapper now hugs the image, so that gave back the
    // image's own width and pinned the ceiling to wherever it already was.
    const maximumWidth =
      image.closest(".ProseMirror")?.clientWidth ?? Math.max(120, startWidth);
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

  const layoutStyle = mediaLayoutStyle(wrap, align, displayWidth, "fit-content");

  /*
    Physical sides, not logical ones. cornerCursor and the drag sign in
    beginResize both key off the physical name — "bottom-right" means a
    nwse cursor and a positive x delta. With -start/-end the handle named
    bottom-right physically sat bottom-LEFT in Kurdish and Arabic, so it
    showed the mirrored cursor and grew the image when you dragged inward.
    A resize gesture is physical; the classes have to be too.
  */
  const cornerClass: Record<ResizeCorner, string> = {
    "top-left": "-left-1.5 -top-1.5",
    "top-right": "-right-1.5 -top-1.5",
    "bottom-left": "-left-1.5 -bottom-1.5",
    "bottom-right": "-right-1.5 -bottom-1.5",
  };

  return (
    /*
      The wrapper is only as wide as the image, and alignment comes from auto
      margins rather than a full-width flex row.

      This is what actually stops a click in the gutter from selecting the
      image. Making the wrapper non-interactive did not, because ProseMirror
      resolves a click to a document position by coordinate — the gutter was
      still inside the node's box, so it still mapped to the node. Shrink the
      box and the gutter is genuinely outside it, so the click lands in the
      paragraph flow and places a cursor, which is what it should always have
      done.

      The margins are physical: "align left" means the left of the screen in
      Kurdish too.
    */
    <NodeViewWrapper
      ref={wrapperRef}
      /*
        Width lives on the wrapper, not on the box inside. `min(Npx, 100%)` on
        a child of a shrink-to-fit wrapper is circular — the percentage
        resolves against a parent whose width depends on that child — and the
        box collapsed to nothing. The wrapper's containing block is the writing
        column, which has a definite width, so the clamp belongs here.
      */
      className="my-5"
      style={layoutStyle}
    >
      <div
        className={`group relative max-w-full ${
          editor.isEditable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        /*
          Selection happens on pointerdown, not click.

          ProseMirror decides what a drag is carrying when dragstart fires, and
          dragstart comes before click — so selecting on click meant the node
          was still unselected at the moment that mattered, and the drag had no
          node to move. Pressing the image now selects it straight away, which
          is also what every other editor does.
        */
        onPointerDown={(event: ReactPointerEvent<HTMLElement>) => {
          if (!editor.isEditable) return;
          if ((event.target as HTMLElement).closest("button")) return;
          selectImageNode();
          beginReposition(event, attrs.src ?? null);
        }}
        style={{ width: "100%", maxWidth: "100%" }}
      >
        {selected && editor.isEditable ? (
          <div
            contentEditable={false}
            /*
              left-1/2 rather than start-1/2: paired with a physical
              -translate-x-1/2, a logical inset resolves to right:50% in
              Kurdish and the two compound instead of cancelling, throwing the
              toolbar off the edge and widening the scroll area. Both halves of
              the centring have to speak the same coordinate system.

              Sitting inside the frame rather than above it also keeps a
              left-aligned video from pushing the editor sideways, and keeps
              the controls visible when the media is at the top of the
              document.
            */
            /*
              dir="ltr" on the control strip. These buttons mean physical
              left / centre / right, and a row inside an RTL document lays its
              children out right-to-left — so the icons appeared in the reverse
              of the order they act in. The document stays RTL; this one strip
              does not.
            */
            dir="ltr"
            className="absolute inset-x-0 top-2 z-20 mx-auto flex w-fit max-w-[calc(100%-1rem)] flex-wrap items-center justify-center gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur-sm"
          >
            <button
              type="button"
              title={labels?.imageMove}
              aria-label={labels?.imageMove}
              onPointerDown={(event) => beginReposition(event, attrs.src ?? null)}
              className="cursor-grab rounded px-2 py-1 text-xs font-semibold tracking-[-0.16em] text-slate-600 hover:bg-slate-100 active:cursor-grabbing"
            >
              ⋮⋮
            </button>
            {(["left", "center", "right"] as const).map((option) => {
              const alignLabel =
                option === "left"
                  ? labels?.imageAlignLeft
                  : option === "right"
                    ? labels?.imageAlignRight
                    : labels?.imageAlignCenter;
              // Only lit when the image is actually on its own line: while text
              // is wrapped around it, alignment is not what is positioning it,
              // so showing one of these as active would misreport the state.
              const isActive = wrap === "none" && align === option;

              return (
                <button
                  key={option}
                  type="button"
                  title={alignLabel}
                  aria-label={alignLabel}
                  aria-pressed={isActive}
                  // Alignment and wrapping are alternatives, so choosing one
                  // turns the other off rather than leaving both set and
                  // letting the CSS decide which wins.
                  onClick={() =>
                    updateAttributes({ align: option, wrap: "none" })
                  }
                  className={`inline-flex size-8 items-center justify-center rounded ${
                    isActive ? "bg-[#714b67]/10 text-[#714b67]" : "hover:bg-slate-100"
                  }`}
                >
                  <EditorIcon
                    name={
                      option === "left"
                        ? "alignImageLeft"
                        : option === "right"
                          ? "alignImageRight"
                          : "alignImageCenter"
                    }
                  />
                </button>
              );
            })}
            <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />
            {/*
              Wrapping, kept separate from alignment. These float the media so
              text runs beside it; the three above place it on a line of its
              own. Pressing an active one turns wrapping back off.
            */}
            {(["left", "right"] as const).map((side) => {
              const wrapLabel =
                side === "left" ? labels?.wrapLeft : labels?.wrapRight;
              return (
                <button
                  key={`wrap-${side}`}
                  type="button"
                  title={wrapLabel}
                  aria-label={wrapLabel}
                  aria-pressed={wrap === side}
                  onClick={() =>
                    updateAttributes({ wrap: wrap === side ? "none" : side })
                  }
                  className={`inline-flex size-8 items-center justify-center rounded ${
                    wrap === side
                      ? "bg-[#714b67]/10 text-[#714b67]"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <EditorIcon
                    name={side === "left" ? "wrapTextLeft" : "wrapTextRight"}
                  />
                </button>
              );
            })}
            <MediaSizeMenu
              label={labels?.imageActualSize}
              element={imageRef.current}
              onPick={(width) => updateAttributes({ width })}
            />
            <button
              type="button"
              title={labels?.imageDelete}
              aria-label={labels?.imageDelete}
              onClick={deleteNode}
              className="inline-flex size-8 items-center justify-center rounded text-sm font-bold text-red-700 hover:bg-red-50"
            >
              ×
            </button>
          </div>
        ) : null}

        {/*
          The drag source is this wrapper, not the <img>.

          draggable on an <img> gets the browser's built-in image drag, which
          is a different gesture altogether: it carries the picture as file and
          URL data for dropping into other applications, and ProseMirror never
          gets to treat it as moving a node within the document. The video
          embed hangs its handle on a plain div and repositions correctly,
          which is the whole difference between the two. So: a div carries the
          handle, and the image itself is explicitly not draggable.
        */}
        <div className="block w-full">
          <img
            ref={imageRef}
            src={attrs.src ?? ""}
            alt={attrs.alt ?? ""}
            title={attrs.title ?? undefined}
            draggable={false}
            /*
              No max-height and no object-contain. Together they capped the
              rendered height and then letterboxed the picture inside a box
              that kept growing, so past a certain size dragging a corner only
              added white margins — the frame got wider, the image did not.
              Width drives the size; height follows the aspect ratio.
            */
            className={`block h-auto w-full max-w-full rounded-sm border-2 transition ${
              selected
                ? "border-[#2563eb] shadow-sm"
                : "border-transparent group-hover:border-amber-400"
            }`}
            style={{ width: "100%", maxWidth: "100%" }}
          />
        </div>

        {editor.isEditable
          ? (
              ["top-left", "top-right", "bottom-left", "bottom-right"] as const
            ).map((corner) => (
              <button
                key={corner}
                type="button"
                contentEditable={false}
                aria-label={labels?.imageResize}
                title={labels?.imageResize}
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
      <RepositionOverlay state={repositioning} />
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend<
  Parameters<typeof Image.configure>[0] & MediaNodeOptions
>({
  draggable: true,
  addOptions() {
    return { ...this.parent?.(), labels: null };
  },
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
      wrap: {
        default: "none",
        parseHTML: (element) => element.getAttribute("data-wrap") ?? "none",
        renderHTML: (attributes) => ({
          "data-wrap": String(attributes.wrap ?? "none"),
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

function YoutubeNodeView({
  node,
  selected,
  editor,
  extension,
  updateAttributes,
  deleteNode,
  getPos,
}: NodeViewProps) {
  const labels = (extension.options as MediaNodeOptions).labels;
  const { repositioning, beginReposition } = useNodeReposition(editor, getPos);
  const attrs = node.attrs as {
    videoId?: string | null;
    width?: number | null;
    align?: ImageAlignment | null;
    wrap?: string | null;
  };
  const videoId = typeof attrs.videoId === "string" ? attrs.videoId : "";
  const thumbnailSrc = videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : null;
  const storedWidth =
    typeof attrs.width === "number" && Number.isFinite(attrs.width)
      ? attrs.width
      : null;
  const align: ImageAlignment =
    attrs.align === "left" || attrs.align === "right" ? attrs.align : "center";
  const wrap = readWrap(attrs.wrap);

  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [resizing, setResizing] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef<number | null>(storedWidth);

  const displayWidth = previewWidth ?? storedWidth;

  useEffect(() => {
    if (!selected) setPreviewWidth(null);
  }, [selected]);

  function selectVideoNode(): void {
    const position = getPos();
    if (typeof position === "number") {
      editor.commands.setNodeSelection(position);
    }
  }

  /**
   * Resizing keeps the 16:9 frame and only changes width, so a drag on either
   * bottom corner is a width gesture. The sign comes from the physical corner
   * rather than the writing direction: dragging the left handle leftwards
   * grows the video in Kurdish exactly as it does in English.
   */
  function beginResize(
    event: ReactPointerEvent<HTMLElement>,
    corner: ResizeCorner,
  ): void {
    if (!editor.isEditable) return;
    event.preventDefault();
    event.stopPropagation();
    selectVideoNode();

    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const startWidth = rect.width;
    const startX = event.clientX;
    const horizontalSign = corner.endsWith("right") ? 1 : -1;
    // Measured against the writing column rather than a fixed ancestor depth,
    // so the ceiling stays right inside a callout, a list, or a table cell.
    const maximumWidth =
      frame.closest(".ProseMirror")?.clientWidth ?? Math.max(200, startWidth);

    widthRef.current = Math.round(startWidth);
    setResizing(true);

    const onMove = (moveEvent: PointerEvent): void => {
      const next = Math.min(
        Math.max(
          MINIMUM_VIDEO_WIDTH,
          Math.round(
            startWidth + (moveEvent.clientX - startX) * horizontalSign,
          ),
        ),
        Math.max(MINIMUM_VIDEO_WIDTH, maximumWidth),
      );
      widthRef.current = next;
      setPreviewWidth(next);
    };

    const onUp = (): void => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setResizing(false);
      if (widthRef.current) updateAttributes({ width: widthRef.current });
      setPreviewWidth(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  const layoutStyle = mediaLayoutStyle(wrap, align, displayWidth, "100%");

  return (
    <NodeViewWrapper
      className="my-5"
      // Width on the wrapper, for the reason spelled out in the image node.
      style={layoutStyle}
    >
      <div
        ref={frameRef}
        className={`group relative max-w-full ${
          editor.isEditable ? "cursor-pointer" : ""
        }`}
        // Selected on pointerdown so the node is already the selection by the
        // time dragstart asks what is being dragged. See the image node.
        onPointerDown={(event: ReactPointerEvent<HTMLElement>) => {
          if (!editor.isEditable) return;
          if ((event.target as HTMLElement).closest("button")) return;
          selectVideoNode();
          beginReposition(event, thumbnailSrc);
        }}
        style={{ width: "100%", maxWidth: "100%" }}
      >
        {selected && editor.isEditable ? (
          <div
            contentEditable={false}
            /*
              left-1/2 rather than start-1/2: paired with a physical
              -translate-x-1/2, a logical inset resolves to right:50% in
              Kurdish and the two compound instead of cancelling, throwing the
              toolbar off the edge and widening the scroll area. Both halves of
              the centring have to speak the same coordinate system.

              Sitting inside the frame rather than above it also keeps a
              left-aligned video from pushing the editor sideways, and keeps
              the controls visible when the media is at the top of the
              document.
            */
            /*
              dir="ltr" on the control strip. These buttons mean physical
              left / centre / right, and a row inside an RTL document lays its
              children out right-to-left — so the icons appeared in the reverse
              of the order they act in. The document stays RTL; this one strip
              does not.
            */
            dir="ltr"
            className="absolute inset-x-0 top-2 z-20 mx-auto flex w-fit max-w-[calc(100%-1rem)] flex-wrap items-center justify-center gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur-sm"
          >
            <button
              type="button"
              title={labels?.videoMove}
              aria-label={labels?.videoMove}
              onPointerDown={(event) => beginReposition(event, thumbnailSrc)}
              className="cursor-grab rounded px-2 py-1 text-xs font-semibold tracking-[-0.16em] text-slate-600 hover:bg-slate-100 active:cursor-grabbing"
            >
              ⋮⋮
            </button>
            {(["left", "center", "right"] as const).map((option) => {
              const alignLabel =
                option === "left"
                  ? labels?.videoAlignLeft
                  : option === "right"
                    ? labels?.videoAlignRight
                    : labels?.videoAlignCenter;

              // Only lit when the video is on its own line; see the image node.
              const isActive = wrap === "none" && align === option;

              return (
                <button
                  key={option}
                  type="button"
                  title={alignLabel}
                  aria-label={alignLabel}
                  aria-pressed={isActive}
                  // Choosing an alignment turns wrapping off, and vice versa.
                  onClick={() =>
                    updateAttributes({ align: option, wrap: "none" })
                  }
                  className={`inline-flex size-8 items-center justify-center rounded ${
                    isActive ? "bg-[#714b67]/10 text-[#714b67]" : "hover:bg-slate-100"
                  }`}
                >
                  <EditorIcon
                    name={
                      option === "left"
                        ? "alignImageLeft"
                        : option === "right"
                          ? "alignImageRight"
                          : "alignImageCenter"
                    }
                  />
                </button>
              );
            })}
            <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />
            {/*
              Wrapping, kept separate from alignment. These float the media so
              text runs beside it; the three above place it on a line of its
              own. Pressing an active one turns wrapping back off.
            */}
            {(["left", "right"] as const).map((side) => {
              const wrapLabel =
                side === "left" ? labels?.wrapLeft : labels?.wrapRight;
              return (
                <button
                  key={`wrap-${side}`}
                  type="button"
                  title={wrapLabel}
                  aria-label={wrapLabel}
                  aria-pressed={wrap === side}
                  onClick={() =>
                    updateAttributes({ wrap: wrap === side ? "none" : side })
                  }
                  className={`inline-flex size-8 items-center justify-center rounded ${
                    wrap === side
                      ? "bg-[#714b67]/10 text-[#714b67]"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <EditorIcon
                    name={side === "left" ? "wrapTextLeft" : "wrapTextRight"}
                  />
                </button>
              );
            })}
            <button
              type="button"
              title={labels?.videoEditUrl}
              aria-label={labels?.videoEditUrl}
              onClick={() =>
                (extension.options as MediaNodeOptions).onEditVideo?.(
                  videoId,
                  (nextId) => updateAttributes({ videoId: nextId }),
                )
              }
              className="inline-flex size-8 items-center justify-center rounded hover:bg-slate-100"
            >
              <EditorIcon name="link" className="size-4" />
            </button>
            <MediaSizeMenu
              label={labels?.videoFullWidth}
              element={frameRef.current}
              onPick={(width) => updateAttributes({ width })}
            />
            <button
              type="button"
              title={labels?.videoDelete}
              aria-label={labels?.videoDelete}
              onClick={deleteNode}
              className="inline-flex size-8 items-center justify-center rounded text-sm font-bold text-red-700 hover:bg-red-50"
            >
              ×
            </button>
          </div>
        ) : null}

        {videoId ? (
          <div
            /*
              The preview is the video's drag handle. Without one, the only way
              to reposition a video was the grip in its floating toolbar, which
              you cannot reach until the node is already selected — so grabbing
              the video and moving it, the obvious gesture, did nothing.
            */
            className={`relative w-full overflow-hidden rounded-sm border-2 bg-slate-900 pt-[56.25%] transition ${
              editor.isEditable ? "cursor-grab active:cursor-grabbing" : ""
            } ${
              selected
                ? "border-[#2563eb] shadow-sm"
                : "border-transparent group-hover:border-amber-400"
            }`}
          >
            {/*
              A still, not a player. An iframe in the editor loads YouTube on
              every keystroke-triggered re-render, steals clicks meant for
              selecting the node, and lets a video start playing while someone
              is writing. The reader gets the real embed; the author gets a
              picture.
            */}
            <img
              src={thumbnailSrc ?? ""}
              alt=""
              loading="lazy"
              draggable={false}
              referrerPolicy="no-referrer"
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-black/70 text-white">
                {/*
                  Physical border sides. The triangle was built from
                  border-inline-start, which resolves to the right-hand edge in
                  Kurdish and Arabic — so the play symbol pointed backwards.
                  A play arrow is a picture, not text; it does not mirror.
                */}
                <span className="ml-1 border-y-8 border-l-[14px] border-y-transparent border-l-white" />
              </span>
            </span>
            {resizing && displayWidth ? (
              <span className="absolute bottom-2 end-2 rounded bg-slate-950/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                {displayWidth}px
              </span>
            ) : null}
          </div>
        ) : (
          <div className="rounded-sm border-2 border-dashed border-slate-300 p-4 text-xs text-slate-500">
            YouTube
          </div>
        )}

        {editor.isEditable
          ? (["bottom-left", "bottom-right"] as const).map((corner) => (
              // A 12px square is a hard target with a mouse and impossible with
              // a finger, so the square sits inside a padded, transparent hit
              // area three times its size.
              <span
                key={corner}
                contentEditable={false}
                role="presentation"
                onPointerDown={(event) => beginResize(event, corner)}
                style={{ cursor: cornerCursor[corner], touchAction: "none" }}
                className={`absolute z-10 flex size-9 items-center justify-center transition-opacity ${
                  corner === "bottom-left"
                    ? "-bottom-4 -left-4"
                    : "-bottom-4 -right-4"
                } ${
                  selected || resizing
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-3 border border-white bg-[#2563eb] shadow-sm"
                />
              </span>
            ))
          : null}
      </div>
      <RepositionOverlay state={repositioning} />
    </NodeViewWrapper>
  );
}

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

/**
 * Extracts a YouTube video id from whatever the author pasted.
 *
 * The id is stored, never the URL. A stored URL would be rendered into an
 * iframe src, which makes the document a place someone could put an arbitrary
 * embed; an 11-character id can only ever address YouTube.
 */
export function youtubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const param = parsed.searchParams.get("v");
      if (param && /^[\w-]{11}$/.test(param)) return param;

      const embedded = parsed.pathname.match(
        /^\/(?:embed|shorts|v)\/([\w-]{11})$/,
      );
      if (embedded) return embedded[1];
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Node views cannot reach the component's props, so the labels ride along as
 * extension options. Without this the floating toolbars inside the document
 * would be the only English left on an otherwise Kurdish page.
 */
interface MediaNodeOptions {
  labels: RichTextEditorLabels | null;
  /**
   * Opens the editor's URL dialog for an embed that already exists.
   *
   * The dialog lives in the editor component, not the node view, so the node
   * hands over the current id and a callback to write the new one back.
   */
  onEditVideo?: (currentVideoId: string, apply: (videoId: string) => void) => void;
}

const YoutubeEmbed = Node.create<MediaNodeOptions>({
  name: "youtubeEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addOptions() {
    return { labels: null };
  },
  addAttributes() {
    return {
      videoId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-video-id") ?? "",
        renderHTML: (attributes) => ({
          "data-video-id": String(attributes.videoId ?? ""),
        }),
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-width");
          const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
          return Number.isFinite(parsed) ? parsed : null;
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
      wrap: {
        default: "none",
        parseHTML: (element) => element.getAttribute("data-wrap") ?? "none",
        renderHTML: (attributes) => ({
          "data-wrap": String(attributes.wrap ?? "none"),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-odookrd-youtube="true"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-odookrd-youtube": "true" }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(YoutubeNodeView);
  },
});

const CALLOUT_VARIANTS = ["note", "warning", "tip"] as const;
type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

const Callout = Node.create({
  name: "callout",
  group: "block",
  // Not an atom: the body is editable content, which is what makes a callout
  // useful rather than a styled one-liner.
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-variant") ?? "note",
        renderHTML: (attributes) => ({
          "data-variant": String(attributes.variant ?? "note"),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-odookrd-callout="true"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-odookrd-callout": "true" }),
      0,
    ];
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
  toolbar,
}: RichTextEditorProps) {
  const imageUploadId = useId();
  const fileUploadId = useId();
  const commandInputId = useId();
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState<"image" | "file" | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [commandDialog, setCommandDialog] = useState<CommandDialog>(null);
  /** Set while the URL dialog is editing an existing embed rather than adding one. */
  const videoEditRef = useRef<((videoId: string) => void) | null>(null);
  const [height, setHeight] = useState(DEFAULT_EDITOR_HEIGHT);

  const editor = useEditor({
    immediatelyRender: false,
    /**
     * Tiptap 3 defaults this off, and with it off React only re-renders when
     * onChange lifts a new document into the parent. Moving the cursor into
     * bold text is a transaction but not a document change, so every
     * isActive() read in the toolbar stayed frozen at whatever it was when the
     * text last changed — no button ever lit up.
     */
    shouldRerenderOnTransaction: true,
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
      ResizableImage.configure({
        allowBase64: false,
        inline: false,
        labels,
      }),
      YoutubeEmbed.configure({
        labels,
        onEditVideo: (currentVideoId, apply) => {
          setEditorError(null);
          videoEditRef.current = apply;
          setCommandDialog({
            kind: "youtube",
            value: currentVideoId
              ? `https://www.youtube.com/watch?v=${currentVideoId}`
              : "",
          });
        },
      }),
      Callout,
      ...tableExtensions,
    ],
    content: normalizeValue(value),
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON()),
    editorProps: {
      attributes: {
        class: "px-4 py-3 text-sm leading-7 text-slate-800 outline-none",
        dir,
      },
      /**
       * Pasting a YouTube link becomes the video, not a line of URL text.
       * Only on an empty selection in an empty block: pasting a link into a
       * sentence means the author wants a link there.
       */
      /**
       * A click in the empty space beside a narrow image or video puts the
       * caret next to it instead of selecting it.
       *
       * The node's box already stops at the edge of the picture, but that is
       * not enough on its own: ProseMirror resolves a click to a document
       * position by coordinate, and the nearest position to the gutter is the
       * media block, so it selected it anyway. The giveaway is the event
       * target — a press on the picture lands on the node view, while a press
       * in the gutter lands on the editor surface itself.
       */
      handleClick: (view, pos, event) => {
        if (event.target !== view.dom) return false;

        const { state } = view;
        const node = state.doc.nodeAt(pos);
        if (!node || !GUTTER_SAFE_NODES.has(node.type.name)) return false;

        const below = pos + node.nodeSize;
        const selection = TextSelection.near(state.doc.resolve(below), 1);
        view.dispatch(state.tr.setSelection(selection).scrollIntoView());
        view.focus();
        return true;
      },

      handlePaste: (view, event) => {
        const pastedFile = event.clipboardData?.files?.[0];
        if (pastedFile?.type.startsWith("image/") && onUploadImage) {
          event.preventDefault();
          void uploadImage(pastedFile);
          return true;
        }

        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (!text || text.includes("\n")) return false;

        const videoId = youtubeVideoId(text);
        if (!videoId) return false;

        const { $from, empty } = view.state.selection;
        if (!empty || $from.parent.content.size > 0) return false;

        event.preventDefault();
        editorRef.current
          ?.chain()
          .focus()
          .insertContent({ type: "youtubeEmbed", attrs: { videoId } })
          .run();
        return true;
      },

      /** Dropping an image file uploads it instead of doing nothing. */
      /**
       * Uploads an image dropped in from outside — and gets out of the way of
       * one dragged from inside.
       *
       * `moved` is the whole point. Dragging an image within the editor makes
       * Chrome put that image into dataTransfer.files, so this handler saw a
       * dropped image file, claimed the event, and re-uploaded the picture the
       * author was merely trying to move. Repositioning silently stopped
       * working. ProseMirror already knows the difference; ask it.
       */
      handleDrop: (view, event, _slice, moved) => {
        if (moved || view.dragging) return false;

        const transfer = (event as DragEvent).dataTransfer;
        if (!transfer || !Array.from(transfer.types).includes("Files")) {
          return false;
        }

        const file = transfer.files?.[0];
        if (!file || !file.type.startsWith("image/") || !onUploadImage) {
          return false;
        }

        event.preventDefault();
        void uploadImage(file);
        return true;
      },
    },
  });

  const editorRef = useRef<typeof editor>(null);
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  /**
   * prosemirror-tables needs a handful of rules Tailwind cannot express — the
   * column resize handle and the selected-cell overlay are both pseudo-element
   * work on nodes ProseMirror owns. Injected once per document, keyed by id,
   * so a page with three editors still has one stylesheet.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(TABLE_STYLE_ELEMENT_ID)) return;

    const style = document.createElement("style");
    style.id = TABLE_STYLE_ELEMENT_ID;
    style.textContent = TABLE_STYLES;
    document.head.append(style);
  }, []);

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

  function beginHeightResize(event: ReactPointerEvent<HTMLDivElement>): void {
    if (fullscreen) return;
    event.preventDefault();

    const startY = event.clientY;
    const startHeight =
      scrollAreaRef.current?.getBoundingClientRect().height ?? height;

    const onMove = (moveEvent: PointerEvent): void => {
      setHeight(clampHeight(startHeight + (moveEvent.clientY - startY)));
    };

    const onUp = (): void => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

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

  function openYoutubeDialog(): void {
    if (!editor || disabled) return;
    setEditorError(null);
    // Inserting, not editing: make sure a stale edit callback from a previous
    // dialog cannot redirect this one into an existing embed.
    videoEditRef.current = null;
    setCommandDialog({ kind: "youtube", value: "" });
  }

  function toggleCallout(variant: CalloutVariant): void {
    if (!editor || disabled) return;

    // Already this kind: the button is a toggle, so unwrap.
    if (editor.isActive("callout", { variant })) {
      editor.chain().focus().lift("callout").run();
      return;
    }

    // Already a callout of another kind: change it in place. Wrapping again
    // would bury a warning inside a note rather than swapping the two.
    if (editor.isActive("callout")) {
      editor.chain().focus().updateAttributes("callout", { variant }).run();
      return;
    }

    editor.chain().focus().wrapIn("callout", { variant }).run();
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

    if (commandDialog.kind === "youtube") {
      const videoId = youtubeVideoId(commandDialog.value);

      if (!videoId) {
        setEditorError(labels.youtubeInvalid);
        return;
      }

      const editExisting = videoEditRef.current;
      if (editExisting) {
        editExisting(videoId);
        videoEditRef.current = null;
        setCommandDialog(null);
        return;
      }

      editor
        .chain()
        .focus()
        .insertContent({ type: "youtubeEmbed", attrs: { videoId } })
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

  /*
    Keyed on the document node, so it recomputes when the text changes and not
    when the cursor moves. The toolbar now re-renders on every transaction —
    that was needed to make the active states live — which turned this full
    document walk into something that ran on every arrow key.
  */
  const documentNode = editor?.state.doc;
  const counts = useMemo(() => {
    const text = editor?.getText({ blockSeparator: " " }) ?? "";
    const trimmed = text.trim();
    return {
      characters: `${text.length} ${labels.characters}`,
      words: `${trimmed ? trimmed.split(/\s+/u).length : 0} ${labels.words}`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentNode, labels.characters, labels.words]);

  const inTable = editor?.isActive("table") ?? false;

  /**
   * Each entry asks the editor whether it would succeed rather than assuming:
   * deleting a column is refused on a one-column table, and a menu item that
   * does nothing when clicked is worse than one that is grey.
   *
   * `can()` runs a dry-run transaction, and eleven of them on every render is
   * real work now that the toolbar re-renders per transaction — so outside a
   * table, where every answer is already known to be no, they are skipped.
   */
  const canInTable = (check: () => boolean): boolean =>
    inTable ? check() : false;
  const tableActions: ToolbarMenuAction[] = editor
    ? [
        {
          kind: "action",
          key: "insert",
          label: labels.tableInsert,
          disabled: disabled || inTable,
          onClick: () =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
        },
        { kind: "divider", key: "d1" },
        {
          kind: "action",
          key: "rowBefore",
          label: labels.tableAddRowBefore,
          disabled: disabled || !canInTable(() => editor.can().addRowBefore()),
          onClick: () => editor.chain().focus().addRowBefore().run(),
        },
        {
          kind: "action",
          key: "rowAfter",
          label: labels.tableAddRowAfter,
          disabled: disabled || !canInTable(() => editor.can().addRowAfter()),
          onClick: () => editor.chain().focus().addRowAfter().run(),
        },
        {
          kind: "action",
          key: "deleteRow",
          label: labels.tableDeleteRow,
          disabled: disabled || !canInTable(() => editor.can().deleteRow()),
          onClick: () => editor.chain().focus().deleteRow().run(),
        },
        { kind: "divider", key: "d2" },
        {
          kind: "action",
          key: "colBefore",
          label: labels.tableAddColumnBefore,
          disabled: disabled || !canInTable(() => editor.can().addColumnBefore()),
          onClick: () => editor.chain().focus().addColumnBefore().run(),
        },
        {
          kind: "action",
          key: "colAfter",
          label: labels.tableAddColumnAfter,
          disabled: disabled || !canInTable(() => editor.can().addColumnAfter()),
          onClick: () => editor.chain().focus().addColumnAfter().run(),
        },
        {
          kind: "action",
          key: "deleteCol",
          label: labels.tableDeleteColumn,
          disabled: disabled || !canInTable(() => editor.can().deleteColumn()),
          onClick: () => editor.chain().focus().deleteColumn().run(),
        },
        { kind: "divider", key: "d3" },
        {
          kind: "action",
          key: "headerRow",
          label: labels.tableToggleHeaderRow,
          disabled: disabled || !canInTable(() => editor.can().toggleHeaderRow()),
          onClick: () => editor.chain().focus().toggleHeaderRow().run(),
        },
        {
          kind: "action",
          key: "headerCol",
          label: labels.tableToggleHeaderColumn,
          disabled: disabled || !canInTable(() => editor.can().toggleHeaderColumn()),
          onClick: () => editor.chain().focus().toggleHeaderColumn().run(),
        },
        {
          kind: "action",
          key: "mergeSplit",
          label: labels.tableMergeOrSplit,
          disabled: disabled || !canInTable(() => editor.can().mergeOrSplit()),
          onClick: () => editor.chain().focus().mergeOrSplit().run(),
        },
        { kind: "divider", key: "d4" },
        {
          kind: "action",
          key: "deleteTable",
          label: labels.tableDelete,
          disabled: disabled || !canInTable(() => editor.can().deleteTable()),
          danger: true,
          onClick: () => editor.chain().focus().deleteTable().run(),
        },
      ]
    : [];

  /**
   * The toolbar, as data.
   *
   * Describing it rather than laying it out is what lets the bar collapse
   * groups into the overflow menu and lets a caller reorder or drop whole
   * groups without touching this file.
   */
  const toolbarGroups: ToolbarGroup[] = [
    {
      id: "blocks",
      label: labels.groupBlocks,
      items: [
        {
          kind: "button",
          key: "paragraph",
          label: labels.paragraph,
          icon: "paragraph",
          active: editor?.isActive("paragraph") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().setParagraph().run(),
        },
        ...([1, 2, 3] as const).map((level) => ({
          kind: "button" as const,
          key: `heading${level}`,
          label:
            level === 1
              ? labels.heading1
              : level === 2
                ? labels.heading2
                : labels.heading3,
          icon: `heading${level}` as EditorIconName,
          active: editor?.isActive("heading", { level }) ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleHeading({ level }).run(),
        })),
      ],
    },
    {
      id: "marks",
      label: labels.groupMarks,
      items: [
        {
          kind: "button",
          key: "bold",
          label: labels.bold,
          icon: "bold",
          active: editor?.isActive("bold") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleBold().run(),
        },
        {
          kind: "button",
          key: "italic",
          label: labels.italic,
          icon: "italic",
          active: editor?.isActive("italic") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleItalic().run(),
        },
        {
          kind: "button",
          key: "underline",
          label: labels.underline,
          icon: "underline",
          active: editor?.isActive("underline") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleUnderline().run(),
        },
        {
          kind: "button",
          key: "strike",
          label: labels.strike,
          icon: "strike",
          active: editor?.isActive("strike") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleStrike().run(),
        },
        {
          kind: "button",
          key: "clearFormatting",
          label: labels.clearFormatting,
          icon: "clearFormatting",
          disabled: !editor || disabled,
          onClick: () =>
            editor?.chain().focus().unsetAllMarks().clearNodes().run(),
        },
      ],
    },
    {
      id: "alignment",
      label: labels.groupAlignment,
      items: [
        ...(["left", "center", "right"] as const).map((alignment) => ({
          kind: "button" as const,
          key: `align-${alignment}`,
          label:
            alignment === "left"
              ? labels.alignLeft
              : alignment === "center"
                ? labels.alignCenter
                : labels.alignRight,
          icon: `align${alignment[0].toUpperCase()}${alignment.slice(1)}` as EditorIconName,
          active: isBlockAttributeActive("textAlign", alignment),
          disabled: !editor || disabled,
          onClick: () => updateBlockAttribute("textAlign", alignment),
        })),
        {
          kind: "button",
          key: "rtl",
          label: labels.directionRtl,
          icon: "rtl",
          active: isBlockAttributeActive("dir", "rtl"),
          disabled: !editor || disabled,
          onClick: toggleRtl,
        },
      ],
    },
    {
      id: "lists",
      label: labels.groupLists,
      items: [
        {
          kind: "button",
          key: "bulletList",
          label: labels.bulletList,
          icon: "bulletList",
          active: editor?.isActive("bulletList") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleBulletList().run(),
        },
        {
          kind: "button",
          key: "orderedList",
          label: labels.orderedList,
          icon: "orderedList",
          active: editor?.isActive("orderedList") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleOrderedList().run(),
        },
        {
          kind: "button",
          key: "indent",
          label: labels.indent,
          icon: "indent",
          disabled:
            !editor ||
            disabled ||
            !(editor?.can().sinkListItem("listItem") ?? false),
          onClick: () =>
            editor?.chain().focus().sinkListItem("listItem").run(),
        },
        {
          kind: "button",
          key: "outdent",
          label: labels.outdent,
          icon: "outdent",
          disabled:
            !editor ||
            disabled ||
            !(editor?.can().liftListItem("listItem") ?? false),
          onClick: () =>
            editor?.chain().focus().liftListItem("listItem").run(),
        },
      ],
    },
    {
      id: "insert",
      label: labels.groupInsert,
      items: [
        {
          kind: "button",
          key: "blockquote",
          label: labels.blockquote,
          icon: "blockquote",
          active: editor?.isActive("blockquote") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleBlockquote().run(),
        },
        {
          kind: "button",
          key: "codeBlock",
          label: labels.codeBlock,
          icon: "codeBlock",
          active: editor?.isActive("codeBlock") ?? false,
          disabled: !editor || disabled,
          onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
        },
        {
          kind: "button",
          key: "separator",
          label: labels.separator,
          icon: "separator",
          disabled: !editor || disabled,
          onClick: openSeparatorDialog,
        },
        {
          kind: "menu",
          key: "table",
          label: labels.table,
          icon: "table",
          active: inTable,
          disabled: !editor || disabled,
          actions: tableActions,
        },
      ],
    },
    {
      id: "callouts",
      label: labels.groupCallouts,
      items: CALLOUT_VARIANTS.map((variant) => ({
        kind: "button" as const,
        key: `callout-${variant}`,
        label:
          variant === "note"
            ? labels.calloutNote
            : variant === "warning"
              ? labels.calloutWarning
              : labels.calloutTip,
        icon: `callout${variant[0].toUpperCase()}${variant.slice(1)}` as EditorIconName,
        active: editor?.isActive("callout", { variant }) ?? false,
        disabled: !editor || disabled,
        onClick: () => toggleCallout(variant),
      })),
    },
    {
      id: "links",
      label: labels.groupLinks,
      items: [
        {
          kind: "button",
          key: "link",
          label: labels.link,
          icon: "link",
          active: editor?.isActive("link") ?? false,
          disabled: !editor || disabled,
          onClick: openLinkDialog,
        },
        {
          kind: "button",
          key: "unlink",
          label: labels.unlink,
          icon: "unlink",
          disabled:
            !editor || disabled || !(editor?.isActive("link") ?? false),
          onClick: removeLink,
        },
      ],
    },
    {
      id: "media",
      label: labels.groupMedia,
      items: [
        {
          kind: "button",
          key: "youtube",
          label: labels.youtube,
          icon: "youtube",
          disabled: !editor || disabled,
          onClick: openYoutubeDialog,
        },
        ...(onUploadImage
          ? [
              {
                kind: "button" as const,
                key: "image",
                label: labels.image,
                icon: "image" as EditorIconName,
                disabled: !editor || disabled || uploading !== null,
                onClick: () => imageUploadRef.current?.click(),
              },
            ]
          : []),
        ...(onUploadFile
          ? [
              {
                kind: "button" as const,
                key: "attachment",
                label: labels.attachment,
                icon: "attachment" as EditorIconName,
                disabled: !editor || disabled || uploading !== null,
                onClick: () => fileUploadRef.current?.click(),
              },
            ]
          : []),
      ],
    },
    {
      id: "history",
      label: labels.groupHistory,
      items: [
        {
          kind: "button",
          key: "undo",
          label: labels.undo,
          icon: "undo",
          disabled:
            !editor ||
            disabled ||
            !(editor?.can().chain().focus().undo().run() ?? false),
          onClick: () => editor?.chain().focus().undo().run(),
        },
        {
          kind: "button",
          key: "redo",
          label: labels.redo,
          icon: "redo",
          disabled:
            !editor ||
            disabled ||
            !(editor?.can().chain().focus().redo().run() ?? false),
          onClick: () => editor?.chain().focus().redo().run(),
        },
      ],
    },
  ];

  const editorShell = (
    <div
      dir={dir}
      // overflow-hidden only in fullscreen: outside it, the wrapper clipped the
      // growth from the scroll area's resize handle, so dragging did nothing.
      // min-w-0: as a grid or flex child the shell defaults to min-width:auto,
      // so it refuses to shrink below its content and widens the page instead
      // of letting the toolbar narrow. The bar can only collapse groups if it
      // is actually made narrower.
      className={`flex min-h-0 min-w-0 flex-col bg-white focus-within:border-[#714b67] focus-within:ring-2 focus-within:ring-[#714b67]/10 ${
        fullscreen ? "overflow-hidden" : ""
      } ${
        fullscreen
          ? "h-[100dvh] w-screen rounded-none border-0"
          : "rounded-lg border border-slate-300"
      }`}
    >
      <EditorToolbar
        dir={dir}
        groups={toolbarGroups}
        config={{
          compact: DEFAULT_COMPACT_GROUPS,
          ...toolbar,
        }}
        moreLabel={labels.more}
        trailing={
          <button
            type="button"
            title={fullscreen ? labels.exitFullscreen : labels.fullscreen}
            aria-label={fullscreen ? labels.exitFullscreen : labels.fullscreen}
            disabled={!editor}
            onClick={() => setFullscreen((current) => !current)}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <EditorIcon
              name={fullscreen ? "exitFullscreen" : "fullscreen"}
              className="size-5"
            />
          </button>
        }
      />

      {/*
        The upload inputs are not toolbar items — the toolbar describes
        buttons, and these are the file pickers those buttons click. Keeping
        them in the shell means a group can move into the overflow menu
        without taking its <input> along.
      */}
      {onUploadImage ? (
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
      ) : null}

      {onUploadFile ? (
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
      ) : null}

      {editorError ? (
        <p
          role="alert"
          className="shrink-0 border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {editorError}
        </p>
      ) : null}

      <div
        ref={scrollAreaRef}
        style={fullscreen ? undefined : { height: `${height}px` }}
        className={`relative cursor-text ${
          fullscreen ? "min-h-0 flex-1 overflow-y-auto" : "overflow-auto"
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

      {/*
        A real element rather than CSS `resize: vertical`. The scroll area's
        mousedown handler focuses the editor and calls preventDefault, and a
        press on the browser's own grip is a press on that same element — so
        the native drag was cancelled before it began. A grip we own is also
        the only way to put it somewhere predictable: the browser parks its
        resizer at the bottom-left in RTL and the bottom-right in LTR.
      */}
      {!fullscreen ? (
        <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-slate-50/80 px-3 py-1">
          {/*
            Each count is its own isolate. Run together in one RTL span, the
            bidi algorithm reorders the Latin runs against their numbers and
            "2 words · 12 characters" comes out as "words · 12 characters 2".
          */}
          <span className="flex items-center gap-1.5 text-[11px] tabular-nums text-slate-400">
            <bdi>{counts.words}</bdi>
            <span aria-hidden="true">·</span>
            <bdi>{counts.characters}</bdi>
          </span>
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label={labels.resizeEditor}
            title={labels.resizeEditor}
            tabIndex={0}
            onPointerDown={beginHeightResize}
            onDoubleClick={() => setHeight(DEFAULT_EDITOR_HEIGHT)}
            onKeyDown={(event) => {
              // Keyboard-only authors get the same control; a grip that only
              // answers to a pointer is a grip half the people cannot use.
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 32 : -32;
                setHeight((current) => clampHeight(current + step));
              }
              if (event.key === "Home") {
                event.preventDefault();
                setHeight(DEFAULT_EDITOR_HEIGHT);
              }
            }}
            className="group flex flex-1 cursor-ns-resize touch-none items-center justify-center rounded py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#714b67]/30"
          >
            <span
              aria-hidden="true"
              className="h-1 w-10 rounded-full bg-slate-300 transition group-hover:bg-slate-400 group-active:bg-[#714b67]"
            />
          </div>
          <bdi className="text-[11px] tabular-nums text-slate-400">
            {height}px
          </bdi>
        </div>
      ) : null}
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
            {commandDialog.kind === "link"
              ? labels.link
              : commandDialog.kind === "youtube"
                ? labels.youtube
                : labels.separator}
          </h3>
        </header>

        <div className="grid gap-2 px-5 py-5">
          <label
            htmlFor={commandInputId}
            className="text-sm font-medium text-slate-700"
          >
            {commandDialog.kind === "link"
              ? labels.linkPrompt
              : commandDialog.kind === "youtube"
                ? labels.youtubePrompt
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
