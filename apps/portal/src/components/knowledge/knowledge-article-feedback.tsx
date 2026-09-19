"use client";

import type { KnowledgeArticleFeedbackAnswer } from "@odookrd/types";
import { useState } from "react";

import type { KnowledgeDictionary } from "@/lib/i18n/knowledge";

type Stage = "asking" | "commenting" | "done";

/**
 * "Was this helpful?"
 *
 * Yes is a single click and submits immediately -- asking a satisfied reader
 * for more is how you get no answer at all. No submits immediately too, then
 * invites an optional comment, so the answer is already recorded whether or not
 * they go on to write anything.
 */
export function KnowledgeArticleFeedback({
  slug,
  labels,
  initial,
}: {
  slug: string;
  labels: KnowledgeDictionary;
  initial: KnowledgeArticleFeedbackAnswer | null;
}) {
  const [stage, setStage] = useState<Stage>(initial ? "done" : "asking");
  const [helpful, setHelpful] = useState<boolean | null>(
    initial?.helpful ?? null,
  );
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (answer: boolean, text?: string) => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/knowledge/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, helpful: answer, comment: text }),
      });

      if (!response.ok) throw new Error("failed");

      return true;
    } catch {
      setError(labels.feedbackError);
      return false;
    } finally {
      setPending(false);
    }
  };

  const answer = async (value: boolean) => {
    setHelpful(value);

    const ok = await send(value);

    if (!ok) return;

    // The answer is saved either way; the comment is a bonus on top of it.
    setStage(value ? "done" : "commenting");
  };

  const sendComment = async () => {
    const ok = await send(false, comment);

    if (ok) setStage("done");
  };

  const button =
    "inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium disabled:opacity-60";

  if (stage === "done") {
    return (
      <section className="rounded-md border border-line bg-surface-panel px-4 py-3">
        <p className="text-sm text-content">
          {helpful ? labels.feedbackThanks : labels.feedbackThanksNegative}
        </p>
        <button
          type="button"
          onClick={() => {
            setStage("asking");
            setHelpful(null);
          }}
          className="mt-1 text-xs text-muted underline hover:text-content"
        >
          {labels.feedbackChange}
        </button>
      </section>
    );
  }

  if (stage === "commenting") {
    return (
      <section className="grid gap-3 rounded-md border border-line bg-surface-panel px-4 py-4">
        <p className="text-sm font-medium text-content">
          {labels.feedbackCommentPrompt}
        </p>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={labels.feedbackCommentPlaceholder}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-content outline-none focus:border-brand"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={sendComment}
            disabled={pending || !comment.trim()}
            className={`${button} border-transparent bg-brand text-white hover:bg-brand-hover`}
          >
            {pending ? labels.feedbackSending : labels.feedbackSend}
          </button>
          <button
            type="button"
            onClick={() => setStage("done")}
            className="text-sm text-muted hover:text-content"
          >
            {labels.feedbackSkip}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface-panel px-4 py-3">
      <p className="text-sm font-medium text-content">
        {labels.feedbackQuestion}
      </p>

      <button
        type="button"
        onClick={() => answer(true)}
        disabled={pending}
        className={`${button} border-line bg-white text-content hover:bg-surface-subtle`}
      >
        {labels.feedbackYes}
      </button>

      <button
        type="button"
        onClick={() => answer(false)}
        disabled={pending}
        className={`${button} border-line bg-white text-content hover:bg-surface-subtle`}
      >
        {labels.feedbackNo}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
