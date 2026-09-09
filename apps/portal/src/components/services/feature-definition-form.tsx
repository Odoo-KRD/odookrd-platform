"use client";

import type {
  ServiceCategory,
  ServiceFeatureDefinition,
  ServiceFeatureValueType,
} from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { ServiceFeaturesDictionary } from "@/lib/i18n/services/features";
import type { ServicesDictionary } from "@/lib/i18n/services";
import type { ContentEditorDictionary } from "@/lib/i18n/types";
import {
  isPredefinedFeatureUnit,
  NUMBER_FEATURE_UNITS,
  STORAGE_FEATURE_UNITS,
} from "@/lib/service-feature-units";

type DefinitionFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface FeatureDefinitionFormProps {
  action: DefinitionFormAction;
  labels: ServicesDictionary;
  features: ServiceFeaturesDictionary;
  content: ContentEditorDictionary;
  initial?: ServiceFeatureDefinition;
}

const fieldClassName =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-slate-50 disabled:text-slate-500";

const categories: readonly ServiceCategory[] = [
  "ODOO",
  "HOSTING",
  "DOMAIN",
  "SUPPORT",
  "TRAINING",
  "OTHER",
];

const valueTypes: readonly ServiceFeatureValueType[] = [
  "BOOLEAN",
  "NUMBER",
  "STORAGE",
  "TEXT",
];

export function FeatureDefinitionForm({
  action,
  labels,
  features,
  content,
  initial,
}: FeatureDefinitionFormProps) {
  const formId = useId();
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const [valueType, setValueType] = useState<ServiceFeatureValueType>(
    initial?.valueType ?? "NUMBER",
  );
  const structuralFieldsLocked = Boolean(initial && initial.serviceCount > 0);

  return (
    <form action={formAction} className="grid max-w-3xl gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
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
            defaultValue={initial?.key}
            placeholder="storage-odoo"
            readOnly={Boolean(initial)}
            required
            className={fieldClassName}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-category`}
            className="text-sm font-medium text-slate-700"
          >
            {features.applicableCategory}
          </label>
          {structuralFieldsLocked ? (
            <input type="hidden" name="category" value={initial?.category} />
          ) : null}
          <select
            id={`${formId}-category`}
            name="category"
            defaultValue={initial?.category ?? "ODOO"}
            disabled={structuralFieldsLocked}
            className={fieldClassName}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {labels.categoryLabels[category]}
              </option>
            ))}
          </select>
        </div>
      </div>

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
        <LocalizedTextFields
          field="parameterLabel"
          label={features.parameterLabel}
          content={content}
          translations={initial?.parameterLabelTranslations}
          fallback={initial?.parameterLabel}
          maxLength={100}
          required
        />

        <div className="grid gap-2">
          <label
            htmlFor={`${formId}-type`}
            className="text-sm font-medium text-slate-700"
          >
            {features.valueType}
          </label>
          {structuralFieldsLocked ? (
            <input type="hidden" name="valueType" value={valueType} />
          ) : null}
          <select
            id={`${formId}-type`}
            name="valueType"
            value={valueType}
            onChange={(event) =>
              setValueType(event.currentTarget.value as ServiceFeatureValueType)
            }
            disabled={structuralFieldsLocked}
            className={fieldClassName}
          >
            {valueTypes.map((type) => (
              <option key={type} value={type}>
                {features.valueTypes[type]}
              </option>
            ))}
          </select>
        </div>
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
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <label
              htmlFor={`${formId}-value`}
              className="text-sm font-medium text-slate-700"
            >
              {features.defaultValue}
            </label>
            {valueType === "BOOLEAN" ? (
              <select
                id={`${formId}-value`}
                name="defaultValue"
                defaultValue={
                  typeof initial?.defaultValue === "boolean"
                    ? String(initial.defaultValue)
                    : "true"
                }
                className={fieldClassName}
              >
                <option value="true">{features.yes}</option>
                <option value="false">{features.no}</option>
              </select>
            ) : (
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
                className={fieldClassName}
              />
            )}
          </div>

          {valueType === "NUMBER" || valueType === "STORAGE" ? (
            <div className="grid gap-2">
              <label
                htmlFor={`${formId}-unit`}
                className="text-sm font-medium text-slate-700"
              >
                {features.unit}
              </label>
              {structuralFieldsLocked ? (
                <input type="hidden" name="unit" value={initial?.unit ?? ""} />
              ) : null}
              <select
                key={valueType}
                id={`${formId}-unit`}
                name="unit"
                dir="ltr"
                defaultValue={
                  initial?.unit ?? (valueType === "STORAGE" ? "GB" : "")
                }
                disabled={structuralFieldsLocked}
                className={fieldClassName}
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
                {initial?.unit && !isPredefinedFeatureUnit(initial.unit) ? (
                  <option value={initial.unit}>{initial.unit}</option>
                ) : null}
              </select>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
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
            className={fieldClassName}
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
            className={fieldClassName}
          />
        </div>
      </div>

      {structuralFieldsLocked ? (
        <p className="text-sm text-slate-500">{features.definitionInUse}</p>
      ) : null}

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending
            ? labels.saving
            : initial
              ? labels.save
              : features.newFeatureDefinition}
        </ActionButton>
        <Link
          href="/admin/services/features"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
