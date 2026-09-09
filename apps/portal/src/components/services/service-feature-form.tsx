"use client";

import type {
  ManagedServiceFeature,
  ServiceFeatureValueType,
} from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import { useActionState, useId, useState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { ServiceFeaturesDictionary } from "@/lib/i18n/services/features";
import type { ServicesDictionary } from "@/lib/i18n/services";
import type { ContentEditorDictionary } from "@/lib/i18n/types";
import {
  NUMBER_FEATURE_UNITS,
  STORAGE_FEATURE_UNITS,
} from "@/lib/service-feature-units";

type FeatureFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface ServiceFeatureFormProps {
  action: FeatureFormAction;
  labels: ServicesDictionary;
  features: ServiceFeaturesDictionary;
  content: ContentEditorDictionary;
  initial?: ManagedServiceFeature;
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

const valueTypes: readonly ServiceFeatureValueType[] = [
  "BOOLEAN",
  "NUMBER",
  "STORAGE",
  "TEXT",
];

export function ServiceFeatureForm({
  action,
  labels,
  features,
  content,
  initial,
}: ServiceFeatureFormProps) {
  const formId = useId();
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const [valueType, setValueType] = useState<ServiceFeatureValueType>(
    initial?.valueType ?? "BOOLEAN",
  );

  return (
    <form action={formAction} className="grid max-w-3xl gap-5">
      {initial ? null : (
        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-key`}
            className="text-sm font-medium text-slate-700"
          >
            {features.featureKey}
          </label>
          <input
            id={`${formId}-key`}
            name="featureKey"
            type="text"
            dir="ltr"
            pattern="[a-z][a-z0-9_-]{1,99}"
            maxLength={100}
            required
            className={inputClassName}
          />
        </div>
      )}

      <LocalizedTextFields
        field="featureName"
        label={features.featureName}
        content={content}
        translations={initial?.nameTranslations}
        fallback={initial?.name}
        maxLength={200}
        required
      />

      <LocalizedTextFields
        field="featureDescription"
        label={features.featureDescription}
        content={content}
        translations={initial?.descriptionTranslations}
        fallback={initial?.description}
        maxLength={1000}
        multiline
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-type`}
            className="text-sm font-medium text-slate-700"
          >
            {features.valueType}
          </label>
          <select
            id={`${formId}-type`}
            name="valueType"
            value={valueType}
            onChange={(event) =>
              setValueType(event.currentTarget.value as ServiceFeatureValueType)
            }
            className={inputClassName}
          >
            {valueTypes.map((type) => (
              <option key={type} value={type}>
                {features.valueTypes[type]}
              </option>
            ))}
          </select>
        </div>

        {valueType === "BOOLEAN" ? (
          <div className="grid gap-2">
            <label
              htmlFor={`${formId}-value`}
              className="text-sm font-medium text-slate-700"
            >
              {features.defaultValue}
            </label>
            <select
              id={`${formId}-value`}
              name="defaultValue"
              defaultValue={
                typeof initial?.defaultValue === "boolean"
                  ? String(initial.defaultValue)
                  : "true"
              }
              className={inputClassName}
            >
              <option value="true">{features.yes}</option>
              <option value="false">{features.no}</option>
            </select>
          </div>
        ) : null}

        {valueType === "NUMBER" || valueType === "STORAGE" ? (
          <div className="grid gap-2">
            <label
              htmlFor={`${formId}-value`}
              className="text-sm font-medium text-slate-700"
            >
              {features.defaultValue}
            </label>
            <input
              id={`${formId}-value`}
              name="defaultValue"
              type="number"
              dir="ltr"
              step="any"
              defaultValue={
                typeof initial?.defaultValue === "number"
                  ? initial.defaultValue
                  : undefined
              }
              required
              className={inputClassName}
            />
          </div>
        ) : null}
      </div>

      {valueType === "TEXT" ? (
        <LocalizedTextFields
          field="featureValue"
          label={features.defaultValue}
          content={content}
          translations={initial?.valueTranslations}
          fallback={
            typeof initial?.defaultValue === "string"
              ? initial.defaultValue
              : undefined
          }
          maxLength={500}
          required
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-3">
        {valueType === "NUMBER" || valueType === "STORAGE" ? (
          <div className="grid gap-2">
            <label
              htmlFor={`${formId}-unit`}
              className="text-sm font-medium text-slate-700"
            >
              {features.unit}
            </label>
            <select
              key={valueType}
              id={`${formId}-unit`}
              name="unit"
              dir="ltr"
              defaultValue={
                initial?.unit ?? (valueType === "STORAGE" ? "GB" : "")
              }
              className={inputClassName}
            >
              <option value="">{features.noUnit}</option>
              {valueType === "STORAGE"
                ? STORAGE_FEATURE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))
                : NUMBER_FEATURE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {features.numberUnitLabels[unit]}
                    </option>
                  ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-status`}
            className="text-sm font-medium text-slate-700"
          >
            {labels.status}
          </label>
          <select
            id={`${formId}-status`}
            name="featureStatus"
            defaultValue={initial?.status ?? "ACTIVE"}
            className={inputClassName}
          >
            <option value="ACTIVE">{labels.catalogStatusLabels.ACTIVE}</option>
            <option value="INACTIVE">
              {labels.catalogStatusLabels.INACTIVE}
            </option>
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-order`}
            className="text-sm font-medium text-slate-700"
          >
            {features.sortOrder}
          </label>
          <input
            id={`${formId}-order`}
            name="sortOrder"
            type="number"
            dir="ltr"
            min={0}
            max={10000}
            defaultValue={initial?.sortOrder ?? 0}
            className={inputClassName}
          />
        </div>
      </div>

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

      <div>
        <ActionButton type="submit" disabled={pending}>
          {pending
            ? labels.saving
            : initial
              ? labels.save
              : features.addFeature}
        </ActionButton>
      </div>
    </form>
  );
}
