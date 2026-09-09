"use client";

import type {
  Locale,
  LocalizedText,
  TrainingQuizLearnerAttempt,
  TrainingQuizLearnerQuestion,
  TrainingQuizLearnerSummary,
} from "@odookrd/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  trainingQuizPlayerDictionaries,
  type TrainingQuizPlayerDictionary,
} from "@/lib/i18n/training/quiz-player";

function localizedText(
  base: string | null,
  translations: LocalizedText,
  locale: Locale,
): string {
  return (
    translations[locale]?.trim() ||
    translations.ku?.trim() ||
    translations.ar?.trim() ||
    translations.en?.trim() ||
    base?.trim() ||
    ""
  );
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
      responseMessage(payload) ?? "The quiz request could not be completed.",
    );
  }

  return payload as T;
}

function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ResultBadge({
  attempt,
  labels,
}: {
  attempt: TrainingQuizLearnerAttempt;
  labels: TrainingQuizPlayerDictionary;
}) {
  if (attempt.status === "PASSED") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        {labels.passed}
      </span>
    );
  }

  if (attempt.status === "FAILED") {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-300">
        {labels.failed}
      </span>
    );
  }

  if (attempt.status === "EXPIRED") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
        {labels.expired}
      </span>
    );
  }

  return null;
}

