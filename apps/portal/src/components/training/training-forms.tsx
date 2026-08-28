"use client";

import type {
  TrainingCategory,
  TrainingCategoryStatus,
  TrainingContentStatus,
  TrainingCourse,
  TrainingCourseStatus,
  TrainingLesson,
  TrainingSection,
} from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState, useState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import { CourseCoverField } from "@/components/training/course-cover-field";
import type { FormState } from "@/lib/forms";
import type { TrainingDictionary } from "@/lib/i18n/training";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

type TrainingFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

const inputClassName =
  "h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";

function Actions({
  pending,
  labels,
  cancelHref,
}: {
  pending: boolean;
  labels: TrainingDictionary;
  cancelHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionButton type="submit" disabled={pending}>
        {pending ? labels.saving : labels.save}
      </ActionButton>
      <Link
        href={cancelHref}
        className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
      >
        {labels.cancel}
      </Link>
    </div>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {message}
    </p>
  ) : null;
}

export function TrainingCategoryForm({
  action,
  labels,
  content,
  initial,
  cancelHref,
}: {
  action: TrainingFormAction;
  labels: TrainingDictionary;
  content: ContentEditorDictionary;
  initial?: TrainingCategory;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const statuses: readonly TrainingCategoryStatus[] = ["ACTIVE", "INACTIVE"];

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <div className="grid gap-2">
        <label htmlFor="training-category-key" className="text-sm font-medium">
          {labels.key}
        </label>
        <input
          id="training-category-key"
          name="key"
          dir="ltr"
          defaultValue={initial?.key ?? ""}
          pattern="[a-z][a-z0-9_-]{1,99}"
          maxLength={100}
          required={!initial}
          disabled={Boolean(initial)}
          className={`${inputClassName} disabled:bg-surface-subtle`}
        />
      </div>

      <LocalizedTextFields
        field="name"
        label={labels.name}
        content={content}
        translations={initial?.nameTranslations}
        fallback={initial?.name}
        maxLength={200}
        required
      />

      <LocalizedTextFields
        field="description"
        label={labels.descriptionField}
        content={content}
        translations={initial?.descriptionTranslations}
        fallback={initial?.description}
        maxLength={1000}
        multiline
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {labels.status}
          <select
            name="status"
            defaultValue={initial?.status ?? "ACTIVE"}
            className={inputClassName}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {labels.categoryStatus[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.sortOrder}
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={1000000}
            defaultValue={initial?.sortOrder ?? 0}
            className={inputClassName}
          />
        </label>
      </div>

      <ErrorMessage message={state.message} />
      <Actions pending={pending} labels={labels} cancelHref={cancelHref} />
    </form>
  );
}

export function TrainingCourseForm({
  action,
  labels,
  content,
  categories,
  initial,
  cancelHref,
}: {
  action: TrainingFormAction;
  labels: TrainingDictionary;
  content: ContentEditorDictionary;
  categories: TrainingCategory[];
  initial?: TrainingCourse;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const [coverBusy, setCoverBusy] = useState(false);
  const statuses: readonly TrainingCourseStatus[] = [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
  ];

  return (
    <form action={formAction} className="grid max-w-3xl gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {labels.category}
          <select
            name="categoryId"
            defaultValue={initial?.categoryId ?? categories[0]?.id ?? ""}
            required
            className={inputClassName}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.slug}
          <input
            name="slug"
            dir="ltr"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            maxLength={150}
            defaultValue={initial?.slug ?? ""}
            required={!initial}
            disabled={Boolean(initial)}
            className={`${inputClassName} disabled:bg-surface-subtle`}
          />
        </label>
      </div>

      <LocalizedTextFields
        field="title"
        label={labels.courseTitle}
        content={content}
        translations={initial?.titleTranslations}
        fallback={initial?.title}
        maxLength={250}
        required
      />

      <LocalizedTextFields
        field="summary"
        label={labels.summary}
        content={content}
        translations={initial?.summaryTranslations}
        fallback={initial?.summary}
        maxLength={2000}
        multiline
      />

      <CourseCoverField
        labels={labels}
        currentFileId={initial?.coverImageAssetId ?? null}
        onBusyChange={setCoverBusy}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {labels.status}
          <select
            name="status"
            defaultValue={initial?.status ?? "DRAFT"}
            className={inputClassName}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {labels.courseStatus[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.sortOrder}
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={1000000}
            defaultValue={initial?.sortOrder ?? 0}
            className={inputClassName}
          />
        </label>
      </div>

      <ErrorMessage message={state.message} />
      <Actions
        pending={pending || coverBusy}
        labels={labels}
        cancelHref={cancelHref}
      />
    </form>
  );
}

export function TrainingSectionForm({
  action,
  labels,
  content,
  initial,
  cancelHref,
}: {
  action: TrainingFormAction;
  labels: TrainingDictionary;
  content: ContentEditorDictionary;
  initial?: TrainingSection;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const statuses: readonly TrainingContentStatus[] = [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
  ];

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <LocalizedTextFields
        field="title"
        label={labels.sectionTitle}
        content={content}
        translations={initial?.titleTranslations}
        fallback={initial?.title}
        maxLength={250}
        required
      />
      <LocalizedTextFields
        field="description"
        label={labels.descriptionField}
        content={content}
        translations={initial?.descriptionTranslations}
        fallback={initial?.description}
        maxLength={2000}
        multiline
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {labels.status}
          <select
            name="status"
            defaultValue={initial?.status ?? "DRAFT"}
            className={inputClassName}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {labels.contentStatus[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.sortOrder}
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={1000000}
            defaultValue={initial?.sortOrder ?? 0}
            className={inputClassName}
          />
        </label>
      </div>
      <ErrorMessage message={state.message} />
      <Actions pending={pending} labels={labels} cancelHref={cancelHref} />
    </form>
  );
}

export function TrainingLessonForm({
  action,
  labels,
  content,
  initial,
  cancelHref,
}: {
  action: TrainingFormAction;
  labels: TrainingDictionary;
  content: ContentEditorDictionary;
  initial?: TrainingLesson;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const statuses: readonly TrainingContentStatus[] = [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
  ];

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <LocalizedTextFields
        field="title"
        label={labels.lessonTitle}
        content={content}
        translations={initial?.titleTranslations}
        fallback={initial?.title}
        maxLength={250}
        required
      />
      <LocalizedTextFields
        field="description"
        label={labels.descriptionField}
        content={content}
        translations={initial?.descriptionTranslations}
        fallback={initial?.description}
        maxLength={2000}
        multiline
      />
      <div className="rounded-md border border-line bg-surface-subtle px-4 py-3 text-sm text-muted">
        {labels.videoPending}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {labels.status}
          <select
            name="status"
            defaultValue={initial?.status ?? "DRAFT"}
            className={inputClassName}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {labels.contentStatus[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.sortOrder}
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={1000000}
            defaultValue={initial?.sortOrder ?? 0}
            className={inputClassName}
          />
        </label>
      </div>
      <ErrorMessage message={state.message} />
      <Actions pending={pending} labels={labels} cancelHref={cancelHref} />
    </form>
  );
}
