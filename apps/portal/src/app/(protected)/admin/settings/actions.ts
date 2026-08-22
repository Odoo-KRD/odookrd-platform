"use server";

import {
  PERMISSIONS,
  type SettingCategory,
  type SettingPrimitive,
  type SettingsCollection,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";

export interface SettingsFormState {
  message: string | null;
  success: boolean;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SETTING_KEYS_BY_CATEGORY: Record<SettingCategory, readonly string[]> = {
  general: ["general.site_title", "general.default_locale", "general.timezone"],
  theme: ["theme.default_font"],
  companies: ["companies.max_users_per_company"],
  notifications: [
    "notifications.in_app.enabled",
    "notifications.email.enabled",
    "notifications.email.provider",
    "notifications.email.amazon_ses.region",
    "notifications.email.amazon_ses.transport",
    "notifications.email.amazon_ses.smtp_port",
    "notifications.email.amazon_ses.smtp_security",
    "notifications.email.amazon_ses.smtp_username",
    "notifications.email.amazon_ses.smtp_password",
    "notifications.email.amazon_ses.access_key_id",
    "notifications.email.amazon_ses.secret_access_key",
    "notifications.email.amazon_ses.session_token",
    "notifications.email.sender_email",
    "notifications.email.sender_name",
    "notifications.email.reply_to",
    "notifications.whatsapp.enabled",
    "notifications.whatsapp.api_url",
    "notifications.whatsapp.phone_number_id",
    "notifications.whatsapp.business_account_id",
    "notifications.whatsapp.access_token",
    "notifications.whatsapp.webhook_verify_token",
  ],
  helpdesk: [],
  trainings: [],
};

const booleanKeys = new Set([
  "notifications.in_app.enabled",
  "notifications.email.enabled",
  "notifications.whatsapp.enabled",
]);

const numberKeys = new Set([
  "companies.max_users_per_company",
  "notifications.email.amazon_ses.smtp_port",
]);

const secretKeys = new Set([
  "notifications.email.amazon_ses.access_key_id",
  "notifications.email.amazon_ses.secret_access_key",
  "notifications.email.amazon_ses.session_token",
  "notifications.email.amazon_ses.smtp_username",
  "notifications.email.amazon_ses.smtp_password",
  "notifications.whatsapp.access_token",
  "notifications.whatsapp.webhook_verify_token",
]);

function isSettingCategory(value: unknown): value is SettingCategory {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(SETTING_KEYS_BY_CATEGORY, value)
  );
}

function failed(error: unknown): SettingsFormState {
  return {
    message:
      error instanceof ApiRequestError
        ? error.message
        : "The settings request could not be completed.",
    success: false,
  };
}

export async function updateSettingsAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  const scope = formData.get("scope");
  const category = formData.get("category");
  const selectedCompanyId = formData.get("companyId");

  if (scope !== "PLATFORM" && scope !== "COMPANY") {
    return { message: "Choose a valid settings scope.", success: false };
  }

  if (!isSettingCategory(category)) {
    return { message: "Choose a valid settings category.", success: false };
  }

  let companyId: string | null = null;

  if (scope === "PLATFORM") {
    if (session.user.accountScope !== "PLATFORM") {
      return { message: "Platform scope is forbidden.", success: false };
    }
  } else {
    companyId =
      session.user.accountScope === "COMPANY"
        ? session.user.companyId
        : typeof selectedCompanyId === "string"
          ? selectedCompanyId
          : null;

    if (!companyId || !uuidPattern.test(companyId)) {
      return { message: "Choose a valid company.", success: false };
    }

    if (
      session.user.accountScope === "COMPANY" &&
      companyId !== session.user.companyId
    ) {
      return {
        message: "Access outside company scope is forbidden.",
        success: false,
      };
    }
  }

  const categoryKeys = new Set(SETTING_KEYS_BY_CATEGORY[category]);
  const requestedEditable = formData
    .getAll("editable")
    .filter((value): value is string => typeof value === "string");

  if (requestedEditable.some((key) => !categoryKeys.has(key))) {
    return { message: "The settings request is invalid.", success: false };
  }

  const editable = [...new Set(requestedEditable)];

  const settings: Array<{ key: string; value: SettingPrimitive }> = [];

  for (const key of editable) {
    if (booleanKeys.has(key)) {
      settings.push({ key, value: formData.has("setting." + key) });
      continue;
    }

    const selected = formData.get("setting." + key);
    if (typeof selected !== "string" || selected.length > 8192) {
      return {
        message: "A setting contains an invalid value.",
        success: false,
      };
    }

    if (secretKeys.has(key)) {
      if (formData.has("clear." + key)) {
        settings.push({ key, value: "" });
      } else if (selected.length > 0) {
        settings.push({ key, value: selected });
      }
      continue;
    }

    if (numberKeys.has(key)) {
      const value = Number(selected);
      if (!Number.isSafeInteger(value)) {
        return { message: "Enter a valid whole number.", success: false };
      }
      settings.push({ key, value });
      continue;
    }

    settings.push({ key, value: selected.trim() });
  }

  if (settings.length === 0) {
    return { message: "No settings were changed.", success: false };
  }

  const path =
    scope === "PLATFORM"
      ? "/settings/platform"
      : `/settings/company/${encodeURIComponent(companyId ?? "")}`;

  try {
    await apiRequest<SettingsCollection>(path, {
      method: "PATCH",
      token,
      body: JSON.stringify({ settings }),
    });
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");

  return { message: null, success: true };
}
