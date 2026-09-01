import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const source = (file) => readFile(path.join(root, file), 'utf8');

const [registry, service, actions, form, navigation, player, css, types] =
  await Promise.all([
    source('apps/api/src/modules/settings/settings.registry.ts'),
    source('apps/api/src/modules/training/training-player-settings.service.ts'),
    source('apps/portal/src/app/(protected)/admin/settings/actions.ts'),
    source('apps/portal/src/components/settings/settings-form.tsx'),
    source('apps/portal/src/lib/i18n/settings-navigation.ts'),
    source('apps/portal/src/components/training/branded-video-player.tsx'),
    source('apps/portal/src/app/globals.css'),
    source('packages/types/src/index.ts'),
  ]);

assert.match(registry, /trainings\.player\.branding\.enabled/);
assert.match(registry, /trainings\.player\.branding\.text/);
assert.match(service, /branding: \{/);
assert.match(actions, /trainings\.player\.branding\.enabled/);
assert.match(form, /openVideoSettingsGroup/);
assert.match(form, /rememberSubmittedControls/);
assert.match(form, /router\.refresh\(\)/);
assert.match(form, /captionPreview/);
assert.doesNotMatch(form, /useEffect\(\(\) => \{\s*setCaptionPreview/);
assert.match(navigation, /previewTitle/);
assert.match(player, /ManagedCaptions/);
assert.match(
  player,
  /clamp\(18px, calc\(var\(--overlay-height\) \/ 100 \* 2\.0\), 22px\)/,
);
assert.match(player, /--cue-line-height/);
assert.match(player, /--cue-padding-x/);
assert.match(player, /--cue-padding-y/);
assert.match(player, /useMediaState\("textTrack"\)/);
assert.match(player, /textDir=\{rtl \? "rtl" : "ltr"\}/);
assert.match(
  player,
  /function ManagedCaptions[\s\S]*?<Captions[\s\S]*?\/>[\s\S]*?export function BrandedVideoPlayer/,
);
assert.match(player, /settings\.branding\.enabled/);
assert.match(player, /settings\.branding\.text/);
assert.match(css, /odookrd-managed-captions\[data-position="top"\]/);
assert.match(css, /justify-content: flex-end/);
assert.match(css, /position: static !important/);
assert.match(css, /text-align: center !important/);
assert.match(css, /align-self: center !important/);
assert.match(css, /calc\(var\(--overlay-height\) \/ 100 \* 2\.5\)/);
assert.match(css, /unicode-bidi: plaintext/);
assert.doesNotMatch(
  css,
  /\.odookrd-video-player\[data-caption-position="top"\] \.vds-captions/,
);
assert.match(types, /branding: \{/);

console.log('Stage 3C.2R.2C.2 Player Settings polish source checks passed.');
