import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../../..');
const source = (file) => readFile(path.join(root, file), 'utf8');
const [registry, service, controller, module, types, form, player, page] =
  await Promise.all([
    source('apps/api/src/modules/settings/settings.registry.ts'),
    source('apps/api/src/modules/training/training-player-settings.service.ts'),
    source(
      'apps/api/src/modules/training/training-player-settings.controller.ts',
    ),
    source('apps/api/src/modules/training/training.module.ts'),
    source('packages/types/src/index.ts'),
    source('apps/portal/src/components/settings/settings-form.tsx'),
    source('apps/portal/src/components/training/branded-video-player.tsx'),
    source(
      'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/lessons/[lessonId]/page.tsx',
    ),
  ]);
for (const key of [
  'trainings.player.autoplay',
  'trainings.player.default_playback_rate',
  'trainings.player.captions.font_size',
  'trainings.player.captions.background',
  'trainings.player.captions.background_opacity',
])
  assert.match(registry, new RegExp(key.replaceAll('.', '\\.')));
assert.match(service, /export interface TrainingPlayerSettings/);
assert.match(service, /TrainingPlayerSettingsService/);
assert.ok(!service.includes('@odookrd/types'));
assert.match(controller, /player-settings/);
assert.match(module, /TrainingPlayerSettingsController/);
assert.match(types, /TrainingPlayerSettings/);
assert.match(form, /resetPlayerSettings/);
assert.match(form, /playerSettingsGroups/);
assert.match(player, /--cue-font-size/);
assert.match(player, /type PlayerStyle = CSSProperties/);
assert.ok(player.includes('[name: `--${string}`]'));
assert.match(player, /controlsDelay/);
assert.match(page, /\/training\/player-settings/);
console.log('Stage 3C.2R.2C.2 Player Settings checks passed.');
