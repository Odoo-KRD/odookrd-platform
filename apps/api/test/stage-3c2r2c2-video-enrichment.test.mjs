import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');

async function source(relative) {
  return readFile(path.join(root, relative), 'utf8');
}

const [schema, migration, service, controller, types, proxy, player] =
  await Promise.all([
    source('apps/api/prisma/schema.prisma'),
    source(
      'apps/api/prisma/migrations/20260830225000_029_training_video_captions_chapters/migration.sql',
    ),
    source(
      'apps/api/src/modules/training/training-video-enrichment.service.ts',
    ),
    source(
      'apps/api/src/modules/training/training-video-enrichment.controller.ts',
    ),
    source('packages/types/src/index.ts'),
    source('apps/portal/src/app/api/training/[...path]/route.ts'),
    source('apps/portal/src/components/training/branded-video-player.tsx'),
  ]);

assert.match(schema, /model TrainingVideoCaptionTrack/);
assert.match(schema, /model TrainingVideoChapter/);
assert.match(migration, /training_video_caption_tracks_one_default/);
assert.match(migration, /training_video_chapters_video_start_unique/);
assert.match(service, /WEBVTT/);
assert.match(service, /assertEntitledCourseBySlug/);
assert.match(service, /rewriteAdminManifest/);
assert.match(controller, /media\/enrichment\/preview-resource/);
assert.match(controller, /catalog\/:slug\/lessons\/:lessonId\/captions/);
assert.match(types, /TrainingCustomerVideoEnrichment/);
assert.match(types, /TrainingVideoEnrichmentAdmin/);
assert.match(proxy, /captionUpload/);
assert.match(player, /kind="subtitles"/);
assert.match(player, /kind="chapters"/);

console.log('Stage 3C.2R.2C.2 enrichment contract checks passed.');
