"use client";

import type {
  Company,
  InvitationDispatchSummary,
  Locale,
  Role,
} from "@odookrd/types";
import { ActionButton, Badge } from "@odookrd/ui";
import { useActionState, useMemo, useState } from "react";

import type { InvitationFormState } from "@/lib/forms";
import type { AdminDictionary } from "@/lib/i18n/admin";
import {
  userInvitationAdminDictionaries,
  type UserInvitationAdminDictionary,
} from "@/lib/i18n/user-invitations";
import type { UsersDictionary } from "@/lib/i18n/users";

interface InviteAndDeliverUserFormProps {
  action: (
    previousState: InvitationFormState,
    formData: FormData,
  ) => Promise<InvitationFormState>;
  labels: UsersDictionary;
  roleLabels: AdminDictionary["roles"];
  roles: Role[];
  companies: Company[];
  isPlatform: boolean;
  companyId: string | null;
  locale: Locale;
}

function roleName(role: Role, labels: AdminDictionary["roles"]): string {
  if (role.key === "platform_admin") return labels.platformAdmin;
  if (role.key === "company_admin") return labels.companyAdmin;
  return role.key === "company_user" ? labels.companyUser : role.name;
}

function InvitationDelivery({
  dispatch,
  labels,
}: {
  dispatch: InvitationDispatchSummary | null;
  labels: UserInvitationAdminDictionary;
}) {
  if (!dispatch) return null;

  return (
    <div className="mt-4 grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {labels.deliveryStatus}
      </p>
      <div className="flex flex-wrap gap-2">
        {dispatch.deliveries.map((delivery) => (
          <Badge key={delivery.channel}>
            {delivery.channel === "EMAIL"
              ? labels.emailChannel
              : labels.whatsappChannel}
            {": "}
            {labels.deliveryStatuses[delivery.status]}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function InviteAndDeliverUserForm({
  action,
  labels,
  roleLabels,
  roles,
  companies,
  isPlatform,
  companyId,
  locale,
}: InviteAndDeliverUserFormProps) {
  const invitationLabels = userInvitationAdminDictionaries[locale];
  const [state, formAction, pending] = useActionState(action, {
    message: null,
    invitation: null,
  });
  const [scope, setScope] = useState<"PLATFORM" | "COMPANY">("COMPANY");
  const [copied, setCopied] = useState(false);

  const availableRoles = useMemo(
    () => roles.filter((role) => role.scope === scope),
    [roles, scope],
  );

  const invitationLink = state.invitation
    ? `/invitation/accept#${new URLSearchParams({
        token: state.invitation.token,
      }).toString()}`
    : null;

  async function copyLink() {
    if (!invitationLink) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}${invitationLink}`,
    );
    setCopied(true);
  }

  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid max-w-2xl gap-5">
        <input type="hidden" name="locale" value={locale} />

        <div className="grid gap-2">
          <label
            htmlFor="invite-email"
            className="text-sm font-medium text-slate-700"
          >
            {labels.email}
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            dir="ltr"
            maxLength={320}
            required
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="invite-whatsapp"
            className="text-sm font-medium text-slate-700"
          >
            {invitationLabels.whatsappNumber}
          </label>
          <input
            id="invite-whatsapp"
            name="whatsappNumber"
            type="tel"
            dir="ltr"
            inputMode="tel"
            maxLength={16}
            placeholder="+9647XXXXXXXXX"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
          />
          <p className="text-xs leading-5 text-slate-500">
            {invitationLabels.whatsappHint}
          </p>
        </div>

        {isPlatform ? (
          <div className="grid gap-2">
            <label
              htmlFor="invite-scope"
              className="text-sm font-medium text-slate-700"
            >
              {labels.accountScope}
            </label>
            <select
              id="invite-scope"
              name="accountScope"
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as "PLATFORM" | "COMPANY")
              }
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="COMPANY">{labels.companyAccount}</option>
              <option value="PLATFORM">{labels.platformAccount}</option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="accountScope" value="COMPANY" />
        )}

        {scope === "COMPANY" ? (
          isPlatform ? (
            <div className="grid gap-2">
              <label
                htmlFor="invite-company"
                className="text-sm font-medium text-slate-700"
              >
                {labels.company}
              </label>
              <select
                id="invite-company"
                name="companyId"
                required
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">{labels.chooseCompany}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="companyId" value={companyId ?? ""} />
          )
        ) : null}

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">
            {labels.roles}
          </legend>
          {availableRoles.map((role) => (
            <label
              key={role.id}
              className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name="roleKeys"
                value={role.key}
                className="size-4 accent-[#714b67]"
              />
              {roleName(role, roleLabels)}
            </label>
          ))}
        </fieldset>

        {state.message ? (
          <p
            role="alert"
            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            {state.message}
          </p>
        ) : null}

        <div>
          <ActionButton type="submit" disabled={pending}>
            {pending
              ? invitationLabels.sendingInvitation
              : invitationLabels.sendInvitation}
          </ActionButton>
        </div>
      </form>

      {state.invitation ? (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">
            {invitationLabels.invitationSent}
          </p>
          <p dir="ltr" className="mt-1 text-sm text-emerald-800">
            {state.invitation.email}
          </p>

          {invitationLink ? (
            <div className="mt-4 grid gap-2">
              <label className="text-xs font-medium text-emerald-900">
                {labels.invitationLink}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  dir="ltr"
                  value={invitationLink}
                  className="h-10 min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-3 text-xs"
                />
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="h-10 rounded-md border border-emerald-300 bg-white px-4 text-sm font-medium text-emerald-900"
                >
                  {copied ? invitationLabels.copied : invitationLabels.copyLink}
                </button>
              </div>
            </div>
          ) : null}

          <p className="mt-3 text-xs text-emerald-800">
            {labels.invitationExpires}:{" "}
            {new Intl.DateTimeFormat(
              locale === "ku" ? "ckb-IQ" : locale === "ar" ? "ar-IQ" : "en-GB",
              { dateStyle: "medium", timeStyle: "short" },
            ).format(new Date(state.invitation.expiresAt))}
          </p>

          <InvitationDelivery
            dispatch={state.invitation.dispatch ?? null}
            labels={invitationLabels}
          />
        </section>
      ) : null}
    </div>
  );
}
