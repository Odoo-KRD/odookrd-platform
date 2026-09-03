import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const schema = read('apps/api/prisma/schema.prisma');
const migration = read(
  'apps/api/prisma/migrations/20260902230000_032_training_certificate_assets/migration.sql',
);
const service = read(
  'apps/api/src/modules/training/training-certificate.service.ts',
);
const controller = read(
  'apps/api/src/modules/training/training-certificate.controller.ts',
);
const trainingService = read(
  'apps/api/src/modules/training/training.service.ts',
);
const courseForm = read(
  'apps/portal/src/components/training/training-forms.tsx',
);
const customerCourse = read(
  'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/page.tsx',
);
const customerCertificates = read(
  'apps/portal/src/app/(protected)/(customer)/dashboard/training/certificates/page.tsx',
);
const adminCertificates = read(
  'apps/portal/src/app/(protected)/admin/training/certificates/page.tsx',
);
const templates = read(
  'apps/portal/src/app/(protected)/admin/training/certificate-templates/page.tsx',
);
const issueBff = read(
  'apps/portal/src/app/api/training/certificates/courses/[slug]/issue/route.ts',
);
const pdfBff = read(
  'apps/portal/src/app/api/training/certificates/[certificateId]/pdf/route.ts',
);

test('3C.5B migration adds FileAsset-backed certificate template artwork', () => {
  assert.match(schema, /logoFileAssetId\s+String\?/);
  assert.match(schema, /backgroundFileAssetId\s+String\?/);
  assert.match(schema, /signatureFileAssetId\s+String\?/);
  assert.match(migration, /ON DELETE SET NULL/);
  assert.match(migration, /training_certificate_templates_logo_file_asset_idx/);
});

test('3C.5B keeps issuance backend-authoritative and completion-bound', () => {
  assert.match(service, /reconcileForContext/);
  assert.match(service, /trainingCourseCompletion\.findFirst/);
  assert.match(service, /completionId: completionRecord\.id/);
  assert.match(service, /trainingCertificate\.create/);
  assert.match(service, /userId: context\.userId/);
  assert.match(service, /companyId: context\.companyId/);
});

test('3C.5B issues a protected multilingual checksum-backed PDF', () => {
  assert.match(service, /PDFDocument\.create/);
  assert.match(service, /sharp\(Buffer\.from\(svg\)/);
  assert.match(service, /ku-Arab-IQ/);
  assert.match(service, /ar-IQ/);
  assert.match(service, /pdfChecksum/);
  assert.match(service, /verificationCodeHash/);
  assert.match(controller, /Content-Type', 'application\/pdf/);
  assert.match(pdfBff, /Cross-Origin-Resource-Policy/);
});

test('3C.5B supports certificate template administration and course assignment', () => {
  assert.match(controller, /training\/certificate-templates/);
  assert.match(trainingService, /certificateEnabled/);
  assert.match(trainingService, /certificateTemplateId/);
  assert.match(courseForm, /enableCertificates/);
  assert.match(templates, /certificate-templates\/new/);
});

test('3C.5B exposes learner issuance, My Certificates and admin revocation', () => {
  assert.match(customerCourse, /TrainingCertificateIssuer/);
  assert.match(customerCertificates, /downloadCertificate/);
  assert.match(adminCertificates, /TrainingCertificateRevokeButton/);
  assert.match(controller, /:certificateId\/revoke/);
  assert.match(service, /TrainingCertificateStatus\.REVOKED/);
  assert.match(issueBff, /isSameOrigin/);
});

test('3C.5B keeps historical certificates tenant/user scoped without requiring current course entitlement', () => {
  assert.match(service, /requireCustomer\(principal\)/);
  assert.match(service, /userId: principal\.userId/);
  assert.match(service, /companyId/);
  assert.doesNotMatch(
    service.slice(
      service.indexOf('async listMine('),
      service.indexOf('async openMine('),
    ),
    /customerCourseWhere|assertEntitledCourseBySlug/,
  );
});

test('3C.5B does not build Stage 8 public verification', () => {
  assert.doesNotMatch(service, /apps\/web|odoo\.krd\/verify/);
  assert.doesNotMatch(controller, /public\/verify|verification\/public/);
});
