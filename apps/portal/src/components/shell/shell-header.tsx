"use client";

import type { CustomerNotification, Locale } from "@odookrd/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent,
} from "react";

import { markAllNotificationsReadAction } from "@/app/(protected)/(customer)/dashboard/notifications/actions";
import {
  AdminNavigation,
  type AdminNavigationEntry,
} from "@/components/admin/navigation";
import { NotificationMessageDialog } from "@/components/notifications/notification-message-dialog";
import { NotificationText } from "@/components/notifications/notification-text";
import { LanguageSelect } from "@/components/preferences/language-select";
import type { ShellHeaderLabels } from "@/lib/i18n/shell/header";
import { plural } from "@/lib/i18n/plural";
import { unreadPhrase } from "@/lib/i18n/shared/plurals";

/** One entry of the account (avatar) menu. */
export interface ShellHeaderAccountLink {
  href: string;
  label: string;
  /** The first entry is rendered in the stronger "current account" style. */
  emphasis?: boolean;
}

interface ShellHeaderProps {
  siteTitle: string;
  /** Small label above the workspace name, e.g. "Customer Portal". */
  workspaceLabel: string;
  /** Second line in the brand block, e.g. the company name. */
  workspaceName: string | null;
  navigationLabel: string;
  navigation: AdminNavigationEntry[];
  locale: Locale;
  languageLabel: string;
  labels: ShellHeaderLabels;
  email: string;
  displayName: string | null;
  unreadCount: number;
  notifications: CustomerNotification[];
  notificationsHref: string;
  accountLinks: ShellHeaderAccountLink[];
  hasAvatar?: boolean;
  avatarFileAssetId?: string | null;
  canNotifications?: boolean;
}

function identityLabel(displayName: string | null, email: string): string {
  return displayName?.trim() || email.split("@")[0] || "User";
}

function initials(displayName: string | null, email: string): string {
  const source = identityLabel(displayName, email);
  const parts = source.split(/\s+/).filter(Boolean);
  return (
    parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)
  ).toUpperCase();
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

