import type { CompanyStatus } from "@odookrd/types";
import { Badge } from "@odookrd/ui";

import type { CompaniesDictionary } from "@/lib/i18n/types";

interface CompanyStatusBadgeProps {
  status: CompanyStatus;
  labels: CompaniesDictionary;
}

export function CompanyStatusBadge({
  status,
  labels,
}: CompanyStatusBadgeProps) {
  const configuration = {
    ACTIVE: { label: labels.statusActive, tone: "success" },
    SUSPENDED: { label: labels.statusSuspended, tone: "warning" },
    ARCHIVED: { label: labels.statusArchived, tone: "neutral" },
  } as const;

  return (
    <Badge tone={configuration[status].tone}>
      {configuration[status].label}
    </Badge>
  );
}
