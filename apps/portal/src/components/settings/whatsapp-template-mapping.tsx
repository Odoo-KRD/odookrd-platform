"use client";

import type { ManagedSetting } from "@odookrd/types";
import { Badge } from "@odookrd/ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  WhatsAppTemplateCatalog,
  WhatsAppTemplateCatalogResult,
  WhatsAppTemplateOption,
} from "@/app/(protected)/admin/settings/actions";
import type { SettingsNavigationDictionary } from "@/lib/i18n/settings/navigation";

export const WHATSAPP_TEMPLATE_MAP_KEY =
  "notifications.whatsapp.twilio.content_templates";
export const WHATSAPP_ENABLED_TYPES_KEY =
  "notifications.whatsapp.enabled_types";

/**
 * Notification types that can use a template, with the variables each one
 * sends in {{1}}, {{2}}, … order. Must match WHATSAPP_TEMPLATE_EVENTS in
 * apps/api/src/modules/notifications/providers/whatsapp-template-catalog.ts.
 */
const TEMPLATE_EVENTS = [
  {
    key: "user.invitation",
    slug: "invitation",
    audience: "customer",
    gated: true,
    variables: ["companyName", "expiresAt", "token"],
  },
  {
    key: "helpdesk.ticket.replied",
    slug: "ticket_replied",
    audience: "customer",
    gated: true,
    variables: ["reference", "subject"],
  },
  {
    key: "helpdesk.ticket.resolved",
    slug: "ticket_resolved",
    audience: "customer",
    gated: true,
    variables: ["reference", "subject"],
  },
  {
    key: "subscription.reminder",
    slug: "subscription_reminder",
    audience: "customer",
    gated: true,
    variables: ["serviceName", "expiresOn"],
  },
  {
    key: "admin.broadcast",
    slug: "broadcast",
    audience: "customer",
    gated: false,
    variables: ["title", "body"],
  },
  {
    key: "admin.helpdesk.ticket.created",
    slug: "admin_ticket_created",
    audience: "staff",
    gated: true,
    variables: ["reference", "subject", "companyName"],
  },
  {
    key: "admin.helpdesk.customer.replied",
    slug: "admin_customer_replied",
    audience: "staff",
    gated: true,
    variables: ["reference", "subject", "companyName"],
  },
  {
    key: "admin.renewal.requested",
    slug: "admin_renewal_requested",
    audience: "staff",
    gated: true,
    variables: ["companyName", "serviceName"],
  },
  {
    key: "admin.invitation.accepted",
    slug: "admin_invitation_accepted",
    audience: "staff",
    gated: true,
    variables: ["userName", "companyName"],
  },
  {
    key: "admin.course.completed",
    slug: "admin_course_completed",
    audience: "staff",
    gated: true,
    variables: ["learnerName", "courseTitle", "companyName"],
  },
  {
    key: "admin.certificate.issued",
    slug: "admin_certificate_issued",
    audience: "staff",
    gated: true,
    variables: ["learnerName", "courseTitle", "companyName"],
  },
  {
    key: "admin.knowledge.feedback",
    slug: "admin_knowledge_feedback",
    audience: "staff",
    gated: true,
    variables: ["articleTitle", "companyName", "comment"],
  },
] as const;

type TemplateEvent = (typeof TEMPLATE_EVENTS)[number];

const LOCALES = ["ku", "ar", "en"] as const;
/** The three languages plus "default", used for any other language. */
const SLOTS = [...LOCALES, "default"] as const;
type TemplateLocale = (typeof LOCALES)[number];
type TemplateSlot = (typeof SLOTS)[number];
type Mapping = Record<string, Partial<Record<TemplateSlot, string>>>;
type JsonObject = Record<string, unknown>;

