import type { LocalizedText } from "@odookrd/types";

/** A department as the staff API returns it, with its ticket count. */
export interface AdminDepartment {
  id: string;
  slug: string;
  /** Resolved to the request locale by the API. */
  name: string;
  nameTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  status: "ACTIVE" | "ARCHIVED";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: { tickets: number };
}
