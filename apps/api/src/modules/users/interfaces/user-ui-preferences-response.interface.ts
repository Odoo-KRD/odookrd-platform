export interface UserUiPreferencesResponse {
  sidebarCollapsed: boolean;
  dashboardPreferences: Record<string, unknown>;
  updatedAt: string | null;
}
