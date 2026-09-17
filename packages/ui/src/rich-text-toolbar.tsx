"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { EditorIcon, type EditorIconName } from "./editor-icons";

/**
 * The editor toolbar, as groups that collapse into a "more" menu.
 *
 * Wrapping was the other option and it loses. The toolbar sits directly above
 * a surface whose height the author controls with the grip; a toolbar that
 * grows a second row pushes that surface down and moves the line someone is
 * reading. A fixed-height bar with an overflow menu keeps the writing area
 * still, which is the thing that actually matters here.
 *
 * Groups never split. Half of "align" in the bar and half in the menu is worse
 * than all of it in either place.
 */

export type EditorToolbarGroupId =
  | "history"
  | "blocks"
  | "marks"
  | "alignment"
  | "lists"
  | "insert"
  | "callouts"
  | "links"
  | "media";

export interface RichTextToolbarConfig {
  /**
   * Which groups to render, in order.
   *
   * The order is also the priority: groups collapse into the overflow menu
   * from the end, so put what matters most first. Omit for every group.
   */
  groups?: EditorToolbarGroupId[];
  /**
   * Groups that keep their place in the bar when space runs short.
   *
   * Everything else is offered to the overflow menu first, regardless of
   * position. Use this for the handful of controls that should stay one click
   * away on a narrow editor.
   */
  compact?: EditorToolbarGroupId[];
}

export interface ToolbarButtonItem {
  kind: "button";
  key: string;
  label: string;
  icon?: EditorIconName;
  /** Shown when no icon exists for this action yet. */
  glyph?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export type ToolbarMenuAction =
  | { kind: "divider"; key: string }
  | {
      kind: "action";
      key: string;
      label: string;
      disabled?: boolean;
      danger?: boolean;
      onClick: () => void;
    };

export interface ToolbarMenuItem {
  kind: "menu";
  key: string;
  label: string;
  icon?: EditorIconName;
  glyph?: string;
  active?: boolean;
  disabled?: boolean;
  actions: ToolbarMenuAction[];
}

export type ToolbarItem = ToolbarButtonItem | ToolbarMenuItem;

export interface ToolbarGroup {
  id: EditorToolbarGroupId;
  /** Used as the section heading in the overflow menu. */
  label: string;
  items: ToolbarItem[];
}

const buttonBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-1.5 transition disabled:cursor-not-allowed disabled:opacity-40";

function itemClassName(active: boolean | undefined): string {
  return `${buttonBase} ${
    active
      ? "border-[#714b67]/35 bg-[#714b67]/10 text-[#714b67]"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;
}

function ItemGlyph({ item }: { item: ToolbarItem }): ReactNode {
  if (item.icon) return <EditorIcon name={item.icon} className="size-5" />;
  return <span className="text-[11px] font-semibold">{item.glyph ?? "?"}</span>;
}

/** Closes a popover on any press outside it, or on Escape. */
function useDismiss(
  open: boolean,
  close: () => void,
  anchorRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (
        target instanceof globalThis.Node &&
        (anchorRef.current?.contains(target) ||
          menuRef.current?.contains(target))
      ) {
        return;
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, close, menuRef, open]);
}

interface PopoverPosition {
  top: number;
  left: number;
}

/**
 * Positions a menu against its trigger, for rendering in a portal.
 *
 * The menus cannot live inside the bar. The bar has to clip its contents —
 * that is how a group disappears instead of pushing the toolbar wider — and an
 * absolutely positioned dropdown inside a clipping ancestor is clipped along
 * with everything else. The table menu was opening correctly the whole time
 * and being cut to nothing. A portal escapes the clip; the trade is having to
 * place it by hand.
 */
function useAnchoredPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  width: number,
  dir: "ltr" | "rtl",
): PopoverPosition | null {
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const place = (): void => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();

      // Hangs from the trigger's leading edge, then is pulled back inside the
      // viewport rather than allowed to run off it.
      const preferred = dir === "rtl" ? rect.right - width : rect.left;
      const left = Math.max(
        8,
        Math.min(preferred, window.innerWidth - width - 8),
      );

      setPosition({ top: rect.bottom + 6, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, dir, open, width]);

  return position;
}

function MenuActions({
  actions,
  onDone,
  dir,
  className,
}: {
  actions: ToolbarMenuAction[];
  onDone: () => void;
  dir: "ltr" | "rtl";
  className: string;
}) {
  return (
    <div role="menu" dir={dir} className={className}>
      {actions.map((action) =>
        action.kind === "divider" ? (
          <span
            key={action.key}
            role="separator"
            className="my-0.5 h-px bg-slate-200"
          />
        ) : (
          <button
            key={action.key}
            type="button"
            role="menuitem"
            disabled={action.disabled}
            onClick={() => {
              action.onClick();
              onDone();
            }}
            className={`rounded px-2.5 py-1.5 text-start text-xs font-medium ${
              action.danger
                ? "text-red-700 hover:bg-red-50"
                : "text-slate-700 hover:bg-slate-100"
            } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
          >
            {action.label}
          </button>
        ),
      )}
    </div>
  );
}

