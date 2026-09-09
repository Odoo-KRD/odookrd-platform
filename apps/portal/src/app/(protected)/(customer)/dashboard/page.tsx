import {
  PERMISSIONS,
  type CustomerAccountProfile,
  type CustomerWorkspaceOverview,
  type NotificationUnreadCount,
  type TrainingDashboardSummary,
} from "@odookrd/types";
import Image from "next/image";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import {
  getCustomerAccountApiContext,
  hasPermission,
} from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import {
  customerDashboardV2Dictionaries,
  type CustomerDashboardV2Dictionary,
} from "@/lib/i18n/portal/dashboard";
import { getFrontendDictionary } from "@/lib/i18n/frontend/server";
import { localizeTrainingText } from "@/lib/training-display";

function DashboardIcon({
  kind,
}: {
  kind:
    | "services"
    | "learning"
    | "completed"
    | "notifications"
    | "profile"
    | "company";
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    className: "size-5",
    "aria-hidden": true,
  } as const;

  if (kind === "services") {
    return (
      <svg {...common}>
        <path d="M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4" />
      </svg>
    );
  }
  if (kind === "learning") {
    return (
      <svg {...common}>
        <path d="M4 5.5h11a3 3 0 0 1 3 3V20H7a3 3 0 0 1-3-3V5.5ZM7 5.5V20M10 9h5M10 13h5" />
      </svg>
    );
  }
  if (kind === "completed") {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3ZM9 12l2 2 4-5" />
      </svg>
    );
  }
  if (kind === "notifications") {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </svg>
    );
  }
  if (kind === "company") {
    return (
      <svg {...common}>
        <path d="M4 20V7l8-3v16M12 9h8v11M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function LearningProgressChart({
  summary,
  labels,
}: {
  summary: TrainingDashboardSummary;
  labels: CustomerDashboardV2Dictionary["dashboard"];
}) {
  const percentage = Math.max(
    0,
    Math.min(100, summary.metrics.averageProgressPercentage),
  );
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage / 100) * circumference;

  return (
    <section className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-content">
            {labels.learningProgress}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {labels.learningProgressDescription}
          </p>
        </div>
        <Link
          href="/dashboard/training"
          className="text-sm font-semibold text-brand hover:text-brand-hover"
        >
          {labels.viewAllCourses}
        </Link>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
        <div className="relative mx-auto size-36">
          <svg
            viewBox="0 0 120 120"
            className="size-36 -rotate-90"
            aria-label={`${labels.averageProgress}: ${percentage}%`}
          >
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              className="text-brand"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span dir="ltr" className="text-2xl font-semibold text-content">
              {percentage}%
            </span>
            <span className="mt-1 text-[11px] font-medium text-muted">
              {labels.averageProgress}
            </span>
          </div>
        </div>

        <dl className="grid gap-3">
          {[
            [labels.completed, summary.metrics.completed, "bg-emerald-500"],
            [labels.inProgress, summary.metrics.inProgress, "bg-brand"],
            [labels.notStarted, summary.metrics.notStarted, "bg-slate-300"],
          ].map(([label, value, dot]) => (
            <div
              key={String(label)}
              className="flex items-center justify-between gap-4 rounded-lg bg-surface-subtle px-3.5 py-3"
            >
              <dt className="flex items-center gap-2 text-sm text-muted">
                <span className={`size-2.5 rounded-full ${dot}`} />
                {label}
              </dt>
              <dd className="text-sm font-semibold text-content">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default async function CustomerDashboardPage() {
  const [{ session, token }, { locale }] = await Promise.all([
    getCustomerAccountApiContext(),
    getFrontendDictionary(),
  ]);
  const labels = customerDashboardV2Dictionaries[locale].dashboard;

  const canServices = hasPermission(session, PERMISSIONS.SERVICES_READ);
  const canTraining = hasPermission(session, PERMISSIONS.TRAINING_READ);
  const canNotifications = hasPermission(
    session,
    PERMISSIONS.NOTIFICATIONS_READ,
  );
  const canCompany = hasPermission(session, PERMISSIONS.COMPANIES_READ);

  const [profile, servicesOverview, trainingSummary, unread] =
    await Promise.all([
      apiRequest<CustomerAccountProfile>("/workspace/profile", { token }),
      canServices
        ? apiRequest<CustomerWorkspaceOverview>("/workspace/overview", {
            token,
          })
        : Promise.resolve(null),
      canTraining
        ? apiRequest<TrainingDashboardSummary>("/training/dashboard-summary", {
            token,
          })
        : Promise.resolve(null),
      canNotifications
        ? apiRequest<NotificationUnreadCount>("/notifications/unread-count", {
            token,
          })
        : Promise.resolve(null),
    ]);

  const name =
    profile.displayName?.trim() ||
    profile.certificateName?.trim() ||
    profile.email.split("@")[0] ||
    "";
  const welcome = name
    ? labels.welcome.replace("{name}", name)
    : labels.welcomeFallback;

  const kpis = [
    canServices && servicesOverview
      ? {
          label: labels.activeServices,
          value: servicesOverview.summary.active,
          kind: "services" as const,
          href: "/dashboard/services",
        }
      : null,
    canTraining && trainingSummary
      ? {
          label: labels.coursesInProgress,
          value: trainingSummary.metrics.inProgress,
          kind: "learning" as const,
          href: "/dashboard/training",
        }
      : null,
    canTraining && trainingSummary
      ? {
          label: labels.completedCourses,
          value: trainingSummary.metrics.completed,
          kind: "completed" as const,
          href: "/dashboard/training/certificates",
        }
      : null,
    canNotifications && unread
      ? {
          label: labels.unreadNotifications,
          value: unread.unread,
          kind: "notifications" as const,
          href: "/dashboard/notifications",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const quickLinks = [
    canServices
      ? {
          href: "/dashboard/services",
          label: labels.services,
          kind: "services" as const,
        }
      : null,
    {
      href: "/dashboard/profile",
      label: labels.profile,
      kind: "profile" as const,
    },
    canCompany
      ? {
          href: "/dashboard/company",
          label: labels.company,
          kind: "company" as const,
        }
      : null,
    canNotifications
      ? {
          href: "/dashboard/notifications",
          label: labels.notifications,
          kind: "notifications" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="grid gap-6 sm:gap-7">
      <section className="overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm">
        <div className="relative px-5 py-6 sm:px-7 sm:py-8 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 end-0 hidden w-1/3 bg-gradient-to-s from-brand-soft/70 to-transparent lg:block"
          />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {labels.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
              {welcome}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              {labels.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="font-semibold text-content">
                {profile.company.name}
              </span>
              <span dir="ltr">{profile.email}</span>
            </div>
          </div>
        </div>
      </section>

      {kpis.length > 0 ? (
        <section
          className={`grid gap-4 sm:grid-cols-2 ${kpis.length >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
        >
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group rounded-xl border border-line bg-surface-panel p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{kpi.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-content">
                    {kpi.value}
                  </p>
                </div>
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <DashboardIcon kind={kpi.kind} />
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      <div
        className={`grid gap-6 ${canTraining && trainingSummary?.enabled ? "xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]" : ""}`}
      >
        {canTraining && trainingSummary?.enabled ? (
          <LearningProgressChart summary={trainingSummary} labels={labels} />
        ) : null}

        <section className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-content">
            {labels.quickAccess}
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-12 items-center gap-3 rounded-lg border border-line px-3.5 py-3 text-sm font-semibold text-content transition hover:bg-surface-subtle hover:text-brand"
              >
                <span className="text-brand">
                  <DashboardIcon kind={link.kind} />
                </span>
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                <span
                  aria-hidden="true"
                  className="text-muted rtl:-scale-x-100"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {canTraining && trainingSummary?.enabled ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-content">
                {labels.myLearning}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {labels.myLearningDescription}
              </p>
            </div>
            <Link
              href="/dashboard/training"
              className="text-sm font-semibold text-brand hover:text-brand-hover"
            >
              {labels.viewAllCourses}
            </Link>
          </div>

          {trainingSummary.courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface-panel px-5 py-10 text-center">
              <p className="text-sm font-semibold text-content">
                {labels.noCourses}
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
                {labels.noCoursesDescription}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {trainingSummary.courses.map((item) => {
                const title = localizeTrainingText(
                  item.course.title,
                  item.course.titleTranslations,
                  locale,
                );
                const category = localizeTrainingText(
                  item.course.category.name,
                  item.course.category.nameTranslations,
                  locale,
                );
                const courseHref = `/dashboard/training/${encodeURIComponent(item.course.slug)}`;
                const continueHref = item.progress.resumeLessonId
                  ? `${courseHref}/lessons/${encodeURIComponent(item.progress.resumeLessonId)}`
                  : courseHref;
                const completed = item.progress.status === "COMPLETED";
                const primaryHref = completed
                  ? courseHref
                  : item.progress.status === "IN_PROGRESS"
                    ? continueHref
                    : courseHref;
                const primaryLabel = completed
                  ? labels.viewCourse
                  : item.progress.status === "IN_PROGRESS"
                    ? labels.continueLearning
                    : labels.startCourse;
                const activityDate =
                  item.progress.lastAccessedAt ?? item.completedAt;

                return (
                  <article
                    key={item.course.id}
                    className="group flex min-h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <Link
                      href={courseHref}
                      className="block overflow-hidden bg-surface-subtle"
                      aria-label={title}
                    >
                      <div className="aspect-video overflow-hidden">
                        {item.course.hasCover ? (
                          <Image
                            src={`/api/training/catalog/${encodeURIComponent(item.course.slug)}/cover`}
                            alt=""
                            width={640}
                            height={360}
                            unoptimized
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-brand-soft/60 px-6 text-center text-sm font-semibold text-brand">
                            {category}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex max-w-full rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                          <span className="truncate">{category}</span>
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${completed ? "text-emerald-700" : item.progress.status === "IN_PROGRESS" ? "text-brand" : "text-muted"}`}
                        >
                          {completed
                            ? labels.courseCompleted
                            : item.progress.status === "IN_PROGRESS"
                              ? labels.inProgress
                              : labels.notStarted}
                        </span>
                      </div>

                      <Link
                        href={courseHref}
                        className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-content hover:text-brand"
                      >
                        {title}
                      </Link>

                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-3 text-xs text-muted">
                          <span>
                            {item.progress.completedLessons}/
                            {item.progress.totalLessons}{" "}
                            {labels.lessonsCompleted}
                          </span>
                          <span
                            dir="ltr"
                            className="font-semibold text-content"
                          >
                            {item.progress.percentage}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${completed ? "bg-emerald-500" : "bg-brand"}`}
                            style={{
                              width: `${Math.max(0, Math.min(100, item.progress.percentage))}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 min-h-5 text-xs text-muted">
                        {activityDate ? (
                          <span>
                            {labels.recentActivity}:{" "}
                            {formatDate(activityDate, locale)}
                          </span>
                        ) : (
                          <span>{labels.noRecentActivity}</span>
                        )}
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <Link
                          href={primaryHref}
                          className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
                        >
                          {primaryLabel}
                        </Link>
                        {completed && item.certificate?.status === "ACTIVE" ? (
                          <Link
                            href={`/api/training/certificates/${encodeURIComponent(item.certificate.id)}/pdf`}
                            target="_blank"
                            className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-content hover:bg-surface-subtle"
                          >
                            {labels.viewCertificate}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
