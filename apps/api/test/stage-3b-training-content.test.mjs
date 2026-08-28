import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Stage 3B activates training content administration only', async () => {
  const [module, controller, service] = await Promise.all([
    read('src/modules/training/training.module.ts'),
    read('src/modules/training/training.controller.ts'),
    read('src/modules/training/training.service.ts'),
  ]);

  assert.match(module, /controllers: \[TrainingController\]/);
  assert.match(module, /providers: \[TrainingService\]/);
  assert.match(controller, /@Controller\('training'\)/);
  assert.match(
    controller,
    /@RequirePermissions\(PERMISSIONS\.TRAINING_MANAGE\)/,
  );

  for (const resource of ['categories', 'courses', 'sections', 'lessons']) {
    assert.match(controller, new RegExp(resource));
  }

  assert.match(service, /AccountScope\.PLATFORM/);
  assert.match(service, /TRAINING_CATEGORY_CREATED/);
  assert.match(service, /TRAINING_COURSE_CREATED/);
  assert.match(service, /TRAINING_SECTION_CREATED/);
  assert.match(service, /TRAINING_LESSON_CREATED/);

  assert.doesNotMatch(
    controller,
    /upload|playback|assignment|progress|quiz|certificate/i,
  );
});

test('lesson metadata can be authored before Stage 3C video attachment', async () => {
  const [schema, migration, service] = await Promise.all([
    read('prisma/schema.prisma'),
    read(
      'prisma/migrations/20260826123000_021_training_content_administration/migration.sql',
    ),
    read('src/modules/training/training.service.ts'),
  ]);

  assert.match(schema, /videoAssetId\s+String\?\s+@map\("video_asset_id"\)/);
  assert.match(schema, /videoAsset\s+TrainingVideoAsset\?/);
  assert.match(migration, /ALTER COLUMN "video_asset_id" DROP NOT NULL/);
  assert.match(service, /videoAssetId: null/);
});

test('Stage 3B localizes training title and summary fields', async () => {
  const [localized, portalForm, translations] = await Promise.all([
    read('src/i18n/localized-content.ts'),
    read('../../apps/portal/src/components/training/training-forms.tsx'),
    read('../../apps/portal/src/lib/i18n/training.ts'),
  ]);

  assert.match(localized, /\['title', 'titleTranslations'\]/);
  assert.match(localized, /\['summary', 'summaryTranslations'\]/);
  assert.match(portalForm, /LocalizedTextFields/);
  assert.match(translations, /\bku:/);
  assert.match(translations, /\bar:/);
  assert.match(translations, /\ben:/);
});

test('Stage 3B exposes platform-only training administration navigation', async () => {
  const [navigation, layout, page] = await Promise.all([
    read('../../apps/portal/src/lib/admin-navigation.ts'),
    read('../../apps/portal/src/app/(protected)/admin/layout.tsx'),
    read('../../apps/portal/src/app/(protected)/admin/training/page.tsx'),
  ]);

  assert.match(navigation, /PERMISSIONS\.TRAINING_MANAGE/);
  assert.match(navigation, /session\.user\.accountScope === "PLATFORM"/);
  assert.match(navigation, /\/admin\/training/);
  assert.match(layout, /trainingDictionaries/);
  assert.match(page, /getAdminApiContext\(PERMISSIONS\.TRAINING_MANAGE\)/);
  assert.match(page, /AdminDataTable/);
});
