"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useRouter } from "next/navigation";
import type {
  Locale,
  LocalizedRichText,
  LocalizedText,
  TrainingContentStatus,
  TrainingCourseStructure,
  TrainingCourseStructureSection,
  TrainingLesson,
} from "@odookrd/types";
import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { AdminActionButton } from "@/components/admin/admin-action-controls";
import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { LessonTypeIcon } from "@/components/training/lesson-type-icon";
import { LocalizedTextField } from "@/components/i18n/localized-text-fields";
import {
  initializeLocalizedRichText,
  LocalizedRichTextEditor,
  richTextToPlainText,
} from "@/components/training/localized-rich-text-editor";
import type { ContentEditorDictionary } from "@/lib/i18n/types";
import type { TrainingDictionary } from "@/lib/i18n/training";
import { trainingLessonEditorDictionaries } from "@/lib/i18n/training/lesson-editor";

type EditorDialog =
  | { kind: "section-create" }
  | { kind: "section-edit"; section: TrainingCourseStructureSection }
  | { kind: "lesson-create"; sectionId: string }
  | {
      kind: "lesson-edit";
      sectionId: string;
      lesson: TrainingLesson;
    }
  | null;

interface OrderState {
  sections: string[];
  lessons: Record<string, string[]>;
}

const sectionKey = (id: string) => `section:${id}`;
const sectionIdFromKey = (key: string) => key.replace(/^section:/, "");

function buildOrder(structure: TrainingCourseStructure): OrderState {
  return {
    sections: structure.sections.map((section) => sectionKey(section.id)),
    lessons: Object.fromEntries(
      structure.sections.map((section) => [
        section.id,
        section.lessons.map((lesson) => lesson.id),
      ]),
    ),
  };
}

function localizedTitle(
  value: { title: string; titleTranslations: LocalizedText },
  locale: Locale,
): string {
  return value.titleTranslations[locale]?.trim() || value.title;
}

