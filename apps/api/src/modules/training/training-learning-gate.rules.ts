export interface TrainingLearningGateLesson {
  id: string;
  quizId: string | null;
  requiredToContinue: boolean;
  requiredForCompletion: boolean;
}

export interface TrainingLearningGateResult {
  lockedByLessonId: Record<string, string>;
  requiredLearningCompleted: boolean;
}

export function calculateTrainingLearningGate(
  lessons: readonly TrainingLearningGateLesson[],
  completedLessonIds: ReadonlySet<string>,
): TrainingLearningGateResult {
  const lockedByLessonId: Record<string, string> = {};
  let blockingQuizId: string | null = null;

  for (const lesson of lessons) {
    if (blockingQuizId) {
      lockedByLessonId[lesson.id] = blockingQuizId;
    }

    if (
      !blockingQuizId &&
      lesson.requiredToContinue &&
      lesson.quizId &&
      !completedLessonIds.has(lesson.id)
    ) {
      blockingQuizId = lesson.quizId;
    }
  }

  return {
    lockedByLessonId,
    requiredLearningCompleted: lessons
      .filter((lesson) => lesson.requiredForCompletion)
      .every((lesson) => completedLessonIds.has(lesson.id)),
  };
}
