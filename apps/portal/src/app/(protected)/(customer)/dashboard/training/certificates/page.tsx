import { PERMISSIONS, type TrainingCertificatePage } from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { trainingCertificateDictionaries } from "@/lib/i18n/training-certificates";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

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
    <div className="grid gap-7">
      <PageHeading
        title={labels.myCertificatesTitle}
        description={labels.myCertificatesDescription}
      />

      {result.items.length === 0 ? (
        <Panel className="p-6">
          <EmptyState
            title={labels.noCertificates}
            description={labels.myCertificatesDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.items.map((certificate) => (
            <Panel key={certificate.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                    {labels.certificateNumber}
                  </p>
                  <p
                    dir="ltr"
                    className="mt-1 text-sm font-semibold text-content"
                  >
                    {certificate.certificateNumber}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    certificate.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {certificate.status === "ACTIVE"
                    ? labels.active
                    : labels.certificateRevoked}
                </span>
              </div>

              <h2 className="mt-5 text-lg font-semibold text-content">
                {localizeTrainingText(
                  certificate.courseTitle,
                  certificate.courseTitleTranslations,
                  locale,
                )}
              </h2>

              <p className="mt-2 text-sm text-muted">
                {labels.issuedAt}: {formatDate(certificate.issuedAt, locale)}
              </p>

              {certificate.scorePercentage !== null ? (
                <p className="mt-1 text-sm text-muted">
                  {labels.score}:{" "}
                  <span dir="ltr">{certificate.scorePercentage}%</span>
                </p>
              ) : null}

              {certificate.status === "ACTIVE" ? (
                <Link
                  href={`/api/training/certificates/${encodeURIComponent(certificate.id)}/pdf`}
                  target="_blank"
                  className="mt-5 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  {labels.downloadCertificate}
                </Link>
              ) : (
                <p className="mt-5 text-sm text-red-700">
                  {certificate.revocationReason ?? labels.certificateRevoked}
                </p>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
