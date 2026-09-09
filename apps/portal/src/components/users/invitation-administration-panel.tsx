"use client";

import { invitationAcceptUrl } from "@/lib/invitation-links";
import type {
  InvitationDispatchSummary,
  Locale,
  UserAdministrationDetails,
} from "@odookrd/types";
import { ActionButton, Badge } from "@odookrd/ui";
import { useActionState, useState } from "react";

import {
  userInvitationAdminDictionaries,
  type UserInvitationAdminDictionary,
} from "@/lib/i18n/users/invitations";

interface InvitationOperationState {
  message: string | null;
  success: boolean;
  token: string | null;
  expiresAt: string | null;
  dispatch: InvitationDispatchSummary | null;
}

interface InvitationAdministrationPanelProps {
  locale: Locale;
  details: UserAdministrationDetails;
  resendAction: (
    previousState: InvitationOperationState,
    formData: FormData,
  ) => Promise<InvitationOperationState>;
  regenerateAction: (
    previousState: InvitationOperationState,
    formData: FormData,
  ) => Promise<InvitationOperationState>;
}

const initialState: InvitationOperationState = {
  message: null,
  success: false,
  token: null,
  expiresAt: null,
  dispatch: null,
};

function Delivery({
  dispatch,
  labels,
}: {
  dispatch: InvitationDispatchSummary | null;
  labels: UserInvitationAdminDictionary;
}) {
  if (!dispatch) return null;

  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium text-slate-500">
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

export function InvitationAdministrationPanel({
  locale,
  details,
  resendAction,
  regenerateAction,
}: InvitationAdministrationPanelProps) {
  const labels = userInvitationAdminDictionaries[locale];
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendAction,
    initialState,
  );
  const [generateState, generateFormAction, generatePending] = useActionState(
    regenerateAction,
    initialState,
  );
  const [copied, setCopied] = useState(false);

  const generatedPath = generateState.token
    ? invitationAcceptUrl(generateState.token)
    : null;

  const latestDispatch =
    resendState.dispatch ?? details.invitation?.lastDispatch ?? null;
  const expiration =
    resendState.expiresAt ??
    generateState.expiresAt ??
    details.invitation?.expiresAt ??
    null;

  async function copyGeneratedLink() {
    if (!generatedPath) return;
    await navigator.clipboard.writeText(`${generatedPath}`);
    setCopied(true);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {labels.invitationManagement}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {labels.invitationManagementDescription}
        </p>
      </div>

      <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>
            {details.invitation?.active
              ? labels.activeInvitation
              : details.invitation
                ? labels.expiredInvitation
                : labels.noInvitation}
          </Badge>
          {details.whatsappNumber ? (
            <span dir="ltr" className="text-xs text-slate-600">
              {details.whatsappNumber}
            </span>
          ) : null}
        </div>

        {expiration ? (
          <p className="text-xs text-slate-600">
            {labels.invitationExpires}:{" "}
            {new Intl.DateTimeFormat(
              locale === "ku" ? "ckb-IQ" : locale === "ar" ? "ar-IQ" : "en-GB",
              { dateStyle: "medium", timeStyle: "short" },
            ).format(new Date(expiration))}
          </p>
        ) : null}

        <Delivery dispatch={latestDispatch} labels={labels} />
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={resendFormAction}>
          <input type="hidden" name="locale" value={locale} />
          <ActionButton
            type="submit"
            disabled={resendPending || generatePending}
          >
            {resendPending
              ? labels.resendingInvitation
              : labels.resendInvitation}
          </ActionButton>
        </form>

        <form action={generateFormAction}>
          <ActionButton
            type="submit"
            variant="secondary"
            disabled={generatePending || resendPending}
          >
            {generatePending
              ? labels.generatingNewLink
              : labels.generateNewLink}
          </ActionButton>
        </form>
      </div>

      {resendState.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {labels.invitationResent}
        </p>
      ) : null}

      {resendState.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {resendState.message}
        </p>
      ) : null}

      {generateState.success && generatedPath ? (
        <div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            {labels.linkGenerated}
          </p>
          <p className="text-xs leading-5 text-amber-800">
            {labels.oneTimeLinkNotice}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              dir="ltr"
              value={generatedPath}
              className="h-10 min-w-0 flex-1 rounded-md border border-amber-200 bg-white px-3 text-xs"
            />
            <button
              type="button"
              onClick={() => void copyGeneratedLink()}
              className="h-10 rounded-md border border-amber-300 bg-white px-4 text-sm font-medium text-amber-900"
            >
              {copied ? labels.copied : labels.copyLink}
            </button>
          </div>
        </div>
      ) : null}

      {generateState.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {generateState.message}
        </p>
      ) : null}
    </div>
  );
}
