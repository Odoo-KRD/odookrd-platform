"use client";

import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Repositioning media by pointer, rather than via HTML5 drag-and-drop.
 *
 * The native path needs four things to line up at once: an element the browser
 * agrees is a drag source, a `data-drag-handle` where the library expects one,
 * a selection that already points at the node before `dragstart` fires, and a
 * drop handler that can tell an internal move from a dropped file. Each of
 * those is somewhere different — the browser, the node view, ProseMirror, our
 * own editor props — and getting three right still leaves an image that will
 * not move, with nothing to show for it.
 *
 * Pointer events have none of that surface. We know when the gesture starts,
 * where it is, and where it ends; the drop position is ProseMirror's own
 * posAtCoords; the move is one transaction. It also means the drag preview is
 * ours to size, which the browser's full-resolution clone never was.
 */

export interface RepositionTarget {
  /** Document position the node would be inserted at. */
  pos: number;
  /** Where to draw the insertion line, in viewport coordinates. */
  line: { top: number; left: number; width: number };
}

/**
 * Moves a node to another top-level position.
 *
 * Deleting first and mapping the target through that deletion is what keeps
 * the arithmetic honest: a target below the node shifts up by the node's size
 * once it is gone, and doing it in the other order silently lands the node one
 * block away from where it was dropped.
 */
export function moveNodeTo(editor: Editor, from: number, to: number): boolean {
  const { state } = editor.view;
  const node = state.doc.nodeAt(from);
  if (!node) return false;

  const end = from + node.nodeSize;
  // Dropping a node onto itself is a no-op, not a delete-and-reinsert.
  if (to >= from && to <= end) return false;

  const tr = state.tr.delete(from, end);
  const insertAt = tr.mapping.map(to, -1);
  tr.insert(insertAt, node);

  const selectionAt = Math.min(insertAt, tr.doc.content.size);
  try {
    tr.setSelection(NodeSelection.create(tr.doc, selectionAt));
  } catch {
    // A node that cannot carry a NodeSelection still moved; leave the
    // selection where ProseMirror put it rather than failing the whole move.
  }

  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

/**
 * Finds the block boundary nearest the pointer, and where to draw the line.
 *
 * Snapping to whole top-level blocks — rather than the raw text position under
 * the cursor — is what makes the gesture predictable: an image can only ever
 * land between two blocks, never inside a sentence.
 */
export function resolveRepositionTarget(
  editor: Editor,
  clientX: number,
  clientY: number,
): RepositionTarget | null {
  const { view } = editor;
  const coords = view.posAtCoords({ left: clientX, top: clientY });
  if (!coords) return null;

  const resolved = view.state.doc.resolve(coords.pos);
  if (resolved.depth < 1) {
    // Between top-level blocks already; fall back to the raw position.
    return null;
  }

  const blockStart = resolved.before(1);
  const blockNode = view.state.doc.nodeAt(blockStart);
  if (!blockNode) return null;

  const dom = view.nodeDOM(blockStart);
  if (!(dom instanceof HTMLElement)) return null;

  const rect = dom.getBoundingClientRect();
  const below = clientY > rect.top + rect.height / 2;

  return {
    pos: below ? blockStart + blockNode.nodeSize : blockStart,
    line: {
      top: below ? rect.bottom : rect.top,
      left: rect.left,
      width: rect.width,
    },
  };
}

export interface RepositionState {
  /** Pointer position, for the floating preview. */
  x: number;
  y: number;
  previewSrc: string | null;
  line: RepositionTarget["line"] | null;
}

/** Movement before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 5;

/**
 * The only parts of the press this needs.
 *
 * Structural rather than React's PointerEvent so the same handler can be
 * attached from a pointer, mouse, or synthetic event without the call site
 * having to match one exact React event class — which differs between
 * @types/react versions and between the elements it is attached to.
 */
export interface RepositionStartEvent {
  clientX: number;
  clientY: number;
  button: number;
}

export function useNodeReposition(
  editor: Editor,
  getPos: () => number | undefined,
) {
  const [state, setState] = useState<RepositionState | null>(null);
  const targetRef = useRef<number | null>(null);

  function beginReposition(
    event: RepositionStartEvent,
    previewSrc: string | null,
  ): void {
    if (!editor.isEditable || event.button !== 0) return;

    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    targetRef.current = null;

    const onMove = (moveEvent: PointerEvent): void => {
      if (!dragging) {
        const travelled = Math.hypot(
          moveEvent.clientX - startX,
          moveEvent.clientY - startY,
        );
        if (travelled < DRAG_THRESHOLD) return;
        dragging = true;
      }

      const target = resolveRepositionTarget(
        editor,
        moveEvent.clientX,
        moveEvent.clientY,
      );
      targetRef.current = target?.pos ?? null;
      setState({
        x: moveEvent.clientX,
        y: moveEvent.clientY,
        previewSrc,
        line: target?.line ?? null,
      });
    };

    const onUp = (): void => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

      const target = targetRef.current;
      targetRef.current = null;
      setState(null);

      const from = getPos();
      if (dragging && target !== null && typeof from === "number") {
        moveNodeTo(editor, from, target);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("pointercancel", onUp, { once: true });
  }

  return { repositioning: state, beginReposition };
}

/**
 * The floating preview and the insertion line.
 *
 * Deliberately small. The browser's own drag image is a full-resolution clone
 * of the element, which for a wide image covers the very document you are
 * trying to aim at — you end up dropping blind.
 */
export function RepositionOverlay({ state }: { state: RepositionState | null }) {
  if (!state || typeof document === "undefined") return null;

  return createPortal(
    <>
      {state.line ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: state.line.top - 1,
            left: state.line.left,
            width: state.line.width,
            height: 2,
          }}
          className="z-[140] rounded-full bg-[#714b67]"
        />
      ) : null}

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: state.y + 14,
          left: state.x + 14,
          maxWidth: 140,
        }}
        className="z-[140] overflow-hidden rounded border border-slate-300 bg-white/95 shadow-lg"
      >
        {state.previewSrc ? (
          <img
            src={state.previewSrc}
            alt=""
            draggable={false}
            className="block h-auto w-[140px] object-cover opacity-90"
          />
        ) : (
          <span className="block px-2 py-1 text-[11px] font-medium text-slate-600">
            …
          </span>
        )}
      </div>
    </>,
    document.body,
  );
}
