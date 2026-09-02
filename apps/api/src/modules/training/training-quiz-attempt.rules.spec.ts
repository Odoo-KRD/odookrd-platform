import {
  deterministicQuizOrder,
  exactQuizSelectionMatch,
  quizPercentage,
} from './training-quiz-attempt.rules';

describe('training quiz attempt rules', () => {
  it('keeps deterministic ordering stable for one attempt', () => {
    const ids = ['a', 'b', 'c', 'd'];

    expect(deterministicQuizOrder(ids, 'attempt-1')).toEqual(
      deterministicQuizOrder(ids, 'attempt-1'),
    );
    expect(deterministicQuizOrder(ids, 'attempt-1')).toHaveLength(4);
    expect(new Set(deterministicQuizOrder(ids, 'attempt-1')).size).toBe(4);
  });

  it('scores selections only when the selected set exactly matches', () => {
    expect(exactQuizSelectionMatch(['a'], ['a'])).toBe(true);
    expect(exactQuizSelectionMatch(['b', 'a'], ['a', 'b'])).toBe(true);
    expect(exactQuizSelectionMatch(['a'], ['a', 'b'])).toBe(false);
    expect(exactQuizSelectionMatch(['a', 'c'], ['a', 'b'])).toBe(false);
  });

  it('rounds percentage consistently and clamps it', () => {
    expect(quizPercentage(2, 3)).toBe(67);
    expect(quizPercentage(3, 3)).toBe(100);
    expect(quizPercentage(0, 0)).toBe(0);
  });
});