function Avatar({
  displayName,
  email,
  hasAvatar,
  avatarFileAssetId,
  size = "md",
}: {
  displayName: string | null;
  email: string;
  hasAvatar: boolean;
  avatarFileAssetId: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const className =
    size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-10";

  if (hasAvatar) {
    const version = avatarFileAssetId
      ? `?v=${encodeURIComponent(avatarFileAssetId)}`
      : "";

    return (
      <Image
        src={`/api/workspace/profile/avatar${version}`}
        alt=""
        width={48}
        height={48}
        unoptimized
        className={`${className} shrink-0 rounded-full border border-line object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand`}
    >
      {initials(displayName, email)}
    </span>
  );
}

export function ShellHeader({
  siteTitle,
  workspaceLabel,
  workspaceName,
  navigationLabel,
  navigation,
  locale,
  languageLabel,
  labels,
  email,
  displayName,
  unreadCount,
  notifications,
  notificationsHref,
  accountLinks,
  hasAvatar = false,
  avatarFileAssetId = null,
  canNotifications = false,
}: ShellHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menus = useDismissibleHeaderMenus(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openedNotification, setOpenedNotification] =
    useState<CustomerNotification | null>(null);
  const badge = unreadCount > 99 ? "99+" : String(unreadCount);
  const identityName = identityLabel(displayName, email);
  const userInitials = useMemo(
    () => initials(displayName, email),
    [displayName, email],
  );

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  async function logout(): Promise<void> {
    if (loggingOut) return;
    menus.closeAll();
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.replace("/login");
        router.refresh();
      }
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="customer-shell-header relative z-40 shrink-0 border-b border-line bg-surface-panel px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={labels.openNavigation}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line text-content hover:bg-surface-subtle lg:hidden"
            >
              <MenuIcon />
            </button>

            {/* OdooKRD brand mark */}
            <Image
              src="/brand/odookrd-logo.svg"
              alt="OdooKRD"
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-lg border border-line bg-white object-contain"
            />

            <div className="min-w-0 lg:hidden">
              <p className="truncate text-sm font-semibold text-content">
                {siteTitle}
              </p>
              <p className="truncate text-xs text-muted">{workspaceLabel}</p>
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {workspaceLabel}
              </p>
              {workspaceName ? (
                <p className="mt-0.5 truncate text-sm font-semibold text-content text-start min-w-0 break-words">
                  <bdi dir="auto">{workspaceName}</bdi>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden lg:block">
              <LanguageSelect locale={locale} label={languageLabel} compact />
            </div>

            {canNotifications ? (
              <details
                ref={menus.ref(0)}
                open={menus.openMenu === 0}
                onToggle={menus.onToggle}
                onClickCapture={menus.onActionClick}
                className="group relative"
              >
                <summary
                  aria-label={labels.notifications}
                  className="relative flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-line bg-white text-muted transition hover:bg-surface-subtle hover:text-content [&::-webkit-details-marker]:hidden"
                >
                  <BellIcon />
                  {unreadCount > 0 ? (
                    <span className="absolute -end-1.5 -top-1.5 min-w-5 rounded-full bg-brand px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">
                      {badge}
                    </span>
                  ) : null}
                </summary>

                <div className="absolute end-0 top-[calc(100%+0.65rem)] z-50 w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                  <div className="border-b border-line px-4 py-3.5">
                    <p className="text-sm font-semibold text-content">
                      {labels.recentNotifications}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {plural(unreadPhrase, locale, unreadCount)}
                    </p>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="px-4 py-7 text-center text-sm text-muted">
                      {labels.noNotifications}
                    </p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className="border-b border-line px-4 py-3.5 last:border-b-0"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                item.readAt ? "bg-slate-200" : "bg-brand"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => {
                                  menus.closeAll();
                                  setOpenedNotification(item);
                                }}
                                className="w-full text-start hover:text-brand"
                              >
                                {/* The weight sits on a span, not the button:
                                    an unlayered "button { font: inherit }" rule
                                    in globals.css overrides Tailwind font
                                    classes placed on the button itself. Unread
                                    titles are bold, read ones medium. */}
                                <span
                                  className={`line-clamp-1 text-sm ${
                                    item.readAt
                                      ? "font-medium text-muted"
                                      : "font-bold text-content"
                                  }`}
                                >
                                  {item.title}
                                </span>
                              </button>
                              {/* Opening the message marks it read, so the
                                  row needs no separate "mark as read" button. */}
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                                <NotificationText text={item.body} />
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* One undivided row: both actions sit together with a
                      gap, and "mark all" only appears when something is
                      unread. whitespace-nowrap keeps each label on one line. */}
                  <div className="flex h-12 items-center justify-center gap-6 border-t border-line px-4">
                    <Link
                      href={notificationsHref}
                      className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-semibold text-brand hover:bg-surface-subtle"
                    >
                      {labels.viewAll}
                    </Link>
                    {unreadCount > 0 ? (
                      <form action={markAllNotificationsReadAction}>
                        <button
                          type="submit"
                          className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-semibold text-brand hover:bg-surface-subtle"
                        >
                          {labels.markAllRead}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </details>
            ) : null}

            {canNotifications ? (
              <NotificationMessageDialog
                notification={openedNotification}
                locale={locale}
                labels={labels}
                onClose={() => setOpenedNotification(null)}
              />
            ) : null}

            <details
              ref={menus.ref(1)}
              open={menus.openMenu === 1}
              onToggle={menus.onToggle}
              onClickCapture={menus.onActionClick}
              className="group relative"
            >
              <summary
                aria-label={labels.accountMenu}
                className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-transparent p-1.5 transition hover:border-line hover:bg-surface-subtle [&::-webkit-details-marker]:hidden"
              >
                <Avatar
                  displayName={displayName}
                  email={email}
                  hasAvatar={hasAvatar}
                  avatarFileAssetId={avatarFileAssetId}
                />
                <span className="hidden max-w-44 min-w-0 text-start sm:block">
                  <span className="block truncate text-sm font-semibold text-content text-start min-w-0 break-words">
                    <bdi dir="auto">{identityName}</bdi>
                  </span>
                  {workspaceName ? (
                    <span className="block truncate text-xs text-muted text-start min-w-0 break-words">
                      <bdi dir="auto">{workspaceName}</bdi>
                    </span>
                  ) : null}
                </span>
                <span className="hidden text-muted sm:block">
                  <ChevronIcon />
                </span>
              </summary>

              <div className="absolute end-0 top-[calc(100%+0.65rem)] z-50 w-[min(92vw,19rem)] overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                <div className="flex items-center gap-3 border-b border-line px-4 py-4">
                  {hasAvatar ? (
                    <Avatar
                      displayName={displayName}
                      email={email}
                      hasAvatar
                      avatarFileAssetId={avatarFileAssetId}
                      size="lg"
                    />
                  ) : (
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                      {userInitials}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-content text-start min-w-0 break-words">
                      <bdi dir="auto">{identityName}</bdi>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted text-start min-w-0 break-words">
                      <bdi dir="ltr">{email}</bdi>
                    </p>
                    {workspaceName ? (
                      <p className="mt-0.5 truncate text-xs text-muted text-start min-w-0 break-words">
                        <bdi dir="auto">{workspaceName}</bdi>
                      </p>
                    ) : null}
                  </div>
                </div>

                <nav className="grid p-2 text-sm">
                  {accountLinks.map((link, index) => (
                    <Link
                      key={`${link.href}:${link.label}`}
                      href={link.href}
                      className={
                        link.emphasis ?? index === 0
                          ? "rounded-md px-3 py-2.5 font-medium text-content hover:bg-surface-subtle"
                          : "rounded-md px-3 py-2.5 text-muted hover:bg-surface-subtle hover:text-content"
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="border-t border-line p-2">
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={() => void logout()}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-start text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {loggingOut ? labels.loggingOut : labels.logout}
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={navigationLabel}
        >
          <button
            type="button"
            aria-label={labels.closeNavigation}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
          />
          <aside className="absolute inset-y-0 start-0 flex w-[min(88vw,22rem)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-content">
                  {siteTitle}
                </p>
                <p className="truncate text-xs text-muted">{workspaceLabel}</p>
              </div>
              <button
                type="button"
                aria-label={labels.closeNavigation}
                onClick={() => setDrawerOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface-subtle hover:text-content"
              >
                <CloseIcon />
              </button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
              onClickCapture={(event) => {
                const target = event.target;
                if (target instanceof Element && target.closest("a")) {
                  setDrawerOpen(false);
                }
              }}
            >
              <AdminNavigation label={navigationLabel} entries={navigation} />
            </div>
            <div className="border-t border-line px-4 py-4 lg:hidden">
              <LanguageSelect locale={locale} label={languageLabel} />
            </div>
            <div className="flex items-center gap-3 border-t border-line px-4 py-4">
              <Avatar
                displayName={displayName}
                email={email}
                hasAvatar={hasAvatar}
                avatarFileAssetId={avatarFileAssetId}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-content text-start min-w-0 break-words">
                  <bdi dir="auto">{identityName}</bdi>
                </p>
                {workspaceName ? (
                  <p className="truncate text-xs text-muted text-start min-w-0 break-words">
                    <bdi dir="auto">{workspaceName}</bdi>
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function useDismissibleHeaderMenus(pathname: string | null) {
  const refs = useRef<[HTMLDetailsElement | null, HTMLDetailsElement | null]>([
    null,
    null,
  ]);

  const [menuState, setMenuState] = useState<{
    pathname: string | null;
    open: 0 | 1 | null;
  }>({ pathname, open: null });

  // A route change closes the menus without an effect-driven state update.
  const openMenu = menuState.pathname === pathname ? menuState.open : null;

  const closeAll = useCallback(() => {
    setMenuState({ pathname, open: null });
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (refs.current.some((menu) => menu?.contains(target))) return;
      closeAll();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const active = refs.current.find((menu) => menu?.open);
      if (!active) return;
      closeAll();
      active.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeAll]);

  const ref = useCallback(
    (index: 0 | 1) => (node: HTMLDetailsElement | null) => {
      refs.current[index] = node;
    },
    [],
  );

  const onToggle = useCallback(
    (event: SyntheticEvent<HTMLDetailsElement>) => {
      const active = event.currentTarget;
      const index: 0 | 1 | null =
        refs.current[0] === active ? 0 : refs.current[1] === active ? 1 : null;

      if (index === null) return;

      const isOpen = active.open;
      setMenuState((previous) => {
        const current = previous.pathname === pathname ? previous.open : null;
        const next = isOpen ? index : current === index ? null : current;

        if (previous.pathname === pathname && previous.open === next) {
          return previous;
        }

        return { pathname, open: next };
      });
    },
    [pathname],
  );

  const onActionClick = useCallback(
    (event: ReactMouseEvent<HTMLDetailsElement>) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('a[href], button[type="submit"]')
      ) {
        closeAll();
      }
    },
    [closeAll],
  );

  return { ref, openMenu, onToggle, onActionClick, closeAll };
}

// data-odookrd-directional-values: isolated profile values.
