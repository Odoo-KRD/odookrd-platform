"use client";

import type {
  Locale,
  LocalizedText,
  TrainingQuizAdminQuestion,
  TrainingQuizAdminState,
  TrainingQuizQuestionType,
} from "@odookrd/types";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { TrainingQuizLocalizedField } from "@/components/training/training-quiz-localized-field";
import {
  trainingQuizDictionaries,
  type TrainingQuizDictionary,
} from "@/lib/i18n/training-quiz";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

type QuizTarget =
  | {
      kind: "lesson";
      courseId: string;
      sectionId: string;
      lessonId: string;
    }
  | {
      kind: "final";
      courseId: string;
    };

type LocalizedFormText = Record<Locale, string>;

interface QuizConfigurationForm {
  title: LocalizedFormText;
  instructions: LocalizedFormText;
  passPercentage: string;
  maxAttempts: string;
  timeLimitMinutes: string;
  requiredForCompletion: boolean;
  requiredToContinue: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  revealAnswers: boolean;
}

interface QuestionOptionForm {
  key: string;
  text: LocalizedFormText;
  isCorrect: boolean;
}

interface QuestionForm {
  id: string | null;
  type: TrainingQuizQuestionType;
  prompt: LocalizedFormText;
  explanation: LocalizedFormText;
  points: string;
  options: QuestionOptionForm[];
}

function emptyLocalized(): LocalizedFormText {
  return { ku: "", ar: "", en: "" };
}

function localized(value: LocalizedText | null | undefined): LocalizedFormText {
  return {
    ku: value?.ku ?? "",
    ar: value?.ar ?? "",
    en: value?.en ?? "",
  };
}

function firstText(value: LocalizedFormText, preferred: Locale): string {
  return (
    value[preferred].trim() ||
    value.ku.trim() ||
    value.en.trim() ||
    value.ar.trim()
  );
}

function compactLocalized(value: LocalizedFormText): LocalizedText {
  const result: LocalizedText = {};

  for (const locale of ["ku", "ar", "en"] as const) {
    const text = value[locale].trim();
    if (text) result[locale] = text;
  }

  return result;
}

function questionOption(
  key: string,
  text: Partial<LocalizedFormText> = {},
  isCorrect = false,
): QuestionOptionForm {
  return {
    key,
    text: { ...emptyLocalized(), ...text },
    isCorrect,
  };
}

function newQuestion(): QuestionForm {
  return {
    id: null,
    type: "SINGLE_CHOICE",
    prompt: emptyLocalized(),
    explanation: emptyLocalized(),
    points: "1",
    options: [
      questionOption(crypto.randomUUID()),
      questionOption(crypto.randomUUID()),
    ],
  };
}

function trueFalseOptions(): QuestionOptionForm[] {
  return [
    questionOption(
      crypto.randomUUID(),
      { ku: "ڕاست", ar: "صحيح", en: "True" },
      true,
    ),
    questionOption(
      crypto.randomUUID(),
      { ku: "هەڵە", ar: "خطأ", en: "False" },
      false,
    ),
  ];
}

function questionToForm(question: TrainingQuizAdminQuestion): QuestionForm {
  return {
    id: question.id,
    type: question.type,
    prompt: localized(question.promptTranslations),
    explanation: localized(question.explanationTranslations),
    points: String(question.points),
    options: question.options.map((option) => ({
      key: option.id,
      text: localized(option.textTranslations),
      isCorrect: option.isCorrect,
    })),
  };
}

function configurationFromState(
  state: TrainingQuizAdminState | null,
): QuizConfigurationForm {
  const quiz = state?.quiz;
  const version = quiz?.draftVersion ?? quiz?.publishedVersion;

  return {
    title: localized(quiz?.titleTranslations),
    instructions: localized(quiz?.instructionTranslations),
    passPercentage: String(version?.passPercentage ?? 70),
    maxAttempts:
      version?.maxAttempts === null || version?.maxAttempts === undefined
        ? ""
        : String(version.maxAttempts),
    timeLimitMinutes:
      version?.timeLimitSeconds === null ||
      version?.timeLimitSeconds === undefined
        ? ""
        : String(Math.max(1, Math.round(version.timeLimitSeconds / 60))),
    requiredForCompletion: quiz?.requiredForCompletion ?? true,
    requiredToContinue: quiz?.requiredToContinue ?? false,
    shuffleQuestions: version?.shuffleQuestions ?? false,
    shuffleOptions: version?.shuffleOptions ?? false,
    revealAnswers: version?.revealAnswers ?? true,
  };
}

function responseMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return null;
  }

  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (
    Array.isArray(message) &&
    message.length > 0 &&
    typeof message[0] === "string"
  ) {
    return message[0];
  }

  return null;
}

async function jsonRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    credentials: "same-origin",
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      responseMessage(payload) ?? "The quiz operation could not be completed.",
    );
  }

  return payload as T;
}

function InlineMessage({
  message,
  error,
}: {
  message: string | null;
  error: boolean;
}) {
  return message ? (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-md border px-4 py-3 text-sm ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {message}
    </div>
  ) : null;
}

export function TrainingQuizBuilder({
  target,
  locale,
  contentDictionary,
  onChanged,
}: {
  target: QuizTarget;
  locale: Locale;
  contentDictionary: ContentEditorDictionary;
  onChanged?: () => void | Promise<void>;
}) {
  const labels: TrainingQuizDictionary = trainingQuizDictionaries[locale];
  const endpoint = useMemo(
    () =>
      target.kind === "lesson"
        ? `/api/training/courses/${target.courseId}/sections/${target.sectionId}/lessons/${target.lessonId}/quiz`
        : `/api/training/courses/${target.courseId}/final-quiz`,
    [target],
  );

  const [state, setState] = useState<TrainingQuizAdminState | null>(null);
  const [configuration, setConfiguration] = useState<QuizConfigurationForm>(
    () => configurationFromState(null),
  );
  const [question, setQuestion] = useState<QuestionForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const applyState = useCallback((next: TrainingQuizAdminState) => {
    setState(next);
    setConfiguration(configurationFromState(next));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void jsonRequest<TrainingQuizAdminState>(endpoint).then(
      (next) => {
        if (cancelled) return;
        applyState(next);
        setMessage(null);
        setError(false);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setMessage(labels.errors.load);
        setError(true);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [applyState, endpoint, labels.errors.load]);

  function fail(value: unknown): void {
    setMessage(value instanceof Error ? value.message : labels.errors.request);
    setError(true);
    setBusy(null);
  }

  function failQuestion(value: unknown): void {
    setQuestionError(
      value instanceof Error ? value.message : labels.errors.request,
    );
    setBusy(null);
  }

  function complete(next: TrainingQuizAdminState, text = labels.saved): void {
    applyState(next);
    setMessage(text);
    setError(false);
    setBusy(null);
    void onChanged?.();
  }

  async function saveConfiguration(): Promise<void> {
    const title = firstText(configuration.title, locale);
    if (!title) {
      setMessage(labels.errors.title);
      setError(true);
      return;
    }

    const passPercentage = Number(configuration.passPercentage);
    const maxAttempts = configuration.maxAttempts.trim()
      ? Number(configuration.maxAttempts)
      : null;
    const timeLimitSeconds = configuration.timeLimitMinutes.trim()
      ? Number(configuration.timeLimitMinutes) * 60
      : null;

    setBusy("configuration");
    setMessage(null);
    setError(false);

    try {
      complete(
        await jsonRequest<TrainingQuizAdminState>(endpoint, {
          method: "PUT",
          body: JSON.stringify({
            title,
            titleTranslations: compactLocalized(configuration.title),
            instructions: firstText(configuration.instructions, locale) || null,
            instructionTranslations: compactLocalized(
              configuration.instructions,
            ),
            requiredForCompletion: configuration.requiredForCompletion,
            requiredToContinue:
              target.kind === "lesson"
                ? configuration.requiredToContinue
                : false,
            passPercentage,
            maxAttempts,
            timeLimitSeconds,
            shuffleQuestions: configuration.shuffleQuestions,
            shuffleOptions: configuration.shuffleOptions,
            revealAnswers: configuration.revealAnswers,
          }),
        }),
      );
    } catch (value) {
      fail(value);
    }
  }

  async function clonePublished(): Promise<void> {
    const quizId = state?.quiz?.id;
    if (!quizId) return;

    setBusy("clone");
    setMessage(null);

    try {
      complete(
        await jsonRequest<TrainingQuizAdminState>(
          `/api/training/quizzes/${quizId}/draft-from-published`,
          { method: "POST", body: JSON.stringify({}) },
        ),
      );
    } catch (value) {
      fail(value);
    }
  }

  async function publish(): Promise<void> {
    const quizId = state?.quiz?.id;
    if (!quizId || !state?.quiz?.draftVersion) return;
    if (!window.confirm(labels.publishConfirm)) return;

    setBusy("publish");
    setMessage(null);

    try {
      complete(
        await jsonRequest<TrainingQuizAdminState>(
          `/api/training/quizzes/${quizId}/publish`,
          { method: "POST", body: JSON.stringify({}) },
        ),
      );
    } catch (value) {
      fail(value);
    }
  }

  async function saveQuestion(): Promise<void> {
    const quizId = state?.quiz?.id;
    if (!quizId || !question) return;

    const prompt = firstText(question.prompt, locale);
    if (!prompt) {
      setQuestionError(labels.errors.prompt);
      return;
    }

    if (
      question.options.length < 2 ||
      question.options.some((option) => !firstText(option.text, locale))
    ) {
      setQuestionError(labels.errors.options);
      return;
    }

    const correctCount = question.options.filter(
      (option) => option.isCorrect,
    ).length;

    if (
      (question.type !== "MULTIPLE_CHOICE" && correctCount !== 1) ||
      (question.type === "MULTIPLE_CHOICE" && correctCount < 1)
    ) {
      setQuestionError(labels.errors.options);
      return;
    }

    setBusy("question");
    setQuestionError(null);

    try {
      const url = question.id
        ? `/api/training/quizzes/${quizId}/questions/${question.id}`
        : `/api/training/quizzes/${quizId}/questions`;
      const method = question.id ? "PATCH" : "POST";

      const next = await jsonRequest<TrainingQuizAdminState>(url, {
        method,
        body: JSON.stringify({
          type: question.type,
          prompt,
          promptTranslations: compactLocalized(question.prompt),
          explanation: firstText(question.explanation, locale) || null,
          explanationTranslations: compactLocalized(question.explanation),
          points: Number(question.points),
          options: question.options.map((option) => ({
            text: firstText(option.text, locale),
            textTranslations: compactLocalized(option.text),
            isCorrect: option.isCorrect,
          })),
        }),
      });

      complete(next);
      setQuestion(null);
      setQuestionError(null);
    } catch (value) {
      failQuestion(value);
    }
  }

  async function deleteQuestion(questionId: string): Promise<void> {
    const quizId = state?.quiz?.id;
    if (!quizId || !window.confirm(labels.deleteConfirm)) return;

    setBusy(`delete-${questionId}`);

    try {
      complete(
        await jsonRequest<TrainingQuizAdminState>(
          `/api/training/quizzes/${quizId}/questions/${questionId}`,
          { method: "DELETE" },
        ),
      );
    } catch (value) {
      fail(value);
    }
  }

  async function moveQuestion(index: number, direction: -1 | 1): Promise<void> {
    const quizId = state?.quiz?.id;
    const questions = state?.quiz?.draftVersion?.questions ?? [];
    const targetIndex = index + direction;

    if (!quizId || targetIndex < 0 || targetIndex >= questions.length || busy) {
      return;
    }

    const ids = questions.map((item) => item.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];

    setBusy("reorder");

    try {
      complete(
        await jsonRequest<TrainingQuizAdminState>(
          `/api/training/quizzes/${quizId}/questions/reorder`,
          {
            method: "PATCH",
            body: JSON.stringify({ questionIds: ids }),
          },
        ),
        labels.saved,
      );
    } catch (value) {
      fail(value);
    }
  }

  function updateQuestionType(type: TrainingQuizQuestionType): void {
    setQuestion((current) => {
      if (!current) return current;

      if (type === "TRUE_FALSE") {
        return { ...current, type, options: trueFalseOptions() };
      }

      const options =
        current.type === "TRUE_FALSE"
          ? [
              questionOption(crypto.randomUUID()),
              questionOption(crypto.randomUUID()),
            ]
          : current.options;

      return { ...current, type, options };
    });

    setQuestionError(null);
  }

  function markCorrect(optionKey: string, checked: boolean): void {
    setQuestion((current) => {
      if (!current) return current;

      return {
        ...current,
        options: current.options.map((option) => ({
          ...option,
          isCorrect:
            current.type === "MULTIPLE_CHOICE"
              ? option.key === optionKey
                ? checked
                : option.isCorrect
              : option.key === optionKey,
        })),
      };
    });

    setQuestionError(null);
  }

  function openNewQuestion(): void {
    setQuestion(newQuestion());
    setQuestionError(null);
  }

  function openExistingQuestion(item: TrainingQuizAdminQuestion): void {
    setQuestion(questionToForm(item));
    setQuestionError(null);
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 text-sm text-muted">
        {labels.loading}
      </div>
    );
  }

  const quiz = state?.quiz;
  const draft = quiz?.draftVersion ?? null;
  const published = quiz?.publishedVersion ?? null;
  const editable = !quiz || Boolean(draft);

  return (
    <div className="grid gap-5">
      <InlineMessage message={message} error={error} />

      <section className="grid gap-5 rounded-lg border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-content">
              {labels.settings}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {draft
                ? `${labels.version} ${draft.version} · ${labels.draft}`
                : published
                  ? `${labels.version} ${published.version} · ${labels.published}`
                  : labels.noQuiz}
            </p>
          </div>

          {quiz && !draft && published ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void clonePublished()}
              className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle disabled:opacity-50"
            >
              {labels.createVersion}
            </button>
          ) : null}
        </div>

        <TrainingQuizLocalizedField
          label={labels.quizTitle}
          value={configuration.title}
          locale={locale}
          content={contentDictionary}
          maxLength={250}
          disabled={!editable || busy !== null}
          onChange={(title) =>
            setConfiguration((current) => ({
              ...current,
              title: localized(title),
            }))
          }
        />

        <TrainingQuizLocalizedField
          label={labels.instructions}
          value={configuration.instructions}
          locale={locale}
          content={contentDictionary}
          maxLength={2000}
          multiline
          disabled={!editable || busy !== null}
          onChange={(instructions) =>
            setConfiguration((current) => ({
              ...current,
              instructions: localized(instructions),
            }))
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-xs font-semibold text-content">
            {labels.passingScore}
            <input
              type="number"
              min={1}
              max={100}
              value={configuration.passPercentage}
              disabled={!editable || busy !== null}
              onChange={(event) =>
                setConfiguration((current) => ({
                  ...current,
                  passPercentage: event.target.value,
                }))
              }
              className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal disabled:bg-surface-subtle"
            />
          </label>

          <label className="grid gap-2 text-xs font-semibold text-content">
            {labels.maxAttempts}
            <input
              type="number"
              min={1}
              max={20}
              value={configuration.maxAttempts}
              placeholder={labels.unlimited}
              disabled={!editable || busy !== null}
              onChange={(event) =>
                setConfiguration((current) => ({
                  ...current,
                  maxAttempts: event.target.value,
                }))
              }
              className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal disabled:bg-surface-subtle"
            />
          </label>

          <label className="grid gap-2 text-xs font-semibold text-content">
            {labels.timeLimitMinutes}
            <input
              type="number"
              min={1}
              max={1440}
              value={configuration.timeLimitMinutes}
              placeholder={labels.noTimeLimit}
              disabled={!editable || busy !== null}
              onChange={(event) =>
                setConfiguration((current) => ({
                  ...current,
                  timeLimitMinutes: event.target.value,
                }))
              }
              className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal disabled:bg-surface-subtle"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            [
              "requiredForCompletion",
              labels.requiredForCompletion,
              configuration.requiredForCompletion,
            ] as const,
            ...(target.kind === "lesson"
              ? [
                  [
                    "requiredToContinue",
                    labels.requiredToContinue,
                    configuration.requiredToContinue,
                  ] as const,
                ]
              : []),
            [
              "shuffleQuestions",
              labels.shuffleQuestions,
              configuration.shuffleQuestions,
            ] as const,
            [
              "shuffleOptions",
              labels.shuffleOptions,
              configuration.shuffleOptions,
            ] as const,
            [
              "revealAnswers",
              labels.revealAnswers,
              configuration.revealAnswers,
            ] as const,
          ].map(([key, label, checked]) => (
            <label
              key={String(key)}
              className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-content"
            >
              <input
                type="checkbox"
                checked={Boolean(checked)}
                disabled={!editable || busy !== null}
                onChange={(event) =>
                  setConfiguration((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>

        {editable ? (
          <div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void saveConfiguration()}
              className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {labels.save}
            </button>
          </div>
        ) : null}
      </section>

      {quiz ? (
        <section className="grid gap-4 rounded-lg border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-content">
                {labels.questions}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {draft
                  ? `${labels.version} ${draft.version} · ${draft.questions.length} ${labels.questions.toLowerCase()}`
                  : published
                    ? `${labels.version} ${published.version} · ${published.questions.length} ${labels.questions.toLowerCase()}`
                    : labels.noQuestions}
              </p>
            </div>

            {draft ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={openNewQuestion}
                className="h-9 rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {labels.addQuestion}
              </button>
            ) : null}
          </div>

          {draft ? (
            draft.questions.length > 0 ? (
              <div className="grid gap-2">
                {draft.questions.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-md border border-line bg-surface-subtle px-3 py-3"
                  >
                    <span
                      dir="ltr"
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-muted"
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content">
                        {item.promptTranslations[locale] ??
                          item.promptTranslations.ku ??
                          item.promptTranslations.en ??
                          item.promptTranslations.ar ??
                          item.prompt}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {labels.questionTypes[item.type]} · {item.points}{" "}
                        {labels.points}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        title={labels.moveUp}
                        disabled={index === 0 || busy !== null}
                        onClick={() => void moveQuestion(index, -1)}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-line bg-white text-xs disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        title={labels.moveDown}
                        disabled={
                          index === draft.questions.length - 1 || busy !== null
                        }
                        onClick={() => void moveQuestion(index, 1)}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-line bg-white text-xs disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <AdminActionMenu
                        orientation="horizontal"
                        label={labels.actions}
                        items={[
                          {
                            key: "edit",
                            label: labels.editQuestion,
                            icon: "edit",
                            onSelect: () => openExistingQuestion(item),
                          },
                          {
                            key: "delete",
                            label: labels.deleteQuestion,
                            icon: "delete",
                            tone: "danger",
                            separatorBefore: true,
                            onSelect: () => void deleteQuestion(item.id),
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-line p-7 text-center text-sm text-muted">
                {labels.noQuestions}
              </div>
            )
          ) : published ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {labels.version} {published.version} · {labels.published} ·{" "}
              {published.questions.length} {labels.questions.toLowerCase()}
            </div>
          ) : null}

          {draft ? (
            <div className="flex justify-end border-t border-line pt-4">
              <button
                type="button"
                disabled={busy !== null || draft.questions.length === 0}
                onClick={() => void publish()}
                className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {labels.publish}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {question ? (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && busy === null) {
              setQuestion(null);
              setQuestionError(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-base font-semibold text-content">
                {question.id ? labels.editQuestion : labels.addQuestion}
              </h3>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  setQuestion(null);
                  setQuestionError(null);
                }}
                className="inline-flex size-8 items-center justify-center rounded-md border border-line text-content"
              >
                ×
              </button>
            </header>

            <div className="grid gap-5 overflow-x-hidden overflow-y-auto p-5">
              <InlineMessage
                message={questionError}
                error={Boolean(questionError)}
              />

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                <label className="grid gap-2 text-xs font-semibold text-content">
                  {labels.questionType}
                  <select
                    value={question.type}
                    disabled={busy !== null}
                    onChange={(event) =>
                      updateQuestionType(
                        event.target.value as TrainingQuizQuestionType,
                      )
                    }
                    className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal"
                  >
                    {(
                      [
                        "SINGLE_CHOICE",
                        "MULTIPLE_CHOICE",
                        "TRUE_FALSE",
                      ] as const
                    ).map((type) => (
                      <option key={type} value={type}>
                        {labels.questionTypes[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-xs font-semibold text-content">
                  {labels.points}
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={question.points}
                    disabled={busy !== null}
                    onChange={(event) =>
                      setQuestion((current) =>
                        current
                          ? { ...current, points: event.target.value }
                          : current,
                      )
                    }
                    className="h-10 rounded-md border border-line px-3 text-sm font-normal"
                  />
                </label>
              </div>

              <TrainingQuizLocalizedField
                label={labels.prompt}
                value={question.prompt}
                locale={locale}
                content={contentDictionary}
                maxLength={2000}
                multiline
                disabled={busy !== null}
                onChange={(prompt) => {
                  setQuestion((current) =>
                    current
                      ? { ...current, prompt: localized(prompt) }
                      : current,
                  );
                  setQuestionError(null);
                }}
              />

              <TrainingQuizLocalizedField
                label={labels.explanation}
                value={question.explanation}
                locale={locale}
                content={contentDictionary}
                maxLength={2000}
                multiline
                disabled={busy !== null}
                onChange={(explanation) =>
                  setQuestion((current) =>
                    current
                      ? {
                          ...current,
                          explanation: localized(explanation),
                        }
                      : current,
                  )
                }
              />

              <div className="grid min-w-0 gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-content">
                    {labels.options}
                  </h4>

                  {question.type !== "TRUE_FALSE" ? (
                    <button
                      type="button"
                      disabled={busy !== null || question.options.length >= 20}
                      onClick={() => {
                        setQuestion((current) =>
                          current
                            ? {
                                ...current,
                                options: [
                                  ...current.options,
                                  questionOption(crypto.randomUUID()),
                                ],
                              }
                            : current,
                        );
                        setQuestionError(null);
                      }}
                      className="h-8 rounded-md border border-line px-3 text-xs font-semibold text-content"
                    >
                      {labels.addOption}
                    </button>
                  ) : null}
                </div>

                {question.options.map((option, index) => (
                  <div
                    key={option.key}
                    className="grid min-w-0 gap-2 rounded-md border border-line bg-surface-subtle p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                  >
                    <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-content">
                      <input
                        type={
                          question.type === "MULTIPLE_CHOICE"
                            ? "checkbox"
                            : "radio"
                        }
                        name="quiz-correct-option"
                        checked={option.isCorrect}
                        disabled={busy !== null}
                        onChange={(event) =>
                          markCorrect(option.key, event.target.checked)
                        }
                      />
                      {labels.correct}
                    </label>

                    <TrainingQuizLocalizedField
                      label={`${labels.option} ${index + 1}`}
                      value={option.text}
                      locale={locale}
                      content={contentDictionary}
                      maxLength={1000}
                      hideLabel
                      disabled={busy !== null}
                      onChange={(text) => {
                        setQuestion((current) =>
                          current
                            ? {
                                ...current,
                                options: current.options.map((candidate) =>
                                  candidate.key === option.key
                                    ? {
                                        ...candidate,
                                        text: localized(text),
                                      }
                                    : candidate,
                                ),
                              }
                            : current,
                        );
                        setQuestionError(null);
                      }}
                    />

                    {question.type !== "TRUE_FALSE" ? (
                      <button
                        type="button"
                        disabled={busy !== null || question.options.length <= 2}
                        onClick={() => {
                          setQuestion((current) =>
                            current
                              ? {
                                  ...current,
                                  options: current.options.filter(
                                    (candidate) => candidate.key !== option.key,
                                  ),
                                }
                              : current,
                          );
                          setQuestionError(null);
                        }}
                        className="h-10 whitespace-nowrap rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 disabled:opacity-30"
                      >
                        {labels.removeOption}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface-subtle px-5 py-4">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  setQuestion(null);
                  setQuestionError(null);
                }}
                className="h-9 rounded-md border border-line bg-white px-4 text-sm font-medium text-content"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void saveQuestion()}
                className="h-9 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {labels.saveQuestion}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
