import { canCompleteTrainingCourse } from './training-course-completion.rules';

describe('training course completion rules', () => {
  it('completes when required learning and required quizzes are satisfied', () => {
    expect(
      canCompleteTrainingCourse({
        hasRequirements: true,
        requiredLearningCompleted: true,
        requiredSectionQuizzesPassed: true,
        finalQuizRequired: true,
        finalQuizPassed: true,
      }),
    ).toBe(true);
  });

  it('does not require an optional final quiz', () => {
    expect(
      canCompleteTrainingCourse({
        hasRequirements: true,
        requiredLearningCompleted: true,
        requiredSectionQuizzesPassed: true,
        finalQuizRequired: false,
        finalQuizPassed: false,
      }),
    ).toBe(true);
  });

  it('blocks completion when a required final quiz is not passed', () => {
    expect(
      canCompleteTrainingCourse({
        hasRequirements: true,
        requiredLearningCompleted: true,
        requiredSectionQuizzesPassed: true,
        finalQuizRequired: true,
        finalQuizPassed: false,
      }),
    ).toBe(false);
  });

  it('never creates an empty course completion', () => {
    expect(
      canCompleteTrainingCourse({
        hasRequirements: false,
        requiredLearningCompleted: true,
        requiredSectionQuizzesPassed: true,
        finalQuizRequired: false,
        finalQuizPassed: false,
      }),
    ).toBe(false);
  });
});
