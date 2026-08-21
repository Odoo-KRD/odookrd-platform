"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Dictionary } from "@/lib/i18n/dictionaries";

interface LoginFormProps {
  messages: Dictionary["login"];
  redirectTo: string;
}

export function LoginForm({ messages, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
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
    <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          {messages.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          dir="ltr"
          maxLength={320}
          required
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          {messages.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          maxLength={128}
          required
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center justify-center rounded-md bg-[#714b67] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#62405a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? messages.submitting : messages.submit}
      </button>
    </form>
  );
}
