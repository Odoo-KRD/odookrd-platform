import { TrainingQuizQuestionType } from '../../generated/prisma/enums';
import { validateTrainingQuizQuestionShape } from './training-quiz-admin.rules';

describe('training quiz authoring rules', () => {
  it('accepts one correct option for single choice', () => {
    expect(
      validateTrainingQuizQuestionShape({
        type: TrainingQuizQuestionType.SINGLE_CHOICE,
        options: [{ isCorrect: true }, { isCorrect: false }],
      }),
    ).toEqual([]);
  });

  it('requires exactly two options and one correct answer for true/false', () => {
    expect(
      validateTrainingQuizQuestionShape({
        type: TrainingQuizQuestionType.TRUE_FALSE,
        options: [
          { isCorrect: true },
          { isCorrect: false },
          { isCorrect: false },
        ],
      }),
    ).toContain('TRUE_FALSE_REQUIRES_TWO_OPTIONS');
    expect(
      validateTrainingQuizQuestionShape({
        type: TrainingQuizQuestionType.TRUE_FALSE,
        options: [{ isCorrect: true }, { isCorrect: true }],
      }),
    ).toContain('REQUIRES_EXACTLY_ONE_CORRECT_OPTION');
  });

  it('requires at least one correct option for multiple choice', () => {
    expect(
      validateTrainingQuizQuestionShape({
        type: TrainingQuizQuestionType.MULTIPLE_CHOICE,
        options: [{ isCorrect: false }, { isCorrect: false }],
      }),
    ).toEqual(['REQUIRES_AT_LEAST_ONE_CORRECT_OPTION']);
  });
});
