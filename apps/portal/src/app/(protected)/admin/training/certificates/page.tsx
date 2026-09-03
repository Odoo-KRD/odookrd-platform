import { PERMISSIONS, type TrainingCertificatePage } from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { TrainingCertificateRevokeButton } from "@/components/training/training-certificate-revoke-button";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { trainingCertificateDictionaries } from "@/lib/i18n/training-certificates";
import { getTrainingDictionary } from "@/lib/i18n/training-server";

export default async function TrainingCertificatesAdminPage() {
  const [{ session, token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const labels = trainingCertificateDictionaries[locale];
  const result = await apiRequest<TrainingCertificatePage>(
    "/training/certificates/admin",
    { token },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.certificatesTitle}
        description={labels.certificatesDescription}
      />

      {result.items.length === 0 ? (
        <Panel className="p-6">
          <EmptyState
            title={labels.noCertificates}
            description={labels.certificatesDescription}
          />
        </Panel>
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[1150px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-xs text-muted">
                <th className="px-4 py-3 text-start">
                  {labels.certificateNumber}
                </th>
                <th className="px-4 py-3 text-start">{labels.learner}</th>
                <th className="px-4 py-3 text-start">{labels.company}</th>
                <th className="px-4 py-3 text-start">{labels.course}</th>
                <th className="px-4 py-3 text-start">{labels.issuedAt}</th>
                <th className="px-4 py-3 text-start">{labels.status}</th>
                <th className="px-4 py-3 text-end">{labels.revoke}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((certificate) => (
                <tr key={certificate.id}>
                  <td dir="ltr" className="px-4 py-3 font-medium text-content">
                    {certificate.certificateNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-content">
                      {certificate.learnerName}
                    </p>
                    <p dir="ltr" className="mt-1 text-xs text-muted">
                      {certificate.learnerEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {certificate.companyName}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {certificate.courseTitle}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(certificate.issuedAt, locale)}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-end">
                    {certificate.status === "ACTIVE" ? (
                      <TrainingCertificateRevokeButton
                        certificateId={certificate.id}
                        labels={labels}
                      />
                    ) : (
                      <span className="text-xs text-muted">
                        {certificate.revocationReason ?? "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
