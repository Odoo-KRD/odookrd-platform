"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  AdminActionIcon,
  type AdminActionIconName,
} from "@/components/admin/admin-action-icons";

export type AdminActionMenuTone = "default" | "warning" | "danger";

export interface AdminActionMenuItem {
  key: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  tone?: AdminActionMenuTone;
  icon?: AdminActionIconName;
  separatorBefore?: boolean;
}

interface AdminActionMenuProps {
  label: string;
  items: readonly AdminActionMenuItem[];
}

function itemClassName(tone: AdminActionMenuTone): string {
  const base =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm font-medium transition";

  if (tone === "danger") {
    return `${base} text-red-700 hover:bg-red-50 focus:bg-red-50 focus:outline-none`;
  }

  if (tone === "warning") {
    return `${base} text-amber-800 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none`;
  }

  return `${base} text-content hover:bg-surface-subtle focus:bg-surface-subtle focus:outline-none`;
}

export function AdminActionMenu({ label, items }: AdminActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  function openMenu(): void {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 224;
    const viewportPadding = 12;
    const direction = window.getComputedStyle(button).direction;
    const preferredLeft =
      direction === "rtl" ? rect.left : rect.right - menuWidth;

    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      Math.max(
        viewportPadding,
        window.innerWidth - menuWidth - viewportPadding,
      ),
    );

    setPosition({
      top: rect.bottom + 6,
      left,
    });
    setOpen(true);
  }

  function closeMenu(): void {
    setOpen(false);
    setPosition(null);
  }

  useEffect(() => {
    if (!open) return;

    const first = menuRef.current?.querySelector<HTMLElement>(
      "[data-admin-action-menu-item]",
    );
    first?.focus();

    function onPointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    }

    function onViewportChange(): void {
      closeMenu();
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const elements = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        "[data-admin-action-menu-item]",
      ) ?? [],
    );

    if (elements.length === 0) return;

    const currentIndex = elements.findIndex(
      (element) => element === document.activeElement,
    );

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      buttonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      elements[(currentIndex + 1 + elements.length) % elements.length]?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      elements[(currentIndex - 1 + elements.length) % elements.length]?.focus();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      elements[0]?.focus();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      elements[elements.length - 1]?.focus();
    }
  }

  const menu: ReactNode =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            className="fixed z-[1000] w-56 rounded-lg border border-line bg-white p-1.5 shadow-xl"
            style={{ top: position.top, left: position.left }}
          >
            {items.map((item) => {
              const content = (
                <>
                  {item.icon ? (
                    <AdminActionIcon name={item.icon} className="size-4" />
                  ) : null}
                  <span>{item.label}</span>
                </>
              );

              return (
                <div
                  key={item.key}
                  className={
                    item.separatorBefore
                      ? "mt-1 border-t border-line pt-1"
                      : undefined
                  }
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      role="menuitem"
                      data-admin-action-menu-item
                      className={itemClassName(item.tone ?? "default")}
                      onClick={closeMenu}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      data-admin-action-menu-item
                      className={itemClassName(item.tone ?? "default")}
                      onClick={() => {
                        closeMenu();
                        item.onSelect?.();
                      }}
                    >
                      {content}
                    </button>
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-content transition hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          ⋮
        </span>
      </button>

      {menu}
    </>
  );
}
