import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CustomerShellHeader } from "@/components/customer/customer-shell-header";
import { getCustomerShell } from "@/lib/customer-shell";

export default async function ProtectedCustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const shell = await getCustomerShell();

  if (!shell) {
    redirect("/admin");
  }

  const {
    session,
    dictionary,
    portal,
    labels,
    publicSettings,
    uiPreferences,
    navigation,
    profile,
    notificationPage,
    unread,
    locale,
    trainingEnabled,
    canCompany,
    canTraining,
    canNotifications,
    canAdministration,
  } = shell;

  return (
    <div className="min-h-screen bg-surface-page lg:flex lg:h-screen lg:overflow-hidden">
      <AdminSidebar
        siteTitle={publicSettings.siteTitle}
        administrationLabel={portal.navigation.portal}
        navigationLabel={portal.navigation.label}
        entries={navigation}
        signedInAsLabel={dictionary.workspace.signedInAs}
        email={session.user.email}
        initialCollapsed={uiPreferences.sidebarCollapsed}
        collapseLabel={portal.navigation.collapseSidebar}
        expandLabel={portal.navigation.expandSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        <CustomerShellHeader
          siteTitle={publicSettings.siteTitle}
          navigationLabel={portal.navigation.label}
          navigation={navigation}
          locale={locale}
          languageLabel={dictionary.common.language}
          labels={labels.header}
          email={profile.email}
          displayName={profile.displayName ?? profile.certificateName}
          companyName={profile.company.name}
          hasAvatar={profile.hasAvatar}
          avatarFileAssetId={profile.avatarFileAssetId}
          unreadCount={unread?.unread ?? 0}
          notifications={notificationPage?.items ?? []}
          canCompany={canCompany}
          canTraining={canTraining}
          trainingEnabled={trainingEnabled}
          canNotifications={canNotifications}
          canAdministration={canAdministration}
        />

        <main className="customer-shell-main relative w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
