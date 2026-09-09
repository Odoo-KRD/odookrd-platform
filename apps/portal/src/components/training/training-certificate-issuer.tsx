"use client";

import type { Locale, TrainingCertificateCourseStatus } from "@odookrd/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { TrainingCertificateDictionary } from "@/lib/i18n/training/certificates";

export function TrainingCertificateIssuer({
  slug,
  locale,
  status,
  labels,
}: {
  slug: string;
  locale: Locale;
  status: TrainingCertificateCourseStatus;
  labels: TrainingCertificateDictionary;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status.issued) {
    return (
      <section
        className={`rounded-xl border p-5 shadow-sm sm:p-6 ${
          status.issued.status === "ACTIVE"
            ? "border-emerald-200 bg-emerald-50/70"
            : "border-red-200 bg-red-50/70"
        }`}
      >
        <p className="text-base font-semibold text-content">
          {status.issued.status === "ACTIVE"
            ? labels.certificateIssued
            : labels.certificateRevoked}
        </p>
        <p dir="ltr" className="mt-2 text-sm font-medium text-muted">
          {status.issued.certificateNumber}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {status.issued.status === "ACTIVE" ? (
            <Link
              href={`/api/training/certificates/${encodeURIComponent(status.issued.id)}/pdf`}
              target="_blank"
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              {labels.downloadCertificate}
            </Link>
          ) : null}

          <Link
            href="/dashboard/training/certificates"
            className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {labels.viewMyCertificates}
          </Link>
        </div>
      </section>
    );
  }

  if (!status.templateAvailable) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 shadow-sm sm:p-6">
        {labels.templateUnavailable}
      </section>
    );
  }

  async function issue(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const certificateName = String(form.get("certificateName") ?? "").trim();
    const certificateLocale = String(form.get("certificateLocale") ?? locale);

    try {
      const response = await fetch(
        `/api/training/certificates/courses/${encodeURIComponent(slug)}/issue`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            certificateName,
            locale: certificateLocale,
          }),
        },
      );

      const body = (await response.json()) as {
        message?: string | string[];
      };
      if (!response.ok) {
        throw new Error(
          Array.isArray(body.message)
            ? body.message[0]
            : body.message || "Certificate generation failed.",
        );
      }

      router.refresh();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Certificate generation failed.",
      );
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-brand/20 bg-brand-soft/40 p-5 shadow-sm sm:p-6">
      <p className="text-base font-semibold text-content">
        {labels.certificateAvailable}
      </p>
      <p className="mt-1 text-sm leading-6 text-muted">
        {labels.certificateReadyHelp}
      </p>

      <form
        onSubmit={(event) => void issue(event)}
        className="mt-5 grid gap-4 md:grid-cols-[minmax(240px,1fr)_220px_auto]"
      >
        <label className="grid gap-2 text-sm font-medium text-content">
          {labels.certificateName}
          <input
            name="certificateName"
            defaultValue={status.certificateName ?? ""}
            minLength={2}
            maxLength={250}
            required
            className="h-11 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
          />
          <span className="text-xs font-normal leading-5 text-muted">
            {labels.certificateNameHelp}
          </span>
        </label>

        <label className="grid content-start gap-2 text-sm font-medium text-content">
          {labels.certificateLanguage}
          <select
            name="certificateLocale"
            defaultValue={locale}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
          >
            <option value="ku">{labels.kuLanguage}</option>
            <option value="ar">{labels.arLanguage}</option>
            <option value="en">{labels.enLanguage}</option>
          </select>
        </label>

        <div className="flex items-start md:pt-7">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? labels.generatingCertificate : labels.generateCertificate}
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-3"
          >
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
