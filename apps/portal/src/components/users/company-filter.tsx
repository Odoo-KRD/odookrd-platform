"use client";

import type { Company } from "@odookrd/types";
import { usePathname, useRouter } from "next/navigation";

interface CompanyFilterProps {
  companies: Company[];
  value: string | null;
  allCompanies: string;
  label: string;
}

export function CompanyFilter({
  companies,
  value,
  allCompanies,
  label,
}: CompanyFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  function updateCompany(event: React.ChangeEvent<HTMLSelectElement>): void {
    const parameters = new URLSearchParams(window.location.search);

    if (event.target.value) {
      parameters.set("companyId", event.target.value);
    } else {
      parameters.delete("companyId");
    }

    parameters.delete("offset");

    const query = parameters.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="grid min-w-52 gap-1.5 text-xs font-medium text-slate-600">
      <span>{label}</span>
      <select
        value={value ?? ""}
        onChange={updateCompany}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#714b67]"
      >
        <option value="">{allCompanies}</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </label>
  );
}
