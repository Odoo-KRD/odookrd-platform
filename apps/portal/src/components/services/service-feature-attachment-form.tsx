"use client";

import type {
  ManagedServiceFeature,
  ServiceFeatureDefinition,
} from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { ServiceFeaturesDictionary } from "@/lib/i18n/services/features";
import type { ServicesDictionary } from "@/lib/i18n/services";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

type AttachmentFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface ServiceFeatureAttachmentFormProps {
  action: AttachmentFormAction;
  labels: ServicesDictionary;
  features: ServiceFeaturesDictionary;
  content: ContentEditorDictionary;
  definitions?: readonly ServiceFeatureDefinition[];
  initial?: ManagedServiceFeature;
  cancelAction?: () => void;
  successAction?: () => void;
}

const fieldClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export function ServiceFeatureAttachmentForm({
  action,
  labels,
  features,
  content,
  definitions = [],
  initial,
  cancelAction,
  successAction,
}: ServiceFeatureAttachmentFormProps) {
  const formId = useId();
  const [state, formAction, pending] = useActionState(
    async (previousState: FormState, formData: FormData) => {
      const result = await action(previousState, formData);

      if (result.message === null) {
        successAction?.();
      }

      return result;
    },
    { message: null },
  );
  const [definitionId, setDefinitionId] = useState(definitions[0]?.id ?? "");
  const definition = definitions.find((item) => item.id === definitionId);
  const selected = initial ?? definition;

  if (!selected) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-slate-500">
          {features.noAvailableDefinitions}
        </p>
        <Link
          href="/admin/services/features/new"
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          {features.newFeatureDefinition}
        </Link>
      </div>
    );
  }

  const valueType = selected.valueType;
  const parameterLabel =
    selected.parameterLabel?.trim() || features.defaultValue;

  return (
    <form action={formAction} className="grid max-w-2xl gap-4">
      <input type="hidden" name="valueType" value={valueType} />

      {initial ? null : (
        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-definition`}
            className="text-sm font-medium text-slate-700"
          >
            {features.chooseFeature}
          </label>
          <select
            id={`${formId}-definition`}
            name="definitionId"
            value={definitionId}
            onChange={(event) => setDefinitionId(event.currentTarget.value)}
            className={fieldClassName}
          >
            {definitions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {valueType === "TEXT" ? (
        <LocalizedTextFields
          key={selected.id}
          field="attachmentValue"
          label={parameterLabel}
          content={content}
          translations={selected.valueTranslations}
          fallback={
            typeof selected.defaultValue === "string"
              ? selected.defaultValue
              : undefined
          }
          maxLength={500}
          required
        />
      ) : (
        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-value`}
            className="text-sm font-medium text-slate-700"
          >
            {parameterLabel}
          </label>

          {valueType === "BOOLEAN" ? (
            <select
              key={selected.id}
              id={`${formId}-value`}
              name="value"
              defaultValue={String(selected.defaultValue)}
              className={fieldClassName}
            >
              <option value="true">{features.yes}</option>
              <option value="false">{features.no}</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                key={selected.id}
                id={`${formId}-value`}
                name="value"
                type="number"
                dir="ltr"
                step="any"
                defaultValue={
                  typeof selected.defaultValue === "number"
                    ? selected.defaultValue
                    : undefined
                }
                required
                className={fieldClassName}
              />
              {selected.unit ? (
                <span dir="ltr" className="text-sm font-medium text-slate-600">
                  {selected.unit}
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          name="customerVisible"
          type="checkbox"
          defaultChecked={initial?.customerVisible ?? true}
          className="size-4 rounded border-slate-300 accent-brand"
        />
        {features.visibleToCustomer}
      </label>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <ActionButton type="submit" disabled={pending}>
          {pending
            ? labels.saving
            : initial
              ? labels.save
              : features.addFeature}
        </ActionButton>
        {cancelAction ? (
          <button
            type="button"
            onClick={cancelAction}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
          >
            {labels.cancel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
