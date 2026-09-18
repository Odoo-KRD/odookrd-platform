import type { KnowledgeCategoryNode } from "@odookrd/types";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CustomerShellHeader } from "@/components/customer/customer-shell-header";
import { KnowledgeSearchBox } from "@/components/knowledge/knowledge-search-box";
import { KnowledgeTree } from "@/components/knowledge/knowledge-tree";
import { apiRequest } from "@/lib/api";
import { getCustomerShell } from "@/lib/customer-shell";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeDictionaries } from "@/lib/i18n/knowledge";
import { getPublicSettings } from "@/lib/public-settings";
import { getSessionToken } from "@/lib/session";

/**
 * The knowledge base is a dashboard section, not a separate application: it
 * keeps the portal header, and mirrors the admin sidebar's structure so the two
 * read as the same product. Only the sidebar's contents differ -- a three-level
 * category tree in place of the portal navigation.
 *
 * The header sits inside the content column, beside the sidebar rather than
 * above it, exactly as the customer layout arranges them.
 *
 * Platform admins can read the knowledge base but have no customer shell, so
 * they get a slim header instead.
 */
export default async function KnowledgeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [shell, { locale }, publicSettings, token] = await Promise.all([
    getCustomerShell(),
    getDictionary(),
    getPublicSettings(),
    getSessionToken(),
  ]);

  if (!token) {
    redirect("/login");
  }

  const labels = knowledgeDictionaries[locale];
  const categories = await apiRequest<KnowledgeCategoryNode[]>(
    "/knowledge/categories",
    { token },
  ).catch(() => [] as KnowledgeCategoryNode[]);

  const portalHref = shell ? "/dashboard" : "/admin";
  const siteInitial =
    publicSettings.siteTitle.trim().charAt(0).toUpperCase() || "O";

  return (
    <div className="min-h-screen bg-surface-page lg:flex lg:h-screen lg:overflow-hidden">
      <aside className="app-shell-sidebar hidden h-screen w-72 shrink-0 flex-col overflow-hidden border-e border-line bg-surface-panel lg:flex">
        <div className="shrink-0 border-b border-line px-4 py-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand text-base font-bold text-white"
            >
              {siteInitial}
            </span>
            <p
              title={labels.title}
              className="truncate text-lg font-semibold tracking-tight text-content"
            >
              {labels.title}
            </p>
          </div>
          <p className="mt-2 text-xs text-muted">{labels.description}</p>
        </div>

        <div className="shrink-0 border-b border-line px-3 py-3">
          <Link
            href={portalHref}
            className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-content"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 rtl:-scale-x-100"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
            {labels.backToPortal}
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <KnowledgeTree
            categories={categories}
            ariaLabel={labels.browseTitle}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        {shell ? (
          <CustomerShellHeader
            siteTitle={shell.publicSettings.siteTitle}
            navigationLabel={shell.portal.navigation.label}
            navigation={shell.navigation}
            locale={shell.locale}
            languageLabel={shell.dictionary.common.language}
            labels={shell.labels.header}
            email={shell.profile.email}
            displayName={
              shell.profile.displayName ?? shell.profile.certificateName
            }
            companyName={shell.profile.company.name}
            hasAvatar={shell.profile.hasAvatar}
            avatarFileAssetId={shell.profile.avatarFileAssetId}
            unreadCount={shell.unread?.unread ?? 0}
            notifications={shell.notificationPage?.items ?? []}
            canCompany={shell.canCompany}
            canTraining={shell.canTraining}
            trainingEnabled={shell.trainingEnabled}
            canNotifications={shell.canNotifications}
            canAdministration={shell.canAdministration}
          />
        ) : (
          <header className="flex items-center justify-between border-b border-line bg-surface-panel px-4 py-3 sm:px-6">
            <Link href="/kb" className="font-semibold text-content">
              {publicSettings.siteTitle}
            </Link>
            <Link
              href="/admin"
              className="text-sm text-muted hover:text-content"
            >
              {labels.backToPortal}
            </Link>
          </header>
        )}

        {/* Mobile: the sidebar is hidden, so the KB needs its own way back. */}
        <div className="border-b border-line bg-surface-panel px-4 py-3 sm:px-6 lg:hidden">
          <Link
            href={portalHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-content"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 rtl:-scale-x-100"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
            {labels.backToPortal}
          </Link>
        </div>

        <div className="border-b border-line bg-surface-panel px-4 py-3 sm:px-6 lg:px-8">
          <KnowledgeSearchBox
            placeholder={labels.searchPlaceholder}
            action={labels.searchAction}
            emptyLabel={labels.searchEmptyTitle}
          />
        </div>

        <main className="relative w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
