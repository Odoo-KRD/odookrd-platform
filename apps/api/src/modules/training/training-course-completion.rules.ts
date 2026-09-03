export interface TrainingCourseCompletionRequirementState {
  hasRequirements: boolean;
  requiredLearningCompleted: boolean;
  requiredSectionQuizzesPassed: boolean;
  finalQuizRequired: boolean;
  finalQuizPassed: boolean;
}

export function canCompleteTrainingCourse(
  state: TrainingCourseCompletionRequirementState,
): boolean {
  return (
    state.hasRequirements &&
    state.requiredLearningCompleted &&
    state.requiredSectionQuizzesPassed &&
    (!state.finalQuizRequired || state.finalQuizPassed)
  );
}
