import { createHash } from 'node:crypto';

export function deterministicQuizOrder(
  ids: readonly string[],
  seed: string,
): string[] {
  return [...ids].sort((left, right) => {
    const leftHash = createHash('sha256')
      .update(`${seed}:${left}`)
      .digest('hex');
    const rightHash = createHash('sha256')
      .update(`${seed}:${right}`)
      .digest('hex');

    return leftHash.localeCompare(rightHash) || left.localeCompare(right);
  });
}

export function exactQuizSelectionMatch(
  selectedOptionIds: readonly string[],
  correctOptionIds: readonly string[],
): boolean {
  const selected = [...new Set(selectedOptionIds)].sort();
  const correct = [...new Set(correctOptionIds)].sort();

  return (
    selected.length === correct.length &&
    selected.every((value, index) => value === correct[index])
  );
}

export function quizPercentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
}
