import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const apiRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(apiRoot, '../..');

async function readApi(relativePath) {
  return readFile(path.join(apiRoot, relativePath), 'utf8');
}

test('3C.1 uses dedicated catalog/access controllers and a central entitlement authority', async () => {
  const [module, catalogController, accessController, entitlement] =
    await Promise.all([
      readApi('src/modules/training/training.module.ts'),
      readApi('src/modules/training/training-catalog.controller.ts'),
      readApi('src/modules/training/training-access.controller.ts'),
      readApi('src/modules/training/training-entitlement.service.ts'),
    ]);

  assert.match(module, /TrainingEntitlementService/);
  assert.match(module, /TrainingCatalogController/);
  assert.match(module, /TrainingAccessController/);
  assert.match(
    catalogController,
    /@RequirePermissions\(PERMISSIONS\.TRAINING_READ\)/,
  );
  assert.match(
    accessController,
    /@RequirePermissions\(PERMISSIONS\.TRAINING_ASSIGN\)/,
  );
  assert.match(entitlement, /AccountScope\.COMPANY/);
});

test('customer entitlement enforces published content, tenant scope, active windows and active CompanyService', async () => {
  const entitlement = await readApi(
    'src/modules/training/training-entitlement.service.ts',
  );

  assert.match(entitlement, /principal\.companyId/);
  assert.match(entitlement, /companyId: context\.companyId/);
  assert.match(entitlement, /CompanyServiceStatus\.ACTIVE/);
  assert.match(entitlement, /ServiceCategory\.TRAINING/);
  assert.doesNotMatch(entitlement, /ServiceCatalogStatus/);
  assert.match(entitlement, /TrainingCourseStatus\.PUBLISHED/);
  assert.match(entitlement, /TrainingCategoryStatus\.ACTIVE/);
  assert.match(entitlement, /startsAt: \{ lte: now \}/);
  assert.match(entitlement, /expiresAt: \{ gt: now \}/);
});

test('entitlement supports platform-direct, ALL_USERS and assigned-user paths', async () => {
  const entitlement = await readApi(
    'src/modules/training/training-entitlement.service.ts',
  );

  assert.match(entitlement, /TrainingUserAccessSource\.PLATFORM/);
  assert.match(entitlement, /TrainingAudienceMode\.ALL_USERS/);
  assert.match(entitlement, /TrainingAudienceMode\.ASSIGNED_USERS/);
  assert.match(entitlement, /assignmentScopes/);
});

test('company admins cannot choose assignment company/source and cannot modify platform-managed learner grants', async () => {
  const [dto, accessService] = await Promise.all([
    readApi('src/modules/training/dto/training-access.dto.ts'),
    readApi('src/modules/training/training-access.service.ts'),
  ]);

  const start = dto.indexOf('export class CreateTrainingUserAccessDto');
  const end = dto.indexOf('export class UpdateTrainingUserAccessDto');
  assert.ok(start >= 0 && end > start);

  const createUserDto = dto.slice(start, end);
  assert.doesNotMatch(createUserDto, /companyId/);
  assert.doesNotMatch(createUserDto, /source/);

  assert.match(accessService, /targetUser\.companyId !== managed\.companyId/);
  assert.match(accessService, /TrainingUserAccessSource\.COMPANY_ADMIN/);
  assert.match(
    accessService,
    /existing\.source !== TrainingUserAccessSource\.COMPANY_ADMIN/,
  );
  assert.match(
    accessService,
    /This learner assignment is managed by the platform/,
  );
});

test('catalog hides media/storage internals and hidden-section lessons from counts', async () => {
  const catalog = await readApi(
    'src/modules/training/training-catalog.service.ts',
  );

  assert.doesNotMatch(catalog, /sourceReference/);
  assert.doesNotMatch(catalog, /playbackManifestReference/);
  assert.doesNotMatch(catalog, /mediaConvertJobId/);
  assert.doesNotMatch(catalog, /videoAssetId/);
  assert.match(catalog, /TrainingContentStatus\.PUBLISHED/);
  assert.match(
    catalog,
    /section: \{ status: TrainingContentStatus\.PUBLISHED \}/,
  );
});

test('customer navigation and cover delivery are protected', async () => {
  const [layout, coverProxy, catalogController] = await Promise.all([
    readFile(
      path.join(
        repoRoot,
        'apps/portal/src/app/(protected)/(customer)/layout.tsx',
      ),
      'utf8',
    ),
    readFile(
      path.join(
        repoRoot,
        'apps/portal/src/app/api/training/catalog/[slug]/cover/route.ts',
      ),
      'utf8',
    ),
    readApi('src/modules/training/training-catalog.controller.ts'),
  ]);

  assert.match(layout, /PERMISSIONS\.TRAINING_READ/);
  assert.match(layout, /\/training\/catalog\/status/);
  assert.match(layout, /if \(trainingEnabled\)/);
  assert.match(coverProxy, /SESSION_COOKIE_NAME/);
  assert.match(coverProxy, /Authorization: `Bearer \$\{token\}`/);
  assert.match(catalogController, /this\.catalog\.openCover/);
});

test('3C.1 adds no migration 027 and all required UI surfaces exist', async () => {
  const migrations = await readdir(path.join(apiRoot, 'prisma/migrations'));
  assert.equal(
    migrations.some((name) => /027/i.test(name)),
    false,
  );

  const required = [
    'apps/portal/src/app/(protected)/(customer)/dashboard/training/page.tsx',
    'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/page.tsx',
    'apps/portal/src/app/(protected)/(customer)/dashboard/training/manage/page.tsx',
    'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/learners/page.tsx',
    'apps/portal/src/app/(protected)/admin/training/courses/[id]/access/page.tsx',
  ];

  for (const relativePath of required) {
    await access(path.join(repoRoot, relativePath));
  }
});