function statusTone(status: TrainingContentStatus): string {
  if (status === "PUBLISHED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "ARCHIVED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function DragHandle({
  label,
  handleRef,
  disabled,
}: {
  label: string;
  handleRef: (element: Element | null) => void;
  disabled: boolean;
}) {
  return (
    <button
      ref={handleRef}
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-35"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="size-4"
        fill="currentColor"
      >
        <circle cx="6" cy="5" r="1.35" />
        <circle cx="14" cy="5" r="1.35" />
        <circle cx="6" cy="10" r="1.35" />
        <circle cx="14" cy="10" r="1.35" />
        <circle cx="6" cy="15" r="1.35" />
        <circle cx="14" cy="15" r="1.35" />
      </svg>
    </button>
  );
}

function SortableLessonRow({
  lesson,
  index,
  sectionId,
  locale,
  training,
  disabled,
  onEdit,
  onArchive,
  onDelete,
}: {
  lesson: TrainingLesson;
  index: number;
  sectionId: string;
  locale: Locale;
  training: TrainingDictionary;
  disabled: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: lesson.id,
    index,
    group: sectionId,
    type: "lesson",
    accept: "lesson",
    disabled,
  });
  const editorLabels = trainingLessonEditorDictionaries[locale];
  const typeLabel = lesson.contentType
    ? editorLabels.contentTypes[lesson.contentType]
    : editorLabels.content.noContent;
  const readinessLabel = lesson.contentType
    ? lesson.contentReady
      ? editorLabels.content.ready
      : editorLabels.content.notReady
    : editorLabels.content.noContent;

  const rowSurface =
    lesson.status === "DRAFT"
      ? "border-slate-200 bg-slate-50/70 hover:bg-slate-50"
      : lesson.status === "ARCHIVED"
        ? "border-slate-200 bg-slate-50/90 hover:bg-slate-100/70"
        : "border-line bg-white hover:border-slate-300 hover:bg-slate-50/35";

  return (
    <div
      ref={ref}
      className={`group flex min-h-14 items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all ${rowSurface} ${
        isDragging ? "opacity-55 shadow-lg ring-2 ring-brand/10" : ""
      }`}
    >
      <DragHandle
        label={training.editor.dragLesson}
        handleRef={handleRef}
        disabled={disabled}
      />

      <LessonTypeIcon contentType={lesson.contentType} label={typeLabel} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-y-1.5">
          <p className="min-w-0 max-w-full truncate text-sm font-semibold leading-5 text-content">
            {localizedTitle(lesson, locale)}
          </p>

          <div className="ms-3 flex shrink-0 flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusTone(
                lesson.status,
              )}`}
            >
              {training.contentStatus[lesson.status]}
            </span>
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                !lesson.contentType
                  ? "border-slate-200 bg-white/80 text-slate-500"
                  : lesson.contentReady
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {readinessLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <AdminActionButton icon="edit" onClick={onEdit} disabled={disabled}>
          {training.edit}
        </AdminActionButton>
        {!disabled ? (
          <AdminActionMenu
            orientation="horizontal"
            label={`${training.edit} ${localizedTitle(lesson, locale)}`}
            items={[
              {
                key: "archive",
                label:
                  lesson.status === "ARCHIVED"
                    ? training.editor.restore
                    : training.editor.archive,
                icon: "archive",
                onSelect: onArchive,
              },
              {
                key: "delete",
                label: training.editor.delete,
                icon: "delete",
                tone: "danger",
                separatorBefore: true,
                onSelect: onDelete,
              },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

function LessonDropZone({
  sectionId,
  disabled,
  children,
}: {
  sectionId: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: sectionId,
    accept: "lesson",
    disabled,
  });

  return (
    <div
      ref={ref}
      className={`grid min-h-12 gap-2 rounded-lg transition ${
        isDropTarget ? "bg-brand-soft/60 ring-2 ring-brand/15" : ""
      }`}
    >
      {children}
    </div>
  );
}

function SortableSectionCard({
  section,
  sectionIndex,
  lessonIds,
  lessonById,
  locale,
  training,
  disabled,
  onEditSection,
  onArchiveSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onArchiveLesson,
  onDeleteLesson,
  collapsed,
  onToggleCollapsed,
}: {
  section: TrainingCourseStructureSection;
  sectionIndex: number;
  lessonIds: string[];
  lessonById: Map<string, TrainingLesson>;
  locale: Locale;
  training: TrainingDictionary;
  disabled: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onEditSection: () => void;
  onArchiveSection: () => void;
  onDeleteSection: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: TrainingLesson) => void;
  onArchiveLesson: (lesson: TrainingLesson) => void;
  onDeleteLesson: (lesson: TrainingLesson) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: sectionKey(section.id),
    index: sectionIndex,
    group: "course-sections",
    type: "section",
    accept: "section",
    disabled,
  });

  return (
    <section
      ref={ref}
      className={`overflow-hidden rounded-lg border border-line bg-white transition-all ${
        isDragging
          ? "opacity-60 shadow-lg ring-2 ring-brand/10"
          : "hover:border-slate-300"
      }`}
    >
      <header className="flex flex-wrap items-center gap-2.5 border-b border-line bg-slate-50/45 px-3 py-3 sm:flex-nowrap sm:px-4">
        <DragHandle
          label={training.editor.dragSection}
          handleRef={handleRef}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={
            locale === "ku"
              ? collapsed
                ? "بەش بکەرەوە"
                : "بەش داخە"
              : locale === "ar"
                ? collapsed
                  ? "توسيع القسم"
                  : "طي القسم"
                : collapsed
                  ? "Expand section"
                  : "Collapse section"
          }
          title={
            locale === "ku"
              ? collapsed
                ? "بەش بکەرەوە"
                : "بەش داخە"
              : locale === "ar"
                ? collapsed
                  ? "توسيع القسم"
                  : "طي القسم"
                : collapsed
                  ? "Expand section"
                  : "Collapse section"
          }
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-white hover:text-content"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`size-4 fill-none stroke-current transition-transform ${
              collapsed ? "-rotate-90" : "rotate-0"
            }`}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-y-1">
            <h3 className="truncate text-sm font-semibold text-content">
              {localizedTitle(section, locale)}
            </h3>
            <span
              className={`ms-2 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusTone(
                section.status,
              )}`}
            >
              {training.contentStatus[section.status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {lessonIds.length} {training.lessons}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AdminActionButton
            icon="edit"
            onClick={onEditSection}
            disabled={disabled}
          >
            {training.edit}
          </AdminActionButton>
          {!disabled ? (
            <AdminActionMenu
              orientation="horizontal"
              label={`${training.edit} ${localizedTitle(section, locale)}`}
              items={[
                {
                  key: "archive",
                  label:
                    section.status === "ARCHIVED"
                      ? training.editor.restore
                      : training.editor.archive,
                  icon: "archive",
                  onSelect: onArchiveSection,
                },
                {
                  key: "delete",
                  label: training.editor.delete,
                  icon: "delete",
                  tone: "danger",
                  separatorBefore: true,
                  onSelect: onDeleteSection,
                },
              ]}
            />
          ) : null}
        </div>
      </header>

      {!collapsed ? (
        <div className="grid gap-2 bg-white px-3 py-3 sm:px-4">
          <LessonDropZone sectionId={section.id} disabled={disabled}>
            {lessonIds.length === 0 ? (
              <div className="flex min-h-14 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50/50 px-4 text-center text-xs text-muted">
                {training.editor.emptySection}
              </div>
            ) : (
              lessonIds.map((lessonId, lessonIndex) => {
                const lesson = lessonById.get(lessonId);
                if (!lesson) return null;
                return (
                  <SortableLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={lessonIndex}
                    sectionId={section.id}
                    locale={locale}
                    training={training}
                    disabled={disabled}
                    onEdit={() => onEditLesson(lesson)}
                    onArchive={() => onArchiveLesson(lesson)}
                    onDelete={() => onDeleteLesson(lesson)}
                  />
                );
              })
            )}
          </LessonDropZone>

          <button
            type="button"
            onClick={onAddLesson}
            disabled={disabled}
            className="mt-0.5 inline-flex h-9 w-fit items-center rounded-md border border-brand/30 bg-white px-3 text-xs font-semibold text-brand transition hover:border-brand/40 hover:bg-brand-soft/40 disabled:opacity-50"
          >
            + {training.editor.addLesson}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function richForEntity(
  rich: LocalizedRichText | undefined,
  plain: LocalizedText,
  fallback: string | null,
): LocalizedRichText {
  return initializeLocalizedRichText(rich, plain, fallback);
}

function EditorDialogForm({
  dialog,
  content,
  training,
  courseId,
  busy,
  onClose,
  onSaved,
}: {
  dialog: Exclude<EditorDialog, null>;
  content: ContentEditorDictionary;
  training: TrainingDictionary;
  courseId: string;
  busy: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const router = useRouter();
  const existing =
    dialog.kind === "section-edit"
      ? dialog.section
      : dialog.kind === "lesson-edit"
        ? dialog.lesson
        : null;

  const [richDescription, setRichDescription] = useState<LocalizedRichText>(
    () =>
      richForEntity(
        existing?.richDescriptionTranslations,
        existing?.descriptionTranslations ?? {},
        existing?.description ?? null,
      ),
  );
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isSection =
    dialog.kind === "section-create" || dialog.kind === "section-edit";
  const isEdit =
    dialog.kind === "section-edit" || dialog.kind === "lesson-edit";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || busy) return;

    const formData = new FormData(event.currentTarget);
    const localized: LocalizedText = {};
    for (const locale of ["ku", "ar", "en"] as const) {
      const value = formData.get(`title.${locale}`);
      if (typeof value === "string" && value.trim())
        localized[locale] = value.trim();
    }

    const activeTitleLocale = formData.get("title.__activeLocale");
    const title =
      localized.ku ??
      (activeTitleLocale === "ku" ||
      activeTitleLocale === "ar" ||
      activeTitleLocale === "en"
        ? localized[activeTitleLocale]
        : undefined) ??
      localized.en ??
      localized.ar;
    if (!title) {
      setError(training.lessonTitle);
      return;
    }
    if (!localized.ku) localized.ku = title;

    const descriptionTranslations: LocalizedText = {};
    for (const locale of ["ku", "ar", "en"] as const) {
      const plain = richTextToPlainText(richDescription[locale]).slice(0, 2000);
      if (plain) descriptionTranslations[locale] = plain;
    }

    const statusValue = formData.get("status");
    const status =
      statusValue === "PUBLISHED" || statusValue === "ARCHIVED"
        ? statusValue
        : "DRAFT";

    const payload = {
      title,
      titleTranslations: localized,
      description: descriptionTranslations.ku ?? null,
      descriptionTranslations,
      richDescriptionTranslations: richDescription,
      status,
    };

    let path: string;
    if (dialog.kind === "section-create") {
      path = `/api/training/courses/${courseId}/sections`;
    } else if (dialog.kind === "section-edit") {
      path = `/api/training/courses/${courseId}/sections/${dialog.section.id}`;
    } else if (dialog.kind === "lesson-create") {
      path = `/api/training/courses/${courseId}/sections/${dialog.sectionId}/lessons`;
    } else {
      path = `/api/training/courses/${courseId}/sections/${dialog.sectionId}/lessons/${dialog.lesson.id}`;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(path, {
          method: isEdit ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await response.json()) as {
          id?: string;
          message?: string;
        };
        if (!response.ok) {
          throw new Error(
            body.message || "The request could not be completed.",
          );
        }
        if (dialog.kind === "lesson-create" && body.id) {
          router.push(
            `/admin/training/courses/${courseId}/sections/${dialog.sectionId}/lessons/${body.id}/editor`,
          );
          return;
        }
        await onSaved();
        onClose();
      } catch (requestError: unknown) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "The request could not be completed.",
        );
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-xl border border-line bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-content">
              {isSection
                ? isEdit
                  ? training.editor.editSection
                  : training.editor.addSection
                : isEdit
                  ? training.editor.editLesson
                  : training.editor.addLesson}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              {isSection
                ? training.editor.sectionDialogHelp
                : training.editor.lessonDialogHelp}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={training.editor.close}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-subtle hover:text-content disabled:opacity-50"
          >
            ×
          </button>
        </header>

        <form onSubmit={submit} className="grid gap-5 px-5 py-5 sm:px-6">
          <LocalizedTextField
            field="title"
            label={isSection ? training.sectionTitle : training.lessonTitle}
            content={content}
            translations={existing?.titleTranslations}
            fallback={existing?.title ?? null}
            maxLength={250}
            required
          />

          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              {training.editor.richDescription}
            </span>
            <LocalizedRichTextEditor
              value={richDescription}
              onChange={setRichDescription}
              content={content}
              training={training}
              disabled={submitting}
            />
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              {training.status}
            </span>
            <select
              name="status"
              defaultValue={existing?.status ?? "DRAFT"}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="DRAFT">{training.contentStatus.DRAFT}</option>
              <option value="PUBLISHED">
                {training.contentStatus.PUBLISHED}
              </option>
              <option value="ARCHIVED">
                {training.contentStatus.ARCHIVED}
              </option>
            </select>
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <footer className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button
              type="submit"
              disabled={submitting || busy}
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? training.saving
                : isEdit
                  ? training.editor.update
                  : training.editor.create}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle disabled:opacity-50"
            >
              {training.cancel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function CourseStructureEditor({
  courseId,
  initialStructure,
  locale,
  training,
  content,
}: {
  courseId: string;
  initialStructure: TrainingCourseStructure;
  locale: Locale;
  training: TrainingDictionary;
  content: ContentEditorDictionary;
}) {
  const router = useRouter();
  const [structure, setStructure] = useState(initialStructure);
  const [order, setOrder] = useState<OrderState>(() =>
    buildOrder(initialStructure),
  );
  const orderRef = useRef(order);
  const snapshotRef = useRef(order);
  const [dialog, setDialog] = useState<EditorDialog>(null);
  const [savingStructure, setSavingStructure] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(),
  );
  const sectionCollapseLabels =
    locale === "ku"
      ? {
          expandAll: "هەموو بەشەکان بکەرەوە",
          collapseAll: "هەموو بەشەکان داخە",
        }
      : locale === "ar"
        ? {
            expandAll: "توسيع كل الأقسام",
            collapseAll: "طي كل الأقسام",
          }
        : {
            expandAll: "Expand all",
            collapseAll: "Collapse all",
          };

  const sectionById = useMemo(
    () => new Map(structure.sections.map((section) => [section.id, section])),
    [structure.sections],
  );
  const lessonById = useMemo(
    () =>
      new Map(
        structure.sections.flatMap((section) =>
          section.lessons.map((lesson) => [lesson.id, lesson] as const),
        ),
      ),
    [structure.sections],
  );

  function setOrderState(next: OrderState): void {
    orderRef.current = next;
    setOrder(next);
  }

  function applyStructure(next: TrainingCourseStructure): void {
    setStructure(next);
    setOrderState(buildOrder(next));
  }

  async function refreshStructure(): Promise<void> {
    const response = await fetch(
      `/api/training/courses/${courseId}/structure`,
      { credentials: "same-origin", cache: "no-store" },
    );
    const body = (await response.json()) as
      TrainingCourseStructure | { message?: string };
    if (!response.ok || !("sections" in body)) {
      throw new Error(
        "message" in body && typeof body.message === "string"
          ? body.message
          : training.editor.structureFailed,
      );
    }
    applyStructure(body);
  }

  async function mutateContent(
    path: string,
    method: "PATCH" | "DELETE",
    body: { status: TrainingContentStatus } | null,
    busyKey: string,
  ): Promise<void> {
    setActionBusy(busyKey);
    setMessage(null);
    setError(false);
    try {
      const response = await fetch(`/api/training/${path}`, {
        method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : training.editor.actionFailed,
        );
      }
      await refreshStructure();
    } catch (mutationError: unknown) {
      setMessage(
        mutationError instanceof Error
          ? mutationError.message
          : training.editor.actionFailed,
      );
      setError(true);
    } finally {
      setActionBusy(null);
    }
  }

  async function toggleSectionArchive(
    section: TrainingCourseStructureSection,
  ): Promise<void> {
    await mutateContent(
      `courses/${courseId}/sections/${section.id}`,
      "PATCH",
      { status: section.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED" },
      `section-${section.id}`,
    );
  }

  async function deleteSection(
    section: TrainingCourseStructureSection,
  ): Promise<void> {
    if (!window.confirm(training.editor.sectionDeleteConfirm)) return;
    await mutateContent(
      `courses/${courseId}/sections/${section.id}`,
      "DELETE",
      null,
      `section-${section.id}`,
    );
  }

  async function toggleLessonArchive(
    sectionId: string,
    lesson: TrainingLesson,
  ): Promise<void> {
    await mutateContent(
      `courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}`,
      "PATCH",
      { status: lesson.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED" },
      `lesson-${lesson.id}`,
    );
  }

  async function deleteLesson(
    sectionId: string,
    lesson: TrainingLesson,
  ): Promise<void> {
    if (!window.confirm(training.editor.lessonDeleteConfirm)) return;
    await mutateContent(
      `courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}`,
      "DELETE",
      null,
      `lesson-${lesson.id}`,
    );
  }

  async function persistOrder(next: OrderState, fallback: OrderState) {
    setSavingStructure(true);
    setMessage(training.editor.structureSaving);
    setError(false);

    try {
      const response = await fetch(
        `/api/training/courses/${courseId}/structure`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sections: next.sections.map((key) => {
              const sectionId = sectionIdFromKey(key);
              return {
                id: sectionId,
                lessons: (next.lessons[sectionId] ?? []).map((id) => ({ id })),
              };
            }),
          }),
        },
      );

      const body = (await response.json()) as
        TrainingCourseStructure | { message?: string };

      if (!response.ok || !("sections" in body)) {
        throw new Error(
          "message" in body && typeof body.message === "string"
            ? body.message
            : training.editor.structureFailed,
        );
      }

      applyStructure(body);
      setMessage(training.editor.structureSaved);
    } catch {
      setOrderState(fallback);
      setMessage(training.editor.structureFailed);
      setError(true);
    } finally {
      setSavingStructure(false);
    }
  }

  return (
    <div data-course-editor data-course-id={courseId} className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-subtle/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-content">
            {training.editor.professionalHint}
          </p>
          <p className="mt-1 text-xs text-muted">{training.editor.moveHint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsedSections(new Set())}
            disabled={savingStructure || actionBusy !== null}
            className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-surface-subtle disabled:opacity-50"
          >
            {sectionCollapseLabels.expandAll}
          </button>
          <button
            type="button"
            onClick={() =>
              setCollapsedSections(
                new Set(structure.sections.map((section) => section.id)),
              )
            }
            disabled={savingStructure || actionBusy !== null}
            className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-surface-subtle disabled:opacity-50"
          >
            {sectionCollapseLabels.collapseAll}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ kind: "section-create" })}
          disabled={savingStructure || actionBusy !== null}
          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          + {training.editor.addSection}
        </button>
      </div>

      {message ? (
        <p
          aria-live="polite"
          className={`text-xs ${error ? "text-red-700" : "text-muted"}`}
        >
          {message}
        </p>
      ) : null}

      {order.sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-content">
            {training.noSections}
          </p>
          <button
            type="button"
            onClick={() => setDialog({ kind: "section-create" })}
            className="mt-4 inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover"
          >
            + {training.editor.addSection}
          </button>
        </div>
      ) : (
        <DragDropProvider
          onDragStart={() => {
            snapshotRef.current = structuredClone(orderRef.current);
          }}
          onDragOver={(event) => {
            const source = event.operation.source;
            if (!source || source.type === "section") return;
            const nextLessons = move(orderRef.current.lessons, event);
            setOrderState({
              ...orderRef.current,
              lessons: nextLessons,
            });
          }}
          onDragEnd={(event) => {
            const source = event.operation.source;
            const fallback = snapshotRef.current;

            if (event.canceled || !source) {
              setOrderState(fallback);
              return;
            }

            if (source.type === "section") {
              const next = {
                ...orderRef.current,
                sections: move(orderRef.current.sections, event),
              };
              setOrderState(next);
              void persistOrder(next, fallback);
              return;
            }

            void persistOrder(orderRef.current, fallback);
          }}
        >
          <div className="grid gap-4">
            {order.sections.map((key, sectionIndex) => {
              const sectionId = sectionIdFromKey(key);
              const section = sectionById.get(sectionId);
              if (!section) return null;

              return (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  sectionIndex={sectionIndex}
                  lessonIds={order.lessons[section.id] ?? []}
                  lessonById={lessonById}
                  locale={locale}
                  training={training}
                  disabled={savingStructure || actionBusy !== null}
                  collapsed={collapsedSections.has(section.id)}
                  onToggleCollapsed={() =>
                    setCollapsedSections((current) => {
                      const next = new Set(current);
                      if (next.has(section.id)) next.delete(section.id);
                      else next.add(section.id);
                      return next;
                    })
                  }
                  onEditSection={() =>
                    setDialog({ kind: "section-edit", section })
                  }
                  onArchiveSection={() => void toggleSectionArchive(section)}
                  onDeleteSection={() => void deleteSection(section)}
                  onAddLesson={() =>
                    setDialog({ kind: "lesson-create", sectionId: section.id })
                  }
                  onEditLesson={(lesson) =>
                    router.push(
                      `/admin/training/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/editor`,
                    )
                  }
                  onArchiveLesson={(lesson) =>
                    void toggleLessonArchive(section.id, lesson)
                  }
                  onDeleteLesson={(lesson) =>
                    void deleteLesson(section.id, lesson)
                  }
                />
              );
            })}
          </div>
        </DragDropProvider>
      )}

      {dialog ? (
        <EditorDialogForm
          key={
            dialog.kind === "section-edit"
              ? `section-${dialog.section.id}`
              : dialog.kind === "lesson-edit"
                ? `lesson-${dialog.lesson.id}`
                : `${dialog.kind}-${"sectionId" in dialog ? dialog.sectionId : "new"}`
          }
          dialog={dialog}
          content={content}
          training={training}
          courseId={courseId}
          busy={savingStructure || actionBusy !== null}
          onClose={() => setDialog(null)}
          onSaved={refreshStructure}
        />
      ) : null}
    </div>
  );
}
