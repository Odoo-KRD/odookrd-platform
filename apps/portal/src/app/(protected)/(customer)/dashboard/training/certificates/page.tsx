import { PERMISSIONS, type TrainingCertificatePage } from "@odookrd/types";
import { EmptyState, Panel } from "@odookrd/ui";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { trainingCertificateDictionaries } from "@/lib/i18n/training-certificates";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

function CertificateSealIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="24" cy="18" r="11" />
      <path d="m17 27-3 15 10-5 10 5-3-15M19 18l3 3 7-7" />
    </svg>
  );
}

export default async function MyTrainingCertificatesPage() {
  const [{ token }, { locale }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.TRAINING_READ),
    getTrainingDictionary(),
  ]);

  const labels = trainingCertificateDictionaries[locale];
  const result = await apiRequest<TrainingCertificatePage>(
    "/training/certificates",
    { token },
  );

  return (
    <div className="grid gap-6 sm:gap-7">
      <section className="rounded-xl border border-line bg-surface-panel px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {labels.certificatesNavigation}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
              {labels.myCertificatesTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {labels.myCertificatesDescription}
            </p>
          </div>
          <div className="rounded-lg bg-surface-subtle px-4 py-3">
            <p className="text-xs font-medium text-muted">
              {labels.certificatesNavigation}
            </p>
            <p className="mt-1 text-2xl font-semibold text-content">
              {result.items.length}
            </p>
          </div>
        </div>
      </section>

      {result.items.length === 0 ? (
        <Panel className="p-6">
          <EmptyState
            title={labels.noCertificates}
            description={labels.myCertificatesDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {result.items.map((certificate) => {
            const title = localizeTrainingText(
              certificate.courseTitle,
              certificate.courseTitleTranslations,
              locale,
            );
            const active = certificate.status === "ACTIVE";

            return (
              <article
                key={certificate.id}
                className="group overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="h-1 bg-brand" />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <CertificateSealIcon />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                            {labels.certificateNumber}
                          </p>
                          <p
                            dir="ltr"
                            className="mt-1 truncate text-xs font-semibold text-muted"
                            title={certificate.certificateNumber}
                          >
                            {certificate.certificateNumber}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {active
                            ? labels.active
                            : labels.certificateRevoked}
                        </span>
                      </div>

                      <h2 className="mt-4 line-clamp-2 text-lg font-semibold leading-7 text-content">
                        {title}
                      </h2>
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-3 rounded-lg bg-surface-subtle p-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-muted">
                        {labels.issuedAt}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-content">
                        {formatDate(certificate.issuedAt, locale)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium text-muted">
                        {labels.score}
                      </dt>
                      <dd
                        dir="ltr"
                        className="mt-1 text-sm font-semibold text-content"
                      >
                        {certificate.scorePercentage !== null
                          ? `${certificate.scorePercentage}%`
                          : "—"}
                      </dd>
                    </div>
                  </dl>

                  {active ? (
                    <Link
                      href={`/api/training/certificates/${encodeURIComponent(
                        certificate.id,
                      )}/pdf`}
                      target="_blank"
                      className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="me-2 size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                      </svg>
                      {labels.downloadCertificate}
                    </Link>
                  ) : (
                    <p className="mt-5 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      {certificate.revocationReason ??
                        labels.certificateRevoked}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
