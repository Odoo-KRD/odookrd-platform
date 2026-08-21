import type {
  CompanyServiceStatus,
  ServiceCatalogStatus,
} from "@odookrd/types";
import { Badge } from "@odookrd/ui";

import type { ServicesDictionary } from "@/lib/i18n/services";

const assignmentTones: Record<
  CompanyServiceStatus,
  "neutral" | "success" | "warning" | "danger"
> = {
  PROVISIONING: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  EXPIRED: "danger",
  CANCELLED: "neutral",
};

export function CatalogStatusBadge({
  status,
  labels,
}: {
  status: ServiceCatalogStatus;
  labels: ServicesDictionary;
}) {
  return (
    <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>
      {labels.catalogStatusLabels[status]}
    </Badge>
  );
}

export function AssignmentStatusBadge({
  status,
  labels,
}: {
  status: CompanyServiceStatus;
  labels: ServicesDictionary;
}) {
  return (
    <Badge tone={assignmentTones[status]}>
      {labels.assignmentStatusLabels[status]}
    </Badge>
  );
}