const MENU_WIDTH = 224;
const OVERFLOW_MENU_WIDTH = 256;

function ToolbarMenuButton({
  item,
  dir,
}: {
  item: ToolbarMenuItem;
  dir: "ltr" | "rtl";
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, anchorRef, menuRef);
  const position = useAnchoredPosition(open, anchorRef, MENU_WIDTH, dir);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        title={item.label}
        aria-label={item.label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={item.disabled}
        onClick={() => setOpen((current) => !current)}
        className={itemClassName(item.active || open)}
      >
        <ItemGlyph item={item} />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: MENU_WIDTH,
              }}
              className="z-[130]"
            >
              <MenuActions
                actions={item.actions}
                dir={dir}
                onDone={close}
                className="grid gap-0.5 rounded-md border border-slate-200 bg-white p-1 shadow-xl"
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ToolbarItemButton({
  item,
  dir,
}: {
  item: ToolbarItem;
  dir: "ltr" | "rtl";
}) {
  if (item.kind === "menu") return <ToolbarMenuButton item={item} dir={dir} />;

  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      aria-pressed={item.active}
      disabled={item.disabled}
      onClick={item.onClick}
      className={itemClassName(item.active)}
    >
      <ItemGlyph item={item} />
    </button>
  );
}

export function EditorToolbar({
  groups,
  dir,
  moreLabel,
  config,
  trailing,
}: {
  groups: ToolbarGroup[];
  dir: "ltr" | "rtl";
  moreLabel: string;
  config?: RichTextToolbarConfig;
  /** Rendered at the far end of the bar and never collapsed. */
  trailing?: ReactNode;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moreSlotRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  const [hiddenIds, setHiddenIds] = useState<EditorToolbarGroupId[]>([]);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const closeOverflow = useCallback(() => setOverflowOpen(false), []);
  useDismiss(overflowOpen, closeOverflow, moreButtonRef, overflowMenuRef);
  const overflowPosition = useAnchoredPosition(
    overflowOpen,
    moreButtonRef,
    OVERFLOW_MENU_WIDTH,
    dir,
  );

  const selected = config?.groups
    ? config.groups
        .map((id) => groups.find((group) => group.id === id))
        .filter((group): group is ToolbarGroup => Boolean(group))
    : groups;

  const compact = config?.compact;
  const signature = selected.map((group) => group.id).join(",");
  const compactKey = compact ? compact.join(",") : "";

  /**
   * Asks the browser what overflows instead of recomputing it.
   *
   * Earlier versions measured every group and did the arithmetic by hand, and
   * kept getting it wrong for boring reasons: a hidden element measures zero,
   * gaps and sub-pixel rounding do not add up the way you expect, and each fix
   * needed another correction factor. scrollWidth against clientWidth is the
   * same question with none of the bookkeeping — hide a group, ask again, stop
   * when it fits.
   */
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const measure = (): void => {
      const nodes = groupRefs.current.slice(0, selected.length);
      const moreSlot = moreSlotRef.current;

      for (const node of nodes) {
        if (node) node.style.display = "flex";
      }
      if (moreSlot) moreSlot.style.display = "none";

      // A pixel of slack: browsers report fractional widths, and an exact
      // comparison makes the bar flicker between two states.
      const overflowing = (): boolean => bar.scrollWidth > bar.clientWidth + 1;

      const hidden: EditorToolbarGroupId[] = [];

      if (overflowing()) {
        // The button sits outside the bar, so revealing it narrows the bar. It
        // has to be in place before anything is measured against it.
        if (moreSlot) moreSlot.style.display = "block";

        const pinned = (index: number): boolean =>
          Boolean(compact?.includes(selected[index].id));
        const indexes = selected.map((_, index) => index);

        // Lowest priority first: unpinned groups from the end, and only then
        // the pinned ones, so a narrow editor sheds "media" long before it
        // gives up "marks".
        const order = [
          ...indexes.filter((index) => !pinned(index)).reverse(),
          ...indexes.filter((index) => pinned(index)).reverse(),
        ];

        for (const index of order) {
          if (!overflowing()) break;
          const node = nodes[index];
          if (!node) continue;
          node.style.display = "none";
          hidden.push(selected[index].id);
        }
      }

      // The leading rule belongs to the group after it, so whichever group is
      // now first in the bar must not draw one.
      let seenVisible = false;
      for (const node of nodes) {
        if (!node) continue;
        const rule = node.querySelector<HTMLElement>("[data-group-rule]");
        if (rule) rule.style.display = seenVisible ? "block" : "none";
        if (node.style.display !== "none") seenVisible = true;
      }

      setHiddenIds((current) =>
        current.length === hidden.length &&
        current.every((id, index) => id === hidden[index])
          ? current
          : hidden,
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    // Also the row around it: when an ancestor stops constraining the toolbar,
    // the bar's own box can stay put while everything around it moves.
    if (bar.parentElement) observer.observe(bar.parentElement);

    return () => observer.disconnect();
    // Group composition, not array identity: `selected` is rebuilt on every
    // render, and depending on it would tear the observer down each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, compactKey]);

  const hiddenGroups = selected.filter((group) => hiddenIds.includes(group.id));

  return (
    <div
      dir={dir}
      className="flex w-full min-w-0 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-2.5 py-2"
    >
      <div
        ref={barRef}
        className="flex min-w-0 flex-1 items-center overflow-hidden"
      >
        {selected.map((group, index) => (
          <div
            key={group.id}
            ref={(element) => {
              groupRefs.current[index] = element;
            }}
            role="group"
            aria-label={group.label}
            className="flex shrink-0 items-center gap-1"
          >
            {/*
              Each group carries the rule that precedes it, so a group moving
              into the overflow menu takes its divider with it and never
              strands one against the edge of the bar.

              ms-2 against me-1 looks lopsided and is not: the group's own
              gap-1 adds four more pixels on the trailing side, so the rule
              ends up with eight on each.
            */}
            <span
              data-group-rule
              aria-hidden="true"
              className="ms-2 me-1 h-6 w-px shrink-0 bg-slate-300"
              style={{ display: index === 0 ? "none" : "block" }}
            />
            {group.items.map((item) => (
              <ToolbarItemButton key={item.key} item={item} dir={dir} />
            ))}
          </div>
        ))}
      </div>

      {/*
        Always mounted, shown or hidden by the measuring pass. Mounting it from
        state would mean the bar is measured without it and then narrowed by
        its arrival, which is how you get a toolbar that oscillates.
      */}
      <div ref={moreSlotRef} className="shrink-0" style={{ display: "none" }}>
        <button
          ref={moreButtonRef}
          type="button"
          title={moreLabel}
          aria-label={moreLabel}
          aria-haspopup="menu"
          aria-expanded={overflowOpen}
          onClick={() => setOverflowOpen((current) => !current)}
          className={itemClassName(overflowOpen)}
        >
          <span className="text-sm font-bold leading-none">···</span>
        </button>
      </div>

      {overflowOpen &&
      overflowPosition &&
      hiddenGroups.length > 0 &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              ref={overflowMenuRef}
              dir={dir}
              style={{
                position: "fixed",
                top: overflowPosition.top,
                left: overflowPosition.left,
                width: OVERFLOW_MENU_WIDTH,
              }}
              className="z-[130] grid max-h-[60vh] gap-3 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-xl"
            >
              {hiddenGroups.map((group) => (
                <div key={group.id} className="grid gap-1">
                  <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    {group.label}
                  </span>
                  <div className="grid gap-0.5">
                    {group.items.map((item) =>
                      item.kind === "menu" ? (
                        <MenuActions
                          key={item.key}
                          actions={item.actions}
                          dir={dir}
                          onDone={closeOverflow}
                          className="grid gap-0.5"
                        />
                      ) : (
                        <button
                          key={item.key}
                          type="button"
                          role="menuitem"
                          disabled={item.disabled}
                          onClick={() => {
                            item.onClick();
                            closeOverflow();
                          }}
                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-start text-xs font-medium ${
                            item.active
                              ? "bg-[#714b67]/10 text-[#714b67]"
                              : "text-slate-700 hover:bg-slate-100"
                          } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
                        >
                          <ItemGlyph item={item} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
