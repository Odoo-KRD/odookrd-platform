import { calculateTrainingLearningGate } from './training-learning-gate.rules';

describe('training learning gate rules', () => {
  const lessons = [
    {
      id: 'lesson-1',
      quizId: null,
      requiredToContinue: false,
      requiredForCompletion: true,
    },
    {
      id: 'quiz-lesson',
      quizId: 'quiz-1',
      requiredToContinue: true,
      requiredForCompletion: true,
    },
    {
      id: 'lesson-2',
      quizId: null,
      requiredToContinue: false,
      requiredForCompletion: true,
    },
    {
      id: 'lesson-3',
      quizId: null,
      requiredToContinue: false,
      requiredForCompletion: true,
    },
  ];

  it('locks only lessons after the first incomplete required quiz', () => {
    const state = calculateTrainingLearningGate(lessons, new Set(['lesson-1']));

    expect(state.lockedByLessonId).toEqual({
      'lesson-2': 'quiz-1',
      'lesson-3': 'quiz-1',
    });
    expect(state.requiredLearningCompleted).toBe(false);
  });

  it('unlocks later lessons after the required quiz is completed', () => {
    const state = calculateTrainingLearningGate(
      lessons,
      new Set(['lesson-1', 'quiz-lesson']),
    );

    expect(state.lockedByLessonId).toEqual({});
    expect(state.requiredLearningCompleted).toBe(false);
  });

  it('reports all lessons complete only when every ready lesson is complete', () => {
    const state = calculateTrainingLearningGate(
      lessons,
      new Set(['lesson-1', 'quiz-lesson', 'lesson-2', 'lesson-3']),
    );

    expect(state.lockedByLessonId).toEqual({});
    expect(state.requiredLearningCompleted).toBe(true);
  });
});
