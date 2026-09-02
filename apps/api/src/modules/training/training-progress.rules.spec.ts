import {
  calculateTrainingProgressPercentage,
  isVideoLessonComplete,
  normalizeDocumentPage,
  normalizeVideoPosition,
  TRAINING_VIDEO_COMPLETION_PERCENTAGE,
} from './training-progress.rules';

describe('training progress rules', () => {
  it('uses the approved 90 percent video completion threshold', () => {
    expect(TRAINING_VIDEO_COMPLETION_PERCENTAGE).toBe(90);
    expect(isVideoLessonComplete(89, 100)).toBe(false);
    expect(isVideoLessonComplete(90, 100)).toBe(true);
  });

  it('normalizes video positions against authoritative duration', () => {
    expect(normalizeVideoPosition(-10, 100)).toBe(0);
    expect(normalizeVideoPosition(45.9, 100)).toBe(45);
    expect(normalizeVideoPosition(150, 100)).toBe(100);
  });

  it('normalizes document pages to the authoritative page count', () => {
    expect(normalizeDocumentPage(-1, 12)).toBe(1);
    expect(normalizeDocumentPage(7, 12)).toBe(7);
    expect(normalizeDocumentPage(30, 12)).toBe(12);
  });

  it('calculates stable course percentages', () => {
    expect(calculateTrainingProgressPercentage(0, 0)).toBe(0);
    expect(calculateTrainingProgressPercentage(4, 10)).toBe(40);
    expect(calculateTrainingProgressPercentage(10, 10)).toBe(100);
  });
});
