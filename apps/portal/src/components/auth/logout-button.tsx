"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  label: string;
  pendingLabel: string;
}

export function LogoutButton({ label, pendingLabel }: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut(): Promise<void> {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (response.ok) {
        router.replace("/login");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void signOut()}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
