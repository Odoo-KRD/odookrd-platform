"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@odookrd/types";
import type { InvitationDictionary } from "@/lib/i18n/types";
import { activationCopy } from "@/lib/i18n/activation-copy";

interface AcceptInvitationFormProps {
  labels: InvitationDictionary;
  locale: Locale;
}

function subscribeToHash(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function invitationToken(): string {
  return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
}

function serverInvitationToken(): string {
  return "";
}

export function AcceptInvitationForm({
  labels,
  locale,
}: AcceptInvitationFormProps) {
  const router = useRouter();
  const copy = activationCopy[locale];
  const token = useSyncExternalStore(
    subscribeToHash,
    invitationToken,
    serverInvitationToken,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (pending) return;
    if (!token || token.length < 20) {
      setError(labels.invalidInvitation);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const rawName = formData.get("displayName");
    const password = formData.get("password");
    const confirmation = formData.get("confirmation");
    if (typeof rawName !== "string" || /[\u0000-\u001f\u007f]/u.test(rawName)) {
      setError(copy.invalidName);
      return;
    }
    const displayName = rawName.trim().replace(/\s+/gu, " ");
    if (displayName.length < 2 || displayName.length > 160) {
      setError(copy.invalidName);
      return;
    }
    if (
      typeof password !== "string" ||
      typeof confirmation !== "string" ||
      password !== confirmation
    ) {
      setError(labels.passwordsDoNotMatch);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, displayName, password }),
      });
      if (!response.ok) {
        let message =
          response.status === 400 ||
          response.status === 404 ||
          response.status === 409
            ? labels.invalidInvitation
            : labels.acceptanceUnavailable;
        try {
          const result: unknown = await response.json();
          if (
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string" &&
            response.status === 422
          ) {
            message = result.message;
          }
        } catch {
          // Keep the safe, localized fallback message.
        }
        setError(message);
        return;
      }
      window.history.replaceState({}, "", "/invitation/accept");
      router.replace("/login?invitation=accepted");
      router.refresh();
    } catch {
      setError(labels.acceptanceUnavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-7 grid gap-5" onSubmit={submit}>
      <div className="grid gap-2">
        <label
          htmlFor="invitation-name"
          className="text-sm font-semibold text-slate-700"
        >
          {copy.name}
        </label>
        <input
          id="invitation-name"
          name="displayName"
          type="text"
          dir="auto"
          autoComplete="name"
          minLength={2}
          maxLength={160}
          required
          disabled={pending}
          className="h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15 disabled:opacity-60"
        />
        <p className="text-xs leading-5 text-slate-500">{copy.nameHint}</p>
      </div>
      <div className="grid gap-2">
        <label
          htmlFor="invitation-password"
          className="text-sm font-semibold text-slate-700"
        >
          {labels.newPassword}
        </label>
        <input
          id="invitation-password"
          name="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          minLength={12}
          maxLength={128}
          required
          disabled={pending}
          className="h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15 disabled:opacity-60"
        />
        <p className="text-xs leading-5 text-slate-500">
          {labels.passwordHint}
        </p>
      </div>
      <div className="grid gap-2">
        <label
          htmlFor="invitation-confirmation"
          className="text-sm font-semibold text-slate-700"
        >
          {labels.confirmPassword}
        </label>
        <input
          id="invitation-confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          minLength={12}
          maxLength={128}
          required
          disabled={pending}
          className="h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15 disabled:opacity-60"
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center justify-center rounded-md bg-[#714b67] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#62405a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? labels.activatingAccount : labels.activateAccount}
      </button>
    </form>
  );
}
