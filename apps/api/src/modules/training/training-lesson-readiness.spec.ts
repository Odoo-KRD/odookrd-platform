import {
  FileAssetStatus,
  TrainingLessonContentType,
  TrainingVideoAssetStatus,
} from '../../generated/prisma/enums';
import {
  evaluateTrainingLessonReadiness,
  hasLocalizedRichTextContent,
} from './training-lesson-readiness';

describe('training lesson readiness', () => {
  it('requires an explicit primary content type', () => {
    expect(evaluateTrainingLessonReadiness({ contentType: null })).toEqual({
      ready: false,
      blockers: ['NO_CONTENT'],
    });
  });

  it('requires a ready video asset for video lessons', () => {
    expect(
      evaluateTrainingLessonReadiness({
        contentType: TrainingLessonContentType.VIDEO,
        videoStatus: TrainingVideoAssetStatus.READY,
      }),
    ).toEqual({ ready: true, blockers: [] });

    expect(
      evaluateTrainingLessonReadiness({
        contentType: TrainingLessonContentType.VIDEO,
        videoStatus: TrainingVideoAssetStatus.PROCESSING,
      }).ready,
    ).toBe(false);
  });

  it('requires a ready PDF and positive page count for document lessons', () => {
    expect(
      evaluateTrainingLessonReadiness({
        contentType: TrainingLessonContentType.DOCUMENT,
        documentStatus: FileAssetStatus.READY,
        documentPageCount: 12,
      }),
    ).toEqual({ ready: true, blockers: [] });
  });

  it('detects meaningful localized article content', () => {
    const article = {
      ku: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'ناوەڕۆک' }] },
        ],
      },
    };
    expect(hasLocalizedRichTextContent(article)).toBe(true);
    expect(
      evaluateTrainingLessonReadiness({
        contentType: TrainingLessonContentType.ARTICLE,
        articleContentTranslations: article,
      }),
    ).toEqual({ ready: true, blockers: [] });
  });

  it('keeps quiz lessons unpublishable until the later quiz integration exists', () => {
    expect(
      evaluateTrainingLessonReadiness({
        contentType: TrainingLessonContentType.QUIZ,
        quizConfigured: false,
      }),
    ).toEqual({ ready: false, blockers: ['QUIZ_NOT_CONFIGURED'] });
  });
});
