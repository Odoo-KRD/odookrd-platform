import type { CurrentSession } from "@odookrd/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export const getSession = cache(async (): Promise<CurrentSession | null> => {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    return await apiRequest<CurrentSession>("/auth/me", { token });
  } catch (error: unknown) {
    if (
      error instanceof ApiRequestError &&
      (error.status === 401 || error.status === 403)
    ) {
      return null;
    }

    throw error;
  }
});

export async function requireSession(): Promise<CurrentSession> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
