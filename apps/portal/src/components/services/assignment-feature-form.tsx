"use client";

import type { CompanyServiceFeature } from "@odookrd/types";
import { useActionState, useId } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { ServiceFeaturesDictionary } from "@/lib/i18n/service-features";
import type { ServicesDictionary } from "@/lib/i18n/services";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

interface AssignmentFeatureFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  assignmentFeature: CompanyServiceFeature;
  labels: ServicesDictionary;
  features: ServiceFeaturesDictionary;
  content: ContentEditorDictionary;
}

const inputClassName =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

export function AssignmentFeatureForm({
  action,
  assignmentFeature,
  labels,
  features,
  content,
}: AssignmentFeatureFormProps) {
  const fieldId = useId();
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const valueType = assignmentFeature.feature.valueType;

  return (
    <form action={formAction} className="grid max-w-2xl gap-4">
      {valueType === "TEXT" ? (
        <LocalizedTextFields
          field="assignmentValue"
          label={features.effectiveValue}
          content={content}
          translations={assignmentFeature.valueTranslations}
          fallback={
            typeof assignmentFeature.value === "string"
              ? assignmentFeature.value
              : undefined
          }
          maxLength={500}
          required
        />
      ) : (
        <div className="grid gap-2">
          <label
            htmlFor={`${fieldId}-value`}
            className="text-sm font-medium text-slate-700"
          >
            {features.effectiveValue}
          </label>
          {valueType === "BOOLEAN" ? (
            <select
              id={`${fieldId}-value`}
              name="value"
              defaultValue={String(assignmentFeature.value)}
              className={inputClassName}
            >
              <option value="true">{features.yes}</option>
              <option value="false">{features.no}</option>
            </select>
          ) : (
            <input
              id={`${fieldId}-value`}
              name="value"
              type="number"
              dir="ltr"
              step="any"
              defaultValue={
                typeof assignmentFeature.value === "number"
                  ? assignmentFeature.value
                  : undefined
              }
              required
              className={inputClassName}
            />
          )}
        </div>
      )}

      <input type="hidden" name="valueType" value={valueType} />

      <div className="grid gap-2">
        <label
          htmlFor={`${fieldId}-visibility`}
          className="text-sm font-medium text-slate-700"
        >
          {features.visibility}
        </label>
        <select
          id={`${fieldId}-visibility`}
          name="customerVisibleOverride"
          defaultValue={
            assignmentFeature.customerVisibleOverride === null
              ? "inherit"
              : String(assignmentFeature.customerVisibleOverride)
          }
          className={inputClassName}
        >
          <option value="inherit">{features.inheritVisibility}</option>
          <option value="true">{features.visibleToCustomer}</option>
          <option value="false">{features.platformOnly}</option>
        </select>
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="mode"
          value="override"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? labels.saving : features.overrideFeature}
        </button>
        <button
          type="submit"
          name="mode"
          value="reset"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {features.resetFeature}
        </button>
      </div>
    </form>
  );
}
