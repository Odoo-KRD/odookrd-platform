import { TrainingQuizQuestionType } from '../../generated/prisma/enums';

export type TrainingQuizQuestionRuleBlocker =
  | 'TOO_FEW_OPTIONS'
  | 'TRUE_FALSE_REQUIRES_TWO_OPTIONS'
  | 'REQUIRES_EXACTLY_ONE_CORRECT_OPTION'
  | 'REQUIRES_AT_LEAST_ONE_CORRECT_OPTION';

export function validateTrainingQuizQuestionShape(input: {
  type: TrainingQuizQuestionType;
  options: Array<{ isCorrect: boolean }>;
}): TrainingQuizQuestionRuleBlocker[] {
  const blockers: TrainingQuizQuestionRuleBlocker[] = [];
  const correct = input.options.filter((option) => option.isCorrect).length;
  if (input.options.length < 2) blockers.push('TOO_FEW_OPTIONS');
  if (
    input.type === TrainingQuizQuestionType.TRUE_FALSE &&
    input.options.length !== 2
  ) {
    blockers.push('TRUE_FALSE_REQUIRES_TWO_OPTIONS');
  }
  if (
    input.type === TrainingQuizQuestionType.SINGLE_CHOICE ||
    input.type === TrainingQuizQuestionType.TRUE_FALSE
  ) {
    if (correct !== 1) blockers.push('REQUIRES_EXACTLY_ONE_CORRECT_OPTION');
  } else if (
    input.type === TrainingQuizQuestionType.MULTIPLE_CHOICE &&
    correct < 1
  ) {
    blockers.push('REQUIRES_AT_LEAST_ONE_CORRECT_OPTION');
  }
  return [...new Set(blockers)];
}
