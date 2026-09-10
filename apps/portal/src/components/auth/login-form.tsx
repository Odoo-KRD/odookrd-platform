"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CustomerPortalRefinementDictionary } from "@/lib/i18n/customer/refinements";

interface LoginFormProps {
  messages: Dictionary["login"];
  labels: CustomerPortalRefinementDictionary["login"];
  redirectTo: string;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.6 10.6 0 0 1 12 4c5.5 0 9 5 9 8a9.7 9.7 0 0 1-2.1 3.8M6.6 6.6C4.4 8 3 10.2 3 12c0 3 3.5 8 9 8 1.6 0 3-.4 4.2-1" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 12c0-3 3.5-8 9-8s9 5 9 8-3.5 8-9 8-9-5-9-8Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function LoginForm({ messages, labels, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (pending) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          rememberMe: formData.get("rememberMe") === "on",
        }),
      });

      if (!response.ok) {
        setError(
          response.status === 401
            ? messages.invalidCredentials
            : response.status === 429
              ? messages.tooManyAttempts
              : messages.unavailable,
        );

        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError(messages.unavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-7 grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-content">
          {messages.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          dir="ltr"
          maxLength={320}
          required
          className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium text-content">
          {messages.password}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            maxLength={128}
            required
            className="h-11 w-full rounded-md border border-line bg-white py-0 ps-3.5 pe-11 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
          <button
            type="button"
            aria-label={
              showPassword ? labels.hidePassword : labels.showPassword
            }
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute end-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-surface-subtle hover:text-content"
          >
            <EyeIcon hidden={showPassword} />
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          name="rememberMe"
          className="mt-0.5 size-4 rounded border-line accent-brand"
        />
        <span>{labels.rememberMe}</span>
      </label>

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
        className="flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? messages.submitting : messages.submit}
      </button>

      <p className="text-center text-xs leading-5 text-muted">
        {labels.secureNote}
      </p>
    </form>
  );
}
