import type { UserUiPreferences } from "@odookrd/types";

import { apiRequest } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export const DEFAULT_USER_UI_PREFERENCES: UserUiPreferences = {
  sidebarCollapsed: false,
  dashboardPreferences: {
    order: [
      "companies",
      "users",
      "roles",
      "services",
      "notifications",
      "settings",
    ],
    hidden: [],
    collapsed: [],
  },
  updatedAt: null,
};

export async function getUserUiPreferences(): Promise<UserUiPreferences> {
  const token = await getSessionToken();

  if (!token) {
    return DEFAULT_USER_UI_PREFERENCES;
  }

  return apiRequest<UserUiPreferences>("/me/preferences", { token });
}
