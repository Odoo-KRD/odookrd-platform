import type {
  KnowledgeArticlePage,
  KnowledgeCategoryNode,
} from "@odookrd/types";
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
 * The knowledge base keeps the portal header but replaces the portal sidebar
 * with its own category tree: a horizontal header and a vertical tree do not
 * compete, whereas two sidebars would.
 *
 * Platform admins can read the knowledge base too, and they have no customer
 * shell, so they get a slim header instead.
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
  // Articles are fetched alongside the tree so the sidebar can list them under
  // their category, the way Odoo's own documentation sidebar does.
  const [categories, articlePage] = await Promise.all([
    apiRequest<KnowledgeCategoryNode[]>("/knowledge/categories", {
      token,
    }).catch(() => [] as KnowledgeCategoryNode[]),
    apiRequest<KnowledgeArticlePage>("/knowledge/articles?limit=500", {
      token,
    }).catch(() => null),
  ]);

  const treeArticles = (articlePage?.items ?? []).map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    categoryId: article.category.id,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-surface-page lg:h-screen lg:overflow-hidden">
      {shell ? (
        <CustomerShellHeader
          siteTitle={shell.publicSettings.siteTitle}
          navigationLabel={shell.portal.navigation.label}
          navigation={shell.navigation}
          locale={shell.locale}
          languageLabel={shell.dictionary.common.language}
          labels={shell.labels.header}
          email={shell.profile.email}
          displayName={shell.profile.displayName ?? shell.profile.certificateName}
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
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-6">
          <Link href="/kb" className="font-semibold text-content">
            {publicSettings.siteTitle}
          </Link>
          <Link
            href="/admin"
            className="text-sm text-content-muted hover:text-content"
          >
            {labels.backToPortal}
          </Link>
        </header>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <aside className="w-full shrink-0 border-line bg-white lg:h-full lg:w-72 lg:overflow-y-auto lg:border-e">
          <div className="space-y-4 p-4">
            <div className="space-y-1">
              <Link
                href="/kb"
                className="block text-base font-semibold text-content"
              >
                {labels.title}
              </Link>
              <p className="text-xs text-content-muted">{labels.description}</p>
            </div>

            <KnowledgeTree
              categories={categories}
              articles={treeArticles}
              ariaLabel={labels.browseTitle}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:h-full lg:overflow-hidden">
          <div className="border-b border-line bg-white px-4 py-3 sm:px-6">
            <KnowledgeSearchBox
              placeholder={labels.searchPlaceholder}
              action={labels.searchAction}
              emptyLabel={labels.searchEmptyTitle}
            />
          </div>

          <main className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
