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

/**
 * Notification types that can use a template, with the variables each one
 * sends in {{1}}, {{2}}, … order. Must match WHATSAPP_TEMPLATE_EVENTS in
 * apps/api/src/modules/notifications/providers/whatsapp-template-catalog.ts.
 */
const TEMPLATE_EVENTS = [
  {
    key: "user.invitation",
    slug: "invitation",
    variables: ["companyName", "expiresAt", "token"],
  },
  {
    key: "helpdesk.ticket.replied",
    slug: "ticket_replied",
    variables: ["reference", "subject"],
  },
  {
    key: "helpdesk.ticket.resolved",
    slug: "ticket_resolved",
    variables: ["reference", "subject"],
  },
  {
    key: "subscription.reminder",
    slug: "subscription_reminder",
    variables: ["serviceName", "expiresOn"],
  },
] as const;

const LOCALES = ["ku", "ar", "en"] as const;
type TemplateLocale = (typeof LOCALES)[number];
type Mapping = Record<string, Partial<Record<TemplateLocale, string>>>;
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
    const locales: Partial<Record<TemplateLocale, string>> = {};
    if (isObject(entry)) {
      for (const locale of LOCALES) {
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
 * notification types, a "default" template) is kept as it was.
 */
function serializeMapping(stored: JsonObject, mapping: Mapping): string {
  const next: JsonObject = { ...stored };

  for (const event of TEMPLATE_EVENTS) {
    const existing = isObject(stored[event.key]) ? stored[event.key] : {};
    const rest: JsonObject = { ...(existing as JsonObject) };
    delete rest.variables;
    for (const locale of LOCALES) delete rest[locale];

    const chosen = Object.fromEntries(
      LOCALES.flatMap((locale) => {
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
  setting: ManagedSetting;
  editable: boolean;
  provider: string;
  labels: SettingsNavigationDictionary["whatsappTemplates"];
  loadTemplates: () => Promise<WhatsAppTemplateCatalogResult>;
}

export function WhatsAppTemplateMapping({
  setting,
  editable,
  provider,
  labels,
  loadTemplates,
}: WhatsAppTemplateMappingProps) {
  const stored = useMemo(() => parseStoredMap(setting.value), [setting.value]);
  const [mapping, setMapping] = useState<Mapping>(() =>
    initialMapping(stored),
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

  function choose(eventKey: string, locale: TemplateLocale, sid: string) {
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

  function warnings(
    event: (typeof TEMPLATE_EVENTS)[number],
    sid: string | undefined,
  ): string[] {
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

  const catalogError = catalog?.error ?? null;

  return (
    <div className="grid gap-5">
      {editable ? (
        <>
          <input type="hidden" name="editable" value={setting.key} />
          <input
            type="hidden"
            name={`setting.${setting.key}`}
            value={serialized}
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

      {TEMPLATE_EVENTS.map((event) => {
        const copy = labels.events[event.key] ?? {
          label: event.key,
          description: event.key,
        };
        const suggested = templates.filter((template) =>
          template.friendlyName
            .toLowerCase()
            .startsWith(`odookrd_${event.slug}_`),
        );
        const others = templates.filter(
          (template) => !suggested.includes(template),
        );
        const ordered = [...suggested, ...others];

        return (
          <section
            key={event.key}
            className="rounded-xl border border-line bg-slate-50/60 p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-content">
                  {copy.label}
                </h3>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
                  {copy.description}
                </p>
              </div>
              <Badge tone="neutral" dir="ltr">
                {event.key}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{labels.variables}:</span>
              {event.variables.map((name, index) => (
                <Badge key={name} tone="accent" dir="ltr">
                  {`{{${index + 1}}} ${name}`}
                </Badge>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {LOCALES.map((locale) => {
                const sid = mapping[event.key]?.[locale];
                const known = sid ? templatesBySid.has(sid) : true;
                const problems = warnings(event, sid);
                const id = `template-${event.key}-${locale}`;

                return (
                  <div
                    key={locale}
                    className="grid content-start gap-2 rounded-lg border border-line bg-white p-4"
                  >
                    <label
                      htmlFor={id}
                      className="text-sm font-semibold text-content"
                    >
                      {labels.languages[locale]}
                    </label>
                    <select
                      id={id}
                      dir="ltr"
                      value={sid ?? ""}
                      disabled={!editable}
                      onChange={(change) =>
                        choose(event.key, locale, change.target.value)
                      }
                      className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-content disabled:bg-slate-50 disabled:text-muted"
                    >
                      <option value="">{labels.notMapped}</option>
                      {sid && !known ? (
                        <option value={sid}>
                          {`${sid} (${labels.notFound})`}
                        </option>
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
                      <p dir="ltr" className="truncate font-mono text-[11px] text-muted">
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
      })}

      {editable ? (
        <p className="text-xs text-muted">{labels.unsavedHint}</p>
      ) : null}
    </div>
  );
}