export function TrainingQuizPlayer({
  courseSlug,
  quizId,
  locale,
}: {
  courseSlug: string;
  quizId: string;
  locale: Locale;
}) {
  const router = useRouter();
  const labels = trainingQuizPlayerDictionaries[locale];
  const basePath = useMemo(
    () =>
      `/api/training/catalog/${encodeURIComponent(courseSlug)}/quizzes/${encodeURIComponent(quizId)}`,
    [courseSlug, quizId],
  );

  const [summary, setSummary] = useState<TrainingQuizLearnerSummary | null>(
    null,
  );
  const [attempt, setAttempt] = useState<TrainingQuizLearnerAttempt | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const expiryRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void jsonRequest<TrainingQuizLearnerSummary>(basePath)
      .then((nextSummary) => {
        if (cancelled) return null;
        setSummary(nextSummary);

        if (!nextSummary.activeAttemptId) return null;

        return jsonRequest<TrainingQuizLearnerAttempt>(
          `${basePath}/attempts/${encodeURIComponent(nextSummary.activeAttemptId)}`,
        );
      })
      .then((nextAttempt) => {
        if (cancelled) return;
        if (nextAttempt) setAttempt(nextAttempt);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMessage(
          error instanceof Error ? error.message : labels.requestFailed,
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [basePath, labels.requestFailed]);

  useEffect(() => {
    if (!attempt?.expiresAt || attempt.status !== "IN_PROGRESS") return;

    const timer = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attempt?.expiresAt, attempt?.status]);

  const remainingSeconds =
    attempt?.status === "IN_PROGRESS" && attempt.expiresAt
      ? Math.max(
          0,
          Math.ceil((new Date(attempt.expiresAt).getTime() - clock) / 1000),
        )
      : null;

  useEffect(() => {
    if (
      !attempt ||
      attempt.status !== "IN_PROGRESS" ||
      remainingSeconds !== 0 ||
      expiryRefreshRef.current === attempt.id
    ) {
      return;
    }

    expiryRefreshRef.current = attempt.id;

    void jsonRequest<TrainingQuizLearnerAttempt>(
      `${basePath}/attempts/${encodeURIComponent(attempt.id)}`,
    )
      .then((nextAttempt) => {
        setAttempt(nextAttempt);
        return jsonRequest<TrainingQuizLearnerSummary>(basePath);
      })
      .then((nextSummary) => setSummary(nextSummary))
      .catch(() => undefined);
  }, [attempt, basePath, remainingSeconds]);

  async function refreshSummary(): Promise<TrainingQuizLearnerSummary> {
    const next = await jsonRequest<TrainingQuizLearnerSummary>(basePath);
    setSummary(next);
    return next;
  }

  async function startAttempt(): Promise<void> {
    setBusy("start");
    setMessage(null);

    try {
      const next = await jsonRequest<TrainingQuizLearnerAttempt>(
        `${basePath}/attempts`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
      setAttempt(next);
      setCurrentQuestionIndex(0);
      expiryRefreshRef.current = null;
      setClock(Date.now());
      await refreshSummary();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.requestFailed);
    } finally {
      setBusy(null);
    }
  }

  async function saveAnswer(
    question: TrainingQuizLearnerQuestion,
    selectedOptionIds: string[],
  ): Promise<void> {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;

    setSavingQuestionId(question.id);
    setMessage(null);

    setAttempt((current) =>
      current
        ? {
            ...current,
            questions: current.questions.map((candidate) =>
              candidate.id === question.id
                ? { ...candidate, selectedOptionIds }
                : candidate,
            ),
          }
        : current,
    );

    try {
      const next = await jsonRequest<TrainingQuizLearnerAttempt>(
        `${basePath}/attempts/${encodeURIComponent(attempt.id)}/answers/${encodeURIComponent(question.id)}`,
        {
          method: "PUT",
          body: JSON.stringify({ selectedOptionIds }),
        },
      );
      setAttempt(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.requestFailed);
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function submitAttempt(): Promise<void> {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    if (!window.confirm(labels.submitConfirm)) return;

    setBusy("submit");
    setMessage(null);

    try {
      const next = await jsonRequest<TrainingQuizLearnerAttempt>(
        `${basePath}/attempts/${encodeURIComponent(attempt.id)}/submit`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
      setAttempt(next);
      await refreshSummary();

      if (next.status === "PASSED") {
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.requestFailed);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[28rem] items-center justify-center bg-slate-950 p-6 text-sm text-slate-400">
        {labels.loading}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex h-full min-h-[28rem] items-center justify-center bg-slate-950 p-6">
        <div className="max-w-lg rounded-lg border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200">
          {message ?? labels.unavailable}
        </div>
      </div>
    );
  }

  const title = localizedText(summary.title, summary.titleTranslations, locale);
  const instructions = localizedText(
    summary.instructions,
    summary.instructionTranslations,
    locale,
  );

  if (!attempt) {
    const attemptsText =
      summary.maxAttempts === null
        ? labels.unlimited
        : `${summary.attemptsUsed} / ${summary.maxAttempts}`;
    const blocked =
      summary.attemptsRemaining !== null && summary.attemptsRemaining <= 0;

    return (
      <div
        dir={locale === "en" ? "ltr" : "rtl"}
        className="flex h-full min-h-[28rem] items-center justify-center overflow-y-auto bg-slate-950 p-4 sm:p-8"
      >
        <section className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                {labels.quiz}
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">{title}</h2>
            </div>

            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              {summary.questionCount} {labels.questions}
            </span>
          </div>

          {instructions ? (
            <p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-300">
              {instructions}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[11px] font-semibold text-slate-500">
                {labels.passingScore}
              </p>
              <p dir="ltr" className="mt-1 text-lg font-bold text-white">
                {summary.passPercentage}%
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[11px] font-semibold text-slate-500">
                {labels.attempts}
              </p>
              <p dir="ltr" className="mt-1 text-lg font-bold text-white">
                {attemptsText}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[11px] font-semibold text-slate-500">
                {labels.timeLimit}
              </p>
              <p dir="ltr" className="mt-1 text-lg font-bold text-white">
                {summary.timeLimitSeconds
                  ? `${Math.ceil(summary.timeLimitSeconds / 60)} ${labels.minutes}`
                  : labels.unlimited}
              </p>
            </div>
          </div>

          {message ? (
            <div className="mt-5 rounded-md border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">
              {message}
            </div>
          ) : null}

          <div className="mt-7 flex justify-end">
            <button
              type="button"
              disabled={blocked || busy !== null}
              onClick={() => void startAttempt()}
              className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              {blocked
                ? labels.noAttempts
                : summary.activeAttemptId
                  ? labels.resumeQuiz
                  : labels.startQuiz}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const question =
    attempt.questions[
      Math.min(currentQuestionIndex, Math.max(0, attempt.questions.length - 1))
    ];
  const submitted =
    attempt.status === "PASSED" ||
    attempt.status === "FAILED" ||
    attempt.status === "SUBMITTED";
  const editable =
    attempt.status === "IN_PROGRESS" &&
    (remainingSeconds === null || remainingSeconds > 0);
  const canRetry =
    attempt.status !== "IN_PROGRESS" &&
    (summary.attemptsRemaining === null || summary.attemptsRemaining > 0);

  return (
    <div
      dir={locale === "en" ? "ltr" : "rtl"}
      className="flex h-full min-h-[32rem] flex-col bg-slate-950 text-slate-100"
    >
      <header className="shrink-0 border-b border-white/10 bg-slate-950/95 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                {labels.quiz}
              </span>
              <ResultBadge attempt={attempt} labels={labels} />
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {localizedText(attempt.title, attempt.titleTranslations, locale)}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-300">
              {labels.attempt} <span dir="ltr">{attempt.attemptNumber}</span>
            </span>
            {remainingSeconds !== null ? (
              <span
                dir="ltr"
                className={`rounded-md border px-2.5 py-1.5 font-semibold ${
                  remainingSeconds <= 60
                    ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {formatRemaining(remainingSeconds)}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="shrink-0 border-b border-white/10 bg-slate-900/50 p-3 lg:w-56 lg:border-b-0 lg:border-e">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {labels.questions}
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {attempt.questions.map((item, index) => {
              const selected = item.selectedOptionIds.length > 0;
              const active = index === currentQuestionIndex;
              const reviewedCorrect = submitted && item.isCorrect === true;
              const reviewedWrong = submitted && item.isCorrect === false;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition ${
                    active
                      ? "border-brand bg-brand text-white"
                      : reviewedCorrect
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : reviewedWrong
                          ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                          : selected
                            ? "border-brand/35 bg-brand/10 text-brand"
                            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {message ? (
            <div className="mb-4 rounded-md border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">
              {message}
            </div>
          ) : null}

          {attempt.status === "EXPIRED" ? (
            <div className="mb-5 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
              {labels.expired}
            </div>
          ) : null}

          {submitted ? (
            <div
              className={`mb-6 rounded-xl border p-5 ${
                attempt.status === "PASSED"
                  ? "border-emerald-400/20 bg-emerald-400/5"
                  : "border-rose-400/20 bg-rose-400/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p
                    className={`text-lg font-bold ${
                      attempt.status === "PASSED"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {attempt.status === "PASSED"
                      ? labels.passed
                      : labels.failed}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {labels.passingScore}:{" "}
                    <span dir="ltr">{attempt.passPercentage}%</span>
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-[11px] font-semibold text-slate-500">
                    {labels.score}
                  </p>
                  <p dir="ltr" className="text-2xl font-bold text-white">
                    {attempt.percentage ?? 0}%
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {question ? (
            <section className="mx-auto max-w-3xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">
                  {labels.questions}{" "}
                  <span dir="ltr">
                    {currentQuestionIndex + 1} / {attempt.questions.length}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  <span dir="ltr">{question.points}</span> {labels.points}
                </p>
              </div>

              <h2 className="mt-4 text-lg font-semibold leading-8 text-white sm:text-xl">
                {localizedText(
                  question.prompt,
                  question.promptTranslations,
                  locale,
                )}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                {question.type === "MULTIPLE_CHOICE"
                  ? labels.selectMultiple
                  : labels.selectOne}
              </p>

              <div className="mt-6 grid gap-3">
                {question.options.map((option) => {
                  const checked = question.selectedOptionIds.includes(
                    option.id,
                  );
                  const showCorrect =
                    submitted &&
                    attempt.revealAnswers &&
                    option.isCorrect === true;
                  const showWrongSelected =
                    submitted &&
                    checked &&
                    attempt.revealAnswers &&
                    option.isCorrect === false;

                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                        showCorrect
                          ? "border-emerald-400/30 bg-emerald-400/10"
                          : showWrongSelected
                            ? "border-rose-400/30 bg-rose-400/10"
                            : checked
                              ? "border-brand/40 bg-brand/10"
                              : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                      } ${editable ? "" : "cursor-default"}`}
                    >
                      <input
                        type={
                          question.type === "MULTIPLE_CHOICE"
                            ? "checkbox"
                            : "radio"
                        }
                        name={`quiz-question-${question.id}`}
                        checked={checked}
                        disabled={!editable || savingQuestionId === question.id}
                        onChange={(event) => {
                          const next =
                            question.type === "MULTIPLE_CHOICE"
                              ? event.target.checked
                                ? [...question.selectedOptionIds, option.id]
                                : question.selectedOptionIds.filter(
                                    (candidate) => candidate !== option.id,
                                  )
                              : [option.id];

                          void saveAnswer(question, next);
                        }}
                        className="mt-1 shrink-0"
                      />

                      <span className="min-w-0 flex-1 text-sm leading-6 text-slate-200">
                        {localizedText(
                          option.text,
                          option.textTranslations,
                          locale,
                        )}
                      </span>

                      {showCorrect ? (
                        <span className="shrink-0 text-[10px] font-bold uppercase text-emerald-300">
                          {labels.correct}
                        </span>
                      ) : showWrongSelected ? (
                        <span className="shrink-0 text-[10px] font-bold uppercase text-rose-300">
                          {labels.incorrect}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              {savingQuestionId === question.id ? (
                <p className="mt-3 text-xs text-slate-500">{labels.saving}</p>
              ) : null}

              {submitted &&
              attempt.revealAnswers &&
              localizedText(
                question.explanation,
                question.explanationTranslations,
                locale,
              ) ? (
                <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm leading-6 text-slate-300">
                    {localizedText(
                      question.explanation,
                      question.explanationTranslations,
                      locale,
                    )}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
        </main>
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-slate-950/95 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentQuestionIndex <= 0}
            onClick={() =>
              setCurrentQuestionIndex((index) => Math.max(0, index - 1))
            }
            className="h-9 rounded-md border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-30"
          >
            {labels.previous}
          </button>

          <div className="flex items-center gap-2">
            {currentQuestionIndex < attempt.questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((index) =>
                    Math.min(attempt.questions.length - 1, index + 1),
                  )
                }
                className="h-9 rounded-md bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/15"
              >
                {labels.next}
              </button>
            ) : editable ? (
              <button
                type="button"
                disabled={busy !== null || savingQuestionId !== null}
                onClick={() => void submitAttempt()}
                className="h-9 rounded-md bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {labels.submit}
              </button>
            ) : canRetry ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  setAttempt(null);
                  setCurrentQuestionIndex(0);
                }}
                className="h-9 rounded-md bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {labels.retry}
              </button>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
