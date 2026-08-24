export interface DashboardPreferencesResponse {
  order: string[];
  hidden: string[];
  collapsed: string[];
}

export interface UserUiPreferencesResponse {
  sidebarCollapsed: boolean;
  dashboardPreferences: DashboardPreferencesResponse;
  updatedAt: string | null;
}
