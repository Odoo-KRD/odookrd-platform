import type { UserStatus } from "@odookrd/types";
import { Badge } from "@odookrd/ui";

import type { UsersDictionary } from "@/lib/i18n/users";

interface UserStatusBadgeProps {
  status: UserStatus;
  labels: UsersDictionary;
}

export function UserStatusBadge({ status, labels }: UserStatusBadgeProps) {
  const configuration = {
    INVITED: { label: labels.statusInvited, tone: "accent" },
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