const SID_PATTERN = /^HX[0-9a-f]{32}$/i;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The stored map; an unreadable value is treated as empty. */
function parseStoredMap(value: unknown): JsonObject {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function initialMapping(stored: JsonObject): Mapping {
  const mapping: Mapping = {};
  for (const event of TEMPLATE_EVENTS) {
    const entry = stored[event.key];
    const locales: Partial<Record<TemplateSlot, string>> = {};
    if (isObject(entry)) {
      for (const locale of SLOTS) {
        const sid = entry[locale];
        if (typeof sid === "string" && SID_PATTERN.test(sid)) {
          locales[locale] = sid;
        }
      }
    }
    mapping[event.key] = locales;
  }
  return mapping;
}

/**
 * Rebuilds the stored JSON: mapped events get the platform's variable order
 * and their chosen templates; anything else in the stored map (other
 * notification types, unknown fields) is kept as it was.
 */
function serializeMapping(stored: JsonObject, mapping: Mapping): string {
  const next: JsonObject = { ...stored };

  for (const event of TEMPLATE_EVENTS) {
    const existing = isObject(stored[event.key]) ? stored[event.key] : {};
    const rest: JsonObject = { ...(existing as JsonObject) };
    delete rest.variables;
    for (const locale of SLOTS) delete rest[locale];

    const chosen = Object.fromEntries(
      SLOTS.flatMap((locale) => {
        const sid = mapping[event.key]?.[locale];
        return sid ? [[locale, sid]] : [];
      }),
    );

    if (Object.keys(chosen).length === 0 && Object.keys(rest).length === 0) {
      delete next[event.key];
    } else {
      next[event.key] = {
        variables: [...event.variables],
        ...rest,
        ...chosen,
      };
    }
  }

  return Object.keys(next).length === 0 ? "" : JSON.stringify(next, null, 2);
}

function parseEnabledTypes(value: unknown): Set<string> {
  if (typeof value !== "string") return new Set();
  return new Set(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function nameVersion(
  template: WhatsAppTemplateOption,
  slug: string,
  locale: TemplateLocale,
): number | null {
  const match = new RegExp(`^odookrd_${slug}_v(\\d+)_${locale}$`, "i").exec(
    template.friendlyName,
  );
  return match ? Number(match[1]) : null;
}

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

interface WhatsAppTemplateMappingProps {
  mapSetting: ManagedSetting | undefined;
  enabledTypesSetting: ManagedSetting | undefined;
  canManage: boolean;
  provider: string;
  labels: SettingsNavigationDictionary["whatsappTemplates"];
  loadTemplates: () => Promise<WhatsAppTemplateCatalogResult>;
}

export function WhatsAppTemplateMapping({
  mapSetting,
  enabledTypesSetting,
  canManage,
  provider,
  labels,
  loadTemplates,
}: WhatsAppTemplateMappingProps) {
  const editable = Boolean(canManage && mapSetting?.editable);
  const typesEditable = Boolean(canManage && enabledTypesSetting?.editable);
  const stored = useMemo(
    () => parseStoredMap(mapSetting?.value),
    [mapSetting?.value],
  );
  const [mapping, setMapping] = useState<Mapping>(() =>
    initialMapping(stored),
  );
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(() =>
    parseEnabledTypes(enabledTypesSetting?.value),
  );
  const [catalog, setCatalog] = useState<WhatsAppTemplateCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await loadTemplates();
      if (result.ok) {
        setCatalog(result.catalog);
      } else {
        setLoadError(result.message);
      }
    } catch {
      setLoadError(labels.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [labels.loadFailed, loadTemplates]);

  useEffect(() => {
    // Loaded once when the tab opens; the refresh button reloads it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const templates = useMemo(() => catalog?.templates ?? [], [catalog]);
  const templatesBySid = useMemo(
    () => new Map(templates.map((template) => [template.sid, template])),
    [templates],
  );
  const serialized = useMemo(
    () => serializeMapping(stored, mapping),
    [mapping, stored],
  );

  // Kept in catalog order so the stored value is stable.
  const enabledTypesValue = TEMPLATE_EVENTS.filter(
    (event) => event.gated && enabledTypes.has(event.key),
  )
    .map((event) => event.key)
    .join(",");

  function toggleType(eventKey: string, on: boolean) {
    setEnabledTypes((current) => {
      const next = new Set(current);
      if (on) next.add(eventKey);
      else next.delete(eventKey);
      return next;
    });
  }

  function choose(eventKey: string, locale: TemplateSlot, sid: string) {
    setMapping((current) => ({
      ...current,
      [eventKey]: { ...current[eventKey], [locale]: sid || undefined },
    }));
  }

  function autoMatch() {
    setMapping((current) => {
      const next: Mapping = { ...current };
      for (const event of TEMPLATE_EVENTS) {
        const locales = { ...next[event.key] };
        for (const locale of LOCALES) {
          if (locales[locale]) continue;
          const best = templates
            .map((template) => ({
              template,
              version: nameVersion(template, event.slug, locale),
            }))
            .filter(
              (candidate): candidate is {
                template: WhatsAppTemplateOption;
                version: number;
              } => candidate.version !== null,
            )
            .sort((left, right) => {
              const approved =
                Number(right.template.approvalStatus === "approved") -
                Number(left.template.approvalStatus === "approved");
              return approved !== 0 ? approved : right.version - left.version;
            })[0];
          if (best) locales[locale] = best.template.sid;
        }
        next[event.key] = locales;
      }
      return next;
    });
  }

  function statusLabel(status: string | null): string {
    if (!status) return "—";
    return labels.statuses[status] ?? status;
  }

  function warnings(event: TemplateEvent, sid: string | undefined): string[] {
    if (!sid || !catalog || catalog.error) return [];
    const template = templatesBySid.get(sid);
    if (!template) return [labels.notFound];
    const found: string[] = [];
    if (template.approvalStatus !== "approved") found.push(labels.notApproved);
    if (template.variableCount !== event.variables.length) {
      found.push(
        fill(labels.expectsVariables, {
          count: event.variables.length,
          actual: template.variableCount,
        }),
      );
    }
    if (
      event.key === "user.invitation" &&
      !template.buttonUrls.some((url) =>
        url.includes("/invitation/accept?token={{3}}"),
      )
    ) {
      found.push(labels.invitationButton);
    }
    return found;
  }

  function renderEvent(event: TemplateEvent) {
    const copy = labels.events[event.key] ?? {
      label: event.key,
      description: event.key,
    };
    const suggested = templates.filter((template) =>
      template.friendlyName.toLowerCase().startsWith(`odookrd_${event.slug}_`),
    );
    const others = templates.filter(
      (template) => !suggested.includes(template),
    );
    const ordered = [...suggested, ...others];
    const enabled = !event.gated || enabledTypes.has(event.key);
    const anyMapped = SLOTS.some((slot) => mapping[event.key]?.[slot]);
    const toggleId = `whatsapp-type-${event.key}`;

    return (
      <section
        key={event.key}
        className={`rounded-xl border border-line p-4 sm:p-5 ${
          enabled ? "bg-slate-50/60" : "bg-white"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-content">
              {copy.label}
            </h4>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
              {copy.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" dir="ltr">
              {event.key}
            </Badge>
            {event.gated ? (
              <Badge tone={enabled ? "success" : "neutral"}>
                {enabled ? labels.whatsappOn : labels.whatsappOff}
              </Badge>
            ) : null}
          </div>
        </div>

        {event.gated ? (
          <label
            htmlFor={toggleId}
            className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm text-content"
          >
            <input
              id={toggleId}
              type="checkbox"
              checked={enabled}
              disabled={!typesEditable}
              onChange={(change) => toggleType(event.key, change.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-brand"
            />
            {labels.sendByWhatsapp}
          </label>
        ) : (
          <p className="mt-4 text-xs leading-5 text-muted">
            {labels.broadcastControlled}
          </p>
        )}

        {event.gated && enabled && !anyMapped ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            {labels.enabledWithoutTemplate}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{labels.variables}:</span>
          {event.variables.map((name, index) => (
            <Badge key={name} tone="accent" dir="ltr">
              {`{{${index + 1}}} ${name}`}
            </Badge>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SLOTS.map((slot) => {
            const sid = mapping[event.key]?.[slot];
            const known = sid ? templatesBySid.has(sid) : true;
            const problems = warnings(event, sid);
            const id = `template-${event.key}-${slot}`;

            return (
              <div
                key={slot}
                className="grid content-start gap-2 rounded-lg border border-line bg-white p-4"
              >
                <label
                  htmlFor={id}
                  className="text-sm font-semibold text-content"
                >
                  {slot === "default"
                    ? labels.fallbackLanguage
                    : labels.languages[slot]}
                </label>
                <select
                  id={id}
                  dir="ltr"
                  value={sid ?? ""}
                  disabled={!editable}
                  onChange={(change) =>
                    choose(event.key, slot, change.target.value)
                  }
                  className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-content disabled:bg-slate-50 disabled:text-muted"
                >
                  <option value="">
                    {slot === "default" ? labels.noFallback : labels.notMapped}
                  </option>
                  {sid && !known ? (
                    <option value={sid}>{`${sid} (${labels.notFound})`}</option>
                  ) : null}
                  {ordered.map((template) => (
                    <option key={template.sid} value={template.sid}>
                      {`${template.friendlyName} · ${statusLabel(
                        template.approvalStatus,
                      )}`}
                    </option>
                  ))}
                </select>
                {sid ? (
                  <p
                    dir="ltr"
                    className="truncate font-mono text-[11px] text-muted"
                  >
                    {sid}
                  </p>
                ) : null}
                {problems.map((problem) => (
                  <p
                    key={problem}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
                  >
                    {problem}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const catalogError = catalog?.error ?? null;

  return (
    <div className="grid gap-5">
      {editable && mapSetting ? (
        <>
          <input type="hidden" name="editable" value={mapSetting.key} />
          <input
            type="hidden"
            name={`setting.${mapSetting.key}`}
            value={serialized}
          />
        </>
      ) : null}
      {typesEditable && enabledTypesSetting ? (
        <>
          <input
            type="hidden"
            name="editable"
            value={enabledTypesSetting.key}
          />
          <input
            type="hidden"
            name={`setting.${enabledTypesSetting.key}`}
            value={enabledTypesValue}
          />
        </>
      ) : null}

      <div className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-content">{labels.title}</p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
              {labels.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? labels.refreshing : labels.refresh}
            </button>
            {editable ? (
              <button
                type="button"
                onClick={autoMatch}
                disabled={loading || templates.length === 0}
                title={labels.autoMatchHelp}
                className="inline-flex h-9 items-center rounded-md border border-brand/30 bg-white px-3 text-xs font-semibold text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.autoMatch}
              </button>
            ) : null}
          </div>
        </div>

        {provider !== "twilio" ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {labels.twilioOnly}
          </p>
        ) : null}

        {loadError || catalogError ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {catalogError === "WHATSAPP_CONFIGURATION_MISSING"
              ? labels.configurationMissing
              : `${labels.loadFailed}${
                  catalogError ? ` (${catalogError})` : loadError ? `: ${loadError}` : ""
                }`}
          </p>
        ) : catalog ? (
          <p className="mt-4 text-xs text-muted">
            {templates.length > 0
              ? fill(labels.templatesFound, { count: templates.length })
              : labels.noTemplates}
          </p>
        ) : null}
      </div>

      {(["customer", "staff"] as const).map((audience) => (
        <div key={audience} className="grid gap-4">
          <div>
            <h3 className="text-sm font-semibold text-content">
              {labels.audiences[audience].title}
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
              {labels.audiences[audience].description}
            </p>
          </div>
          {TEMPLATE_EVENTS.filter((event) => event.audience === audience).map(
            (event) => renderEvent(event),
          )}
        </div>
      ))}

      {editable || typesEditable ? (
        <p className="text-xs text-muted">{labels.unsavedHint}</p>
      ) : null}
    </div>
  );
}
