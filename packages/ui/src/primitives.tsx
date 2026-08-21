import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {children}
    </section>
  );
}

interface PageHeadingProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeading({ title, description, actions }: PageHeadingProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 text-start">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";

const badgeClasses: Record<BadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  accent: "border-[#714b67]/20 bg-[#714b67]/8 text-[#714b67]",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dir?: "ltr" | "rtl";
}

export function Badge({ children, tone = "neutral", dir }: BadgeProps) {
  return (
    <span
      dir={dir}
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${badgeClasses[tone]}`}
    >
      {children}
    </span>
  );
}

interface DataTableProps {
  headings: readonly string[];
  children: ReactNode;
}

export function DataTable({ headings, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headings.map((heading, index) => (
              <th
                key={`${heading}-${index}`}
                scope="col"
                className="border-b border-slate-200 px-5 py-3 text-start text-xs font-semibold text-slate-600"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger";

const buttonClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[#714b67] bg-[#714b67] text-white hover:bg-[#62405a] hover:border-[#62405a]",
  secondary:
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger:
    "border-red-200 bg-white text-red-700 hover:bg-red-50",
};

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function ActionButton({
  variant = "primary",
  className = "",
  ...props
}: ActionButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonClasses[variant]} ${className}`}
    />
  );
}
