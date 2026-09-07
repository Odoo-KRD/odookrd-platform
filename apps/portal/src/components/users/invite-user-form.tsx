"use client";

import { invitationAcceptUrl } from "@/lib/invitation-links";
import type { AccountScope, Company, Locale, Role } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import type { InvitationFormState } from "@/lib/forms";
import type { AdminDictionary } from "@/lib/i18n/admin";
import type { UsersDictionary } from "@/lib/i18n/users";

type InvitationAction = (
  previousState: InvitationFormState,
  formData: FormData,
) => Promise<InvitationFormState>;

interface InviteUserFormProps {
  action: InvitationAction;
  labels: UsersDictionary;
  roleLabels: AdminDictionary["roles"];
  roles: Role[];
  companies: Company[];
  isPlatform: boolean;
  companyId: string | null;
  locale: Locale;
}

function roleName(role: Role, labels: AdminDictionary["roles"]): string {
  if (role.key === "platform_admin") {
    return labels.platformAdmin;
  }

  if (role.key === "company_admin") {
    return labels.companyAdmin;
  }

  if (role.key === "company_user") {
    return labels.companyUser;
  }

  return role.name;
}

export function InviteUserForm({
  action,
  labels,
  roleLabels,
  roles,
  companies,
  isPlatform,
  companyId,
  locale,
}: InviteUserFormProps) {
  const [scope, setScope] = useState<AccountScope>("COMPANY");
  const [copied, setCopied] = useState(false);
  const invitationInput = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(action, {
    message: null,
    invitation: null,
  });

  const availableRoles = roles.filter((role) => role.scope === scope);
  const invitationUrl = state.invitation
    ? invitationAcceptUrl(state.invitation.token)
    : "";

  function confirmSensitiveInvitation(
    event: React.FormEvent<HTMLFormElement>,
  ): void {
    if (
      scope === "PLATFORM" &&
      !window.confirm(labels.confirmPlatformInvitation)
    ) {
      event.preventDefault();
    }
  }

  async function copyInvitation(): Promise<void> {
    if (!invitationUrl) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationUrl);
      } else {
        invitationInput.current?.select();
        document.execCommand("copy");
      }

      setCopied(true);
    } catch {
      invitationInput.current?.select();
    }
  }

  return (
    <div className="grid gap-8">
      <form
        action={formAction}
        onSubmit={confirmSensitiveInvitation}
        className="grid max-w-2xl gap-5"
      >
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
            autoComplete="email"
            required
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
          />
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
              onChange={(event) => {
                setScope(event.target.value as AccountScope);
                setCopied(false);
              }}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67]"
            >
              <option value="COMPANY">{labels.companyAccount}</option>
              <option value="PLATFORM">{labels.platformAccount}</option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="accountScope" value="COMPANY" />
        )}

        {scope === "COMPANY" && isPlatform ? (
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
              defaultValue=""
              required
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67]"
            >
              <option value="" disabled>
                {labels.chooseCompany}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!isPlatform && companyId ? (
          <input type="hidden" name="companyId" value={companyId} />
        ) : null}

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-slate-700">
            {labels.roles}
          </legend>
          <p className="text-xs text-slate-500">{labels.chooseRoles}</p>

          <div key={scope} className="grid gap-2">
            {availableRoles.map((role) => (
              <label
                key={role.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  name="roleKeys"
                  value={role.key}
                  defaultChecked={role.key === "company_user"}
                  className="size-4 accent-[#714b67]"
                />
                <span>{roleName(role, roleLabels)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {state.message ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            type="submit"
            disabled={pending || availableRoles.length === 0}
          >
            {pending ? labels.creatingInvitation : labels.sendInvitation}
          </ActionButton>
          <Link
            href="/admin/users"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {labels.cancel}
          </Link>
        </div>
      </form>

      {state.invitation ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="text-base font-semibold text-emerald-900">
            {labels.invitationCreated}
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            {labels.invitationDescription}
          </p>

          <div className="mt-5 grid gap-2">
            <label
              htmlFor="invitation-link"
              className="text-sm font-medium text-slate-700"
            >
              {labels.invitationLink}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={invitationInput}
                id="invitation-link"
                value={invitationUrl}
                readOnly
                dir="ltr"
                className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-700"
              />
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => void copyInvitation()}
              >
                {copied ? labels.copied : labels.copyLink}
              </ActionButton>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-600">
            {labels.invitationExpires}:{" "}
            {new Intl.DateTimeFormat(
              locale === "ku" ? "ckb-IQ" : locale === "ar" ? "ar-IQ" : "en-GB",
              { dateStyle: "medium", timeStyle: "short" },
            ).format(new Date(state.invitation.expiresAt))}
          </p>
        </section>
      ) : null}
    </div>
  );
}
