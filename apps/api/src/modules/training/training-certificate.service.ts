import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  FileAssetKind,
  FileAssetStatus,
  FileStorageProvider,
  TrainingCertificateStatus,
  TrainingCertificateTemplateStatus,
  TrainingStorageProvider,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { FileStorageService } from '../files/storage/file-storage.service';
import type {
  CreateTrainingCertificateTemplateDto,
  IssueTrainingCertificateDto,
  ListTrainingCertificatesQueryDto,
  ListTrainingCertificateTemplatesQueryDto,
  PreviewTrainingCertificateTemplateDto,
  RevokeTrainingCertificateDto,
  UpdateTrainingCertificateTemplateDto,
} from './dto/training-certificate.dto';
import {
  escapeTrainingCertificateXml,
  normalizeTrainingCertificateName,
  resolveTrainingCertificateText,
  type TrainingCertificateLocale,
  wrapTrainingCertificateText,
  normalizeTrainingCertificateLayout,
  trainingCertificateFontFamily,
  type TrainingCertificateLayoutConfig,
} from './training-certificate.rules';
import {
  getTrainingCertificateBackgroundPreset,
  listTrainingCertificateBackgroundPresets,
} from './training-certificate-presets';
import { TrainingCourseCompletionService } from './training-course-completion.service';
import { TrainingEntitlementService } from './training-entitlement.service';

const templateSelect = {
  id: true,
  key: true,
  name: true,
  titleTranslations: true,
  introTranslations: true,
  bodyTranslations: true,
  logoFileAssetId: true,
  backgroundFileAssetId: true,
  signatureFileAssetId: true,
  signatoryName: true,
  signatoryTitle: true,
  primaryColor: true,
  active: true,
  status: true,
  isDefault: true,
  backgroundPresetKey: true,
  layoutVersion: true,
  layoutConfig: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TrainingCertificateTemplateSelect;

type TemplateRecord = Prisma.TrainingCertificateTemplateGetPayload<{
  select: typeof templateSelect;
}>;

type CertificateDesignTemplate = Pick<
  TemplateRecord,
  | 'titleTranslations'
  | 'introTranslations'
  | 'bodyTranslations'
  | 'logoFileAssetId'
  | 'backgroundFileAssetId'
  | 'signatureFileAssetId'
  | 'signatoryName'
  | 'signatoryTitle'
  | 'primaryColor'
  | 'backgroundPresetKey'
  | 'layoutVersion'
  | 'layoutConfig'
>;

const certificateSelect = {
  id: true,
  completionId: true,
  companyId: true,
  userId: true,
  courseId: true,
  certificateNumber: true,
  learnerNameSnapshot: true,
  learnerEmailSnapshot: true,
  companyNameSnapshot: true,
  courseTitleSnapshot: true,
  courseTitleTranslations: true,
  locale: true,
  scorePercentage: true,
  status: true,
  issuedAt: true,
  expiresAt: true,
  revokedAt: true,
  revocationReason: true,
  pdfStorageProvider: true,
  pdfStorageReference: true,
  pdfChecksum: true,
  templateLayoutVersion: true,
  templateSnapshot: true,
} satisfies Prisma.TrainingCertificateSelect;

type CertificateRecord = Prisma.TrainingCertificateGetPayload<{
  select: typeof certificateSelect;
}>;

@Injectable()
export class TrainingCertificateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
    private readonly completions: TrainingCourseCompletionService,
    private readonly storage: FileStorageService,
  ) {}

  async listTemplates(
    principal: AuthenticatedPrincipal,
    query: ListTrainingCertificateTemplatesQueryDto,
  ) {
    this.assertPlatform(principal);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trainingCertificateTemplate.findMany({
        select: templateSelect,
        orderBy: [{ active: 'desc' }, { name: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCertificateTemplate.count(),
    ]);

    return {
      items: items.map((item) => this.presentTemplate(item)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getTemplate(principal: AuthenticatedPrincipal, templateId: string) {
    this.assertPlatform(principal);

    const template = await this.prisma.trainingCertificateTemplate.findUnique({
      where: { id: templateId },
      select: templateSelect,
    });
    if (!template) {
      throw new NotFoundException('Certificate template was not found.');
    }

    return this.presentTemplate(template);
  }

  listPresets(principal: AuthenticatedPrincipal) {
    this.assertPlatform(principal);
    return listTrainingCertificateBackgroundPresets();
  }

  openPresetArtwork(principal: AuthenticatedPrincipal, presetKey: string) {
    this.assertPlatform(principal);
    const preset = getTrainingCertificateBackgroundPreset(presetKey);
    if (!preset) {
      throw new NotFoundException(
        'Certificate background preset was not found.',
      );
    }

    return {
      buffer: Buffer.from(preset.svg, 'utf8'),
      filename: `${preset.key}.svg`,
    };
  }

  async createTemplate(
    principal: AuthenticatedPrincipal,
    input: CreateTrainingCertificateTemplateDto,
  ) {
    this.assertPlatform(principal);
    this.assertLocalizedText(input.titleTranslations, 'Certificate title');
    this.assertLocalizedText(input.bodyTranslations, 'Certificate body');

    await this.assertTemplateAssets([
      input.logoFileAssetId,
      input.backgroundFileAssetId,
      input.signatureFileAssetId,
    ]);

    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('Template name cannot be blank.');
    }

    const status = this.resolveTemplateStatus(input.status, input.active);
    if (
      input.isDefault === true &&
      status !== TrainingCertificateTemplateStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'The default certificate template must be active.',
      );
    }
    const backgroundPresetKey = this.normalizePresetKey(
      input.backgroundPresetKey,
    );
    const layout = normalizeTrainingCertificateLayout(
      input.layoutConfig,
      input.primaryColor ?? '#714b67',
    );

    const duplicate = await this.prisma.trainingCertificateTemplate.findUnique({
      where: { key: input.key },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(
        'A certificate template with this key already exists.',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.trainingCertificateTemplate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const template = await tx.trainingCertificateTemplate.create({
        data: {
          key: input.key,
          name,
          titleTranslations: this.localizedSnapshot(input.titleTranslations),
          introTranslations: this.localizedSnapshot(input.introTranslations),
          bodyTranslations: this.localizedSnapshot(input.bodyTranslations),
          logoFileAssetId: input.logoFileAssetId ?? null,
          backgroundFileAssetId: input.backgroundFileAssetId ?? null,
          signatureFileAssetId: input.signatureFileAssetId ?? null,
          signatoryName: this.optionalText(input.signatoryName),
          signatoryTitle: this.optionalText(input.signatoryTitle),
          primaryColor: input.primaryColor ?? '#714b67',
          active: status === TrainingCertificateTemplateStatus.ACTIVE,
          status,
          isDefault: input.isDefault ?? false,
          backgroundPresetKey,
          layoutVersion: 1,
          layoutConfig: layout as unknown as Prisma.InputJsonValue,
        },
        select: templateSelect,
      });

      await tx.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_CERTIFICATE_TEMPLATE_CREATED,
          targetType: 'training_certificate_template',
          targetId: template.id,
          metadata: { key: template.key, status: template.status },
        },
      });

      return template;
    });

    return this.presentTemplate(created);
  }

  async updateTemplate(
    principal: AuthenticatedPrincipal,
    templateId: string,
    input: UpdateTrainingCertificateTemplateDto,
  ) {
    this.assertPlatform(principal);

    const existing = await this.prisma.trainingCertificateTemplate.findUnique({
      where: { id: templateId },
      select: templateSelect,
    });
    if (!existing) {
      throw new NotFoundException('Certificate template was not found.');
    }

    if (input.titleTranslations !== undefined) {
      this.assertLocalizedText(input.titleTranslations, 'Certificate title');
    }
    if (input.bodyTranslations !== undefined) {
      this.assertLocalizedText(input.bodyTranslations, 'Certificate body');
    }

    await this.assertTemplateAssets([
      input.logoFileAssetId,
      input.backgroundFileAssetId,
      input.signatureFileAssetId,
    ]);

    const nextPrimaryColor = input.primaryColor ?? existing.primaryColor;
    const nextStatus =
      input.status !== undefined || input.active !== undefined
        ? this.resolveTemplateStatus(input.status, input.active)
        : existing.status;
    const nextLayout =
      input.layoutConfig !== undefined
        ? normalizeTrainingCertificateLayout(
            input.layoutConfig,
            nextPrimaryColor,
          )
        : normalizeTrainingCertificateLayout(
            existing.layoutConfig,
            nextPrimaryColor,
          );
    const nextBackgroundPresetKey =
      input.backgroundPresetKey !== undefined
        ? this.normalizePresetKey(input.backgroundPresetKey)
        : existing.backgroundPresetKey;
    const nextIsDefault = input.isDefault ?? existing.isDefault;
    if (
      nextIsDefault &&
      nextStatus !== TrainingCertificateTemplateStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'The default certificate template must be active.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.trainingCertificateTemplate.updateMany({
          where: { isDefault: true, id: { not: templateId } },
          data: { isDefault: false },
        });
      }

      const template = await tx.trainingCertificateTemplate.update({
        where: { id: templateId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.titleTranslations !== undefined
            ? {
                titleTranslations: this.localizedSnapshot(
                  input.titleTranslations,
                ),
              }
            : {}),
          ...(input.introTranslations !== undefined
            ? {
                introTranslations: this.localizedSnapshot(
                  input.introTranslations,
                ),
              }
            : {}),
          ...(input.bodyTranslations !== undefined
            ? {
                bodyTranslations: this.localizedSnapshot(
                  input.bodyTranslations,
                ),
              }
            : {}),
          ...(input.logoFileAssetId !== undefined
            ? { logoFileAssetId: input.logoFileAssetId }
            : {}),
          ...(input.backgroundFileAssetId !== undefined
            ? { backgroundFileAssetId: input.backgroundFileAssetId }
            : {}),
          ...(input.signatureFileAssetId !== undefined
            ? { signatureFileAssetId: input.signatureFileAssetId }
            : {}),
          ...(input.signatoryName !== undefined
            ? { signatoryName: this.optionalText(input.signatoryName) }
            : {}),
          ...(input.signatoryTitle !== undefined
            ? { signatoryTitle: this.optionalText(input.signatoryTitle) }
            : {}),
          ...(input.primaryColor !== undefined
            ? { primaryColor: input.primaryColor }
            : {}),
          ...(input.status !== undefined || input.active !== undefined
            ? {
                status: nextStatus,
                active: nextStatus === TrainingCertificateTemplateStatus.ACTIVE,
              }
            : {}),
          ...(input.isDefault !== undefined
            ? { isDefault: input.isDefault }
            : {}),
          ...(input.backgroundPresetKey !== undefined
            ? { backgroundPresetKey: nextBackgroundPresetKey }
            : {}),
          ...(input.layoutConfig !== undefined ||
          input.primaryColor !== undefined
            ? {
                layoutVersion: 1,
                layoutConfig: nextLayout as unknown as Prisma.InputJsonValue,
              }
            : {}),
        },
        select: templateSelect,
      });

      await tx.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_CERTIFICATE_TEMPLATE_UPDATED,
          targetType: 'training_certificate_template',
          targetId: template.id,
          metadata: { key: template.key, status: template.status },
        },
      });

      return template;
    });

    return this.presentTemplate(updated);
  }

  async duplicateTemplate(
    principal: AuthenticatedPrincipal,
    templateId: string,
  ) {
    this.assertPlatform(principal);

    const existing = await this.prisma.trainingCertificateTemplate.findUnique({
      where: { id: templateId },
      select: templateSelect,
    });
    if (!existing) {
      throw new NotFoundException('Certificate template was not found.');
    }

    const suffix = randomBytes(3).toString('hex');
    const baseKey = existing.key.slice(0, 88);
    const key = `${baseKey}-copy-${suffix}`;

    const copy = await this.prisma.$transaction(async (tx) => {
      const template = await tx.trainingCertificateTemplate.create({
        data: {
          key,
          name: `${existing.name} Copy`.slice(0, 200),
          titleTranslations: this.localizedSnapshot(existing.titleTranslations),
          introTranslations: this.localizedSnapshot(existing.introTranslations),
          bodyTranslations: this.localizedSnapshot(existing.bodyTranslations),
          logoFileAssetId: existing.logoFileAssetId,
          backgroundFileAssetId: existing.backgroundFileAssetId,
          signatureFileAssetId: existing.signatureFileAssetId,
          signatoryName: existing.signatoryName,
          signatoryTitle: existing.signatoryTitle,
          primaryColor: existing.primaryColor,
          active: false,
          status: TrainingCertificateTemplateStatus.DRAFT,
          isDefault: false,
          backgroundPresetKey: existing.backgroundPresetKey,
          layoutVersion: existing.layoutVersion,
          layoutConfig: normalizeTrainingCertificateLayout(
            existing.layoutConfig,
            existing.primaryColor,
          ) as unknown as Prisma.InputJsonValue,
        },
        select: templateSelect,
      });

      await tx.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_CERTIFICATE_TEMPLATE_CREATED,
          targetType: 'training_certificate_template',
          targetId: template.id,
          metadata: {
            key: template.key,
            duplicatedFromTemplateId: existing.id,
          },
        },
      });

      return template;
    });

    return this.presentTemplate(copy);
  }

  async previewTemplate(
    principal: AuthenticatedPrincipal,
    input: PreviewTrainingCertificateTemplateDto,
  ) {
    this.assertPlatform(principal);
    this.assertLocalizedText(input.titleTranslations, 'Certificate title');
    this.assertLocalizedText(input.bodyTranslations, 'Certificate body');

    await this.assertTemplateAssets([
      input.logoFileAssetId,
      input.backgroundFileAssetId,
      input.signatureFileAssetId,
    ]);

    const primaryColor = input.primaryColor ?? '#714b67';
    const design: CertificateDesignTemplate = {
      titleTranslations: this.localizedSnapshot(input.titleTranslations),
      introTranslations: this.localizedSnapshot(input.introTranslations),
      bodyTranslations: this.localizedSnapshot(input.bodyTranslations),
      logoFileAssetId: input.logoFileAssetId ?? null,
      backgroundFileAssetId: input.backgroundFileAssetId ?? null,
      signatureFileAssetId: input.signatureFileAssetId ?? null,
      signatoryName: this.optionalText(input.signatoryName),
      signatoryTitle: this.optionalText(input.signatoryTitle),
      primaryColor,
      backgroundPresetKey: this.normalizePresetKey(input.backgroundPresetKey),
      layoutVersion: 1,
      layoutConfig: normalizeTrainingCertificateLayout(
        input.layoutConfig,
        primaryColor,
      ) as unknown as Prisma.JsonValue,
    };

    const [logo, background, signature] = await Promise.all([
      this.readTemplateAsset(design.logoFileAssetId),
      this.readTemplateAsset(design.backgroundFileAssetId),
      this.readTemplateAsset(design.signatureFileAssetId),
    ]);

    const locale = input.locale ?? 'en';
    const pdf = await this.buildCertificatePdf({
      template: design,
      locale,
      learnerName: input.sampleLearnerName?.trim() || 'Daban Hameed Iskandar',
      companyName: input.sampleCompanyName?.trim() || 'OdooKRD',
      courseTitle:
        input.sampleCourseTitle?.trim() || 'Odoo Accounting: Getting Started',
      completedAt: new Date('2026-09-03T00:00:00.000Z'),
      scorePercentage: 96,
      certificateNumber: 'OKRD-TRN-PREVIEW',
      verificationCode: 'PREVIEW-ONLY-NOT-ISSUED',
      logo,
      background,
      signature,
    });

    return { buffer: pdf, filename: 'certificate-preview.pdf' };
  }

  async courseStatus(principal: AuthenticatedPrincipal, slug: string) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);

    const completion = await this.completions.reconcileForContext(
      context,
      courseId,
      context.now,
    );

    const [course, user, certificate] = await Promise.all([
      this.prisma.trainingCourse.findUnique({
        where: { id: courseId },
        select: {
          certificateEnabled: true,
          certificateTemplate: {
            select: { id: true, active: true, status: true },
          },
        },
      }),
      this.prisma.user.findFirst({
        where: {
          id: context.userId,
          companyId: context.companyId,
        },
        select: { certificateName: true },
      }),
      completion
        ? this.prisma.trainingCertificate.findUnique({
            where: { completionId: completion.id },
            select: certificateSelect,
          })
        : Promise.resolve(null),
    ]);

    if (!course || !user) {
      throw new NotFoundException('Training certificate status was not found.');
    }

    const templateAvailable =
      course.certificateEnabled &&
      course.certificateTemplate?.active === true &&
      course.certificateTemplate.status ===
        TrainingCertificateTemplateStatus.ACTIVE;

    return {
      courseId,
      certificateEnabled: course.certificateEnabled,
      templateAvailable,
      eligible: completion !== null && templateAvailable,
      certificateName: user.certificateName,
      issued: certificate ? this.presentCertificate(certificate) : null,
    };
  }

  async issue(
    principal: AuthenticatedPrincipal,
    slug: string,
    input: IssueTrainingCertificateDto,
  ) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);

    const completion = await this.completions.reconcileForContext(
      context,
      courseId,
      context.now,
    );
    if (!completion) {
      throw new ConflictException(
        'Complete all required course learning before issuing a certificate.',
      );
    }

    const existing = await this.prisma.trainingCertificate.findUnique({
      where: { completionId: completion.id },
      select: certificateSelect,
    });
    if (existing) {
      return this.presentCertificate(existing);
    }

    const certificateName = normalizeTrainingCertificateName(
      input.certificateName,
    );
    if (!certificateName) {
      throw new BadRequestException('Enter a valid certificate name.');
    }

    const [course, completionRecord, user] = await Promise.all([
      this.prisma.trainingCourse.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          certificateEnabled: true,
          certificateTemplate: {
            select: templateSelect,
          },
        },
      }),
      this.prisma.trainingCourseCompletion.findFirst({
        where: {
          id: completion.id,
          companyId: context.companyId,
          userId: context.userId,
          courseId,
        },
        select: {
          id: true,
          courseTitleSnapshot: true,
          courseTitleTranslations: true,
          finalScorePercentage: true,
          completedAt: true,
        },
      }),
      this.prisma.user.findFirst({
        where: {
          id: context.userId,
          companyId: context.companyId,
        },
        select: {
          id: true,
          email: true,
          company: { select: { name: true } },
        },
      }),
    ]);

    if (
      !course?.certificateEnabled ||
      !course.certificateTemplate?.active ||
      course.certificateTemplate.status !==
        TrainingCertificateTemplateStatus.ACTIVE ||
      !completionRecord ||
      !user?.company
    ) {
      throw new ConflictException(
        'Certificate issuance is not configured for this course.',
      );
    }

    // Capture narrowed relation values before entering nested async callbacks.
    // TypeScript intentionally does not preserve property narrowing across
    // closures because object properties could theoretically change.
    const certificateTemplate = course.certificateTemplate;
    const company = user.company;

    const locale = input.locale;
    const certificateNumber = this.certificateNumber();
    const verificationCode = randomBytes(18).toString('base64url');
    const verificationCodeHash = createHash('sha256')
      .update(verificationCode)
      .digest('hex');

    const [logo, background, signature] = await Promise.all([
      this.readTemplateAsset(certificateTemplate.logoFileAssetId),
      this.readTemplateAsset(certificateTemplate.backgroundFileAssetId),
      this.readTemplateAsset(certificateTemplate.signatureFileAssetId),
    ]);

    const pdf = await this.buildCertificatePdf({
      template: certificateTemplate,
      locale,
      learnerName: certificateName,
      companyName: company.name,
      courseTitle: resolveTrainingCertificateText(
        completionRecord.courseTitleTranslations,
        locale,
        completionRecord.courseTitleSnapshot,
      ),
      completedAt: completionRecord.completedAt,
      scorePercentage: completionRecord.finalScorePercentage,
      certificateNumber,
      verificationCode,
      logo,
      background,
      signature,
    });

    const pdfChecksum = createHash('sha256').update(pdf).digest('hex');
    const storageProvider = await this.storage.getConfiguredProvider();
    const storageKey = this.storage.createStorageKey(
      AccountScope.COMPANY,
      context.companyId,
    );

    await this.storage.put(storageProvider, {
      storageKey,
      buffer: pdf,
      mimeType: 'application/pdf',
      sha256: pdfChecksum,
    });

    try {
      const issued = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: context.userId },
          data: { certificateName },
        });

        const certificate = await tx.trainingCertificate.create({
          data: {
            completionId: completionRecord.id,
            templateId: certificateTemplate.id,
            companyId: context.companyId,
            userId: context.userId,
            courseId,
            certificateNumber,
            verificationCodeHash,
            learnerNameSnapshot: certificateName,
            learnerEmailSnapshot: user.email,
            companyNameSnapshot: company.name,
            courseTitleSnapshot: completionRecord.courseTitleSnapshot,
            courseTitleTranslations: this.localizedSnapshot(
              completionRecord.courseTitleTranslations,
            ),
            locale,
            scorePercentage: completionRecord.finalScorePercentage,
            status: TrainingCertificateStatus.ACTIVE,
            issuedAt: context.now,
            pdfStorageProvider: this.trainingStorageProvider(storageProvider),
            pdfStorageReference: storageKey,
            pdfChecksum,
            templateLayoutVersion: certificateTemplate.layoutVersion,
            templateSnapshot: this.templateSnapshot(certificateTemplate),
          },
          select: certificateSelect,
        });

        await tx.auditLog.create({
          data: {
            actorUserId: context.userId,
            companyId: context.companyId,
            action: AUDIT_ACTIONS.TRAINING_CERTIFICATE_ISSUED,
            targetType: 'training_certificate',
            targetId: certificate.id,
            metadata: {
              courseId,
              certificateNumber,
              locale,
            },
          },
        });

        return certificate;
      });

      return this.presentCertificate(issued);
    } catch (error: unknown) {
      await this.storage.delete(storageProvider, storageKey).catch(() => {});

      if (this.isUniqueConstraintError(error)) {
        const concurrent = await this.prisma.trainingCertificate.findUnique({
          where: { completionId: completionRecord.id },
          select: certificateSelect,
        });
        if (concurrent) return this.presentCertificate(concurrent);
      }

      throw error;
    }
  }

  async listMine(
    principal: AuthenticatedPrincipal,
    query: ListTrainingCertificatesQueryDto,
  ) {
    const companyId = this.requireCustomer(principal);

    const where: Prisma.TrainingCertificateWhereInput = {
      companyId,
      userId: principal.userId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trainingCertificate.findMany({
        where,
        select: certificateSelect,
        orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCertificate.count({ where }),
    ]);

    return {
      items: items.map((item) => this.presentCertificate(item)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async openMine(principal: AuthenticatedPrincipal, certificateId: string) {
    const companyId = this.requireCustomer(principal);

    const certificate = await this.prisma.trainingCertificate.findFirst({
      where: {
        id: certificateId,
        userId: principal.userId,
        companyId,
      },
      select: certificateSelect,
    });

    if (!certificate) {
      throw new NotFoundException('Training certificate was not found.');
    }

    if (certificate.status !== TrainingCertificateStatus.ACTIVE) {
      throw new ConflictException('This training certificate was revoked.');
    }

    if (
      !certificate.pdfStorageProvider ||
      !certificate.pdfStorageReference ||
      !certificate.pdfChecksum
    ) {
      throw new NotFoundException('Certificate PDF was not found.');
    }

    const provider = this.fileStorageProvider(certificate.pdfStorageProvider);
    const stream = await this.storage.open(
      provider,
      certificate.pdfStorageReference,
    );
    const chunks: Buffer[] = [];

    try {
      for await (const chunk of stream as AsyncIterable<unknown>) {
        if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
          chunks.push(Buffer.from(chunk));
        } else {
          throw new Error('Unsupported certificate stream chunk.');
        }
      }
    } catch {
      throw new InternalServerErrorException(
        'Certificate PDF could not be read.',
      );
    }

    const buffer = Buffer.concat(chunks);
    const checksum = createHash('sha256').update(buffer).digest('hex');
    if (checksum !== certificate.pdfChecksum) {
      throw new InternalServerErrorException(
        'Certificate PDF integrity check failed.',
      );
    }

    return {
      buffer,
      filename: `${certificate.certificateNumber}.pdf`,
    };
  }

  async listAdmin(
    principal: AuthenticatedPrincipal,
    query: ListTrainingCertificatesQueryDto,
  ) {
    this.assertPlatform(principal);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trainingCertificate.findMany({
        select: certificateSelect,
        orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCertificate.count(),
    ]);

    return {
      items: items.map((item) => this.presentCertificate(item)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async revoke(
    principal: AuthenticatedPrincipal,
    certificateId: string,
    input: RevokeTrainingCertificateDto,
  ) {
    this.assertPlatform(principal);

    const reason = input.reason.trim();
    if (reason.length < 3) {
      throw new BadRequestException('Enter a revocation reason.');
    }

    const existing = await this.prisma.trainingCertificate.findUnique({
      where: { id: certificateId },
      select: certificateSelect,
    });
    if (!existing) {
      throw new NotFoundException('Training certificate was not found.');
    }
    if (existing.status === TrainingCertificateStatus.REVOKED) {
      return this.presentCertificate(existing);
    }

    const revoked = await this.prisma.$transaction(async (tx) => {
      const certificate = await tx.trainingCertificate.update({
        where: { id: certificateId },
        data: {
          status: TrainingCertificateStatus.REVOKED,
          revokedAt: new Date(),
          revocationReason: reason,
        },
        select: certificateSelect,
      });

      await tx.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: certificate.companyId,
          action: AUDIT_ACTIONS.TRAINING_CERTIFICATE_REVOKED,
          targetType: 'training_certificate',
          targetId: certificate.id,
          metadata: { reason },
        },
      });

      return certificate;
    });

    return this.presentCertificate(revoked);
  }

  private async buildCertificatePdf(input: {
    template: CertificateDesignTemplate;
    locale: TrainingCertificateLocale;
    learnerName: string;
    companyName: string;
    courseTitle: string;
    completedAt: Date;
    scorePercentage: number | null;
    certificateNumber: string;
    verificationCode: string;
    logo: Buffer | null;
    background: Buffer | null;
    signature: Buffer | null;
  }): Promise<Buffer> {
    const defaults = {
      ku: {
        title: 'بڕوانامەی تەواوکردن',
        intro: 'ئەم بڕوانامەیە بە شانازییەوە پێشکەش دەکرێت بە',
        body: 'بۆ بەسەرکەوتوویی تەواوکردنی پێداویستییە فێرکارییەکانی',
      },
      ar: {
        title: 'شهادة إكمال',
        intro: 'تُقدَّم هذه الشهادة بكل فخر إلى',
        body: 'لإتمامه بنجاح جميع المتطلبات التعليمية الخاصة بـ',
      },
      en: {
        title: 'Certificate of Completion',
        intro: 'This certificate is proudly presented to',
        body: 'for successfully completing all learning requirements for',
      },
    } as const;

    const title = resolveTrainingCertificateText(
      input.template.titleTranslations,
      input.locale,
      defaults[input.locale].title,
    );
    const intro = resolveTrainingCertificateText(
      input.template.introTranslations,
      input.locale,
      defaults[input.locale].intro,
    );
    const body = resolveTrainingCertificateText(
      input.template.bodyTranslations,
      input.locale,
      defaults[input.locale].body,
    );

    const direction = input.locale === 'en' ? 'ltr' : 'rtl';
    const completed = new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(input.completedAt);

    const layout = normalizeTrainingCertificateLayout(
      input.template.layoutConfig,
      input.template.primaryColor,
    );
    const preset = getTrainingCertificateBackgroundPreset(
      input.template.backgroundPresetKey,
    );

    let presetBackground: Buffer | null = null;
    if (preset) {
      try {
        presetBackground = await sharp(Buffer.from(preset.svg, 'utf8'), {
          density: 144,
        })
          .resize(1600, 1131, { fit: 'fill' })
          .png()
          .toBuffer();
      } catch {
        throw new InternalServerErrorException(
          'Certificate background preset could not be rendered.',
        );
      }
    }

    const dataUri = (asset: Buffer | null): string | null =>
      asset ? `data:image/png;base64,${asset.toString('base64')}` : null;

    const background = dataUri(presetBackground ?? input.background);
    const logo = dataUri(input.logo);
    const signature = dataUri(input.signature);

    const anchor = (align: 'left' | 'center' | 'right') =>
      align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
    const textX = (
      element: TrainingCertificateLayoutConfig['elements']['title'],
    ) =>
      element.align === 'left'
        ? element.x - element.width / 2
        : element.align === 'right'
          ? element.x + element.width / 2
          : element.x;
    const font = (family: string) => trainingCertificateFontFamily(family);
    const textNode = (
      value: string,
      element: TrainingCertificateLayoutConfig['elements']['title'],
      options?: { y?: number; fontSize?: number; fontWeight?: number },
    ) => {
      if (!element.visible || !value) return '';
      return `<text x="${textX(element)}" y="${options?.y ?? element.y}" text-anchor="${anchor(element.align)}" direction="${direction}" unicode-bidi="plaintext" font-family="${font(element.fontFamily)}" font-size="${options?.fontSize ?? element.fontSize}" font-weight="${options?.fontWeight ?? element.fontWeight}" font-stretch="normal" letter-spacing="0" fill="${escapeTrainingCertificateXml(element.color)}">${escapeTrainingCertificateXml(value)}</text>`;
    };
    const wrappedText = (
      value: string,
      element: TrainingCertificateLayoutConfig['elements']['body'],
    ) => {
      if (!element.visible || !value) return '';
      const maxCharacters = Math.max(
        18,
        Math.floor(element.width / Math.max(10, element.fontSize * 0.55)),
      );
      const lines = wrapTrainingCertificateText(value, maxCharacters);
      const lineHeight = Math.round(element.fontSize * 1.5);
      const startY = element.y - ((lines.length - 1) * lineHeight) / 2;
      return lines
        .map((line, index) =>
          textNode(line, element, { y: startY + index * lineHeight }),
        )
        .join('');
    };

    const learner = layout.elements.learnerName;
    const learnerFontSize = Math.max(
      28,
      Math.min(
        learner.fontSize,
        input.learnerName.length > 55
          ? learner.fontSize * 0.68
          : input.learnerName.length > 35
            ? learner.fontSize * 0.82
            : learner.fontSize,
      ),
    );

    const course = layout.elements.courseTitle;
    const courseLines = wrapTrainingCertificateText(
      input.courseTitle,
      Math.max(
        20,
        Math.floor(course.width / Math.max(10, course.fontSize * 0.55)),
      ),
    );
    const courseLineHeight = Math.round(course.fontSize * 1.35);
    const courseStartY =
      course.y - ((courseLines.length - 1) * courseLineHeight) / 2;
    const courseSvg = course.visible
      ? courseLines
          .map((line, index) =>
            textNode(line, course, {
              y: courseStartY + index * courseLineHeight,
            }),
          )
          .join('')
      : '';

    const detailsText = `${input.companyName} · ${completed}`;
    const scoreText =
      input.scorePercentage === null
        ? ''
        : input.locale === 'ku'
          ? `نمرەی کۆتایی: ${input.scorePercentage}%`
          : input.locale === 'ar'
            ? `النتيجة النهائية: ${input.scorePercentage}%`
            : `Final score: ${input.scorePercentage}%`;

    const logoElement = layout.elements.logo;
    const signatureElement = layout.elements.signature;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="1131" viewBox="0 0 1600 1131" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1131" fill="#ffffff"/>
  ${background ? `<image href="${background}" x="0" y="0" width="1600" height="1131" preserveAspectRatio="xMidYMid slice"/>` : ''}
  ${logo && logoElement.visible ? `<image href="${logo}" x="${logoElement.x - logoElement.width / 2}" y="${logoElement.y - logoElement.height / 2}" width="${logoElement.width}" height="${logoElement.height}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  ${textNode(title, layout.elements.title)}
  ${textNode(intro, layout.elements.intro)}
  ${textNode(input.learnerName, learner, { fontSize: learnerFontSize })}
  ${wrappedText(body, layout.elements.body)}
  ${courseSvg}
  ${textNode(detailsText, layout.elements.details)}
  ${scoreText ? textNode(scoreText, layout.elements.score) : ''}
  ${signature && signatureElement.visible ? `<image href="${signature}" x="${signatureElement.x - signatureElement.width / 2}" y="${signatureElement.y - signatureElement.height / 2}" width="${signatureElement.width}" height="${signatureElement.height}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  ${input.template.signatoryName ? textNode(input.template.signatoryName, layout.elements.signatoryName) : ''}
  ${input.template.signatoryTitle ? textNode(input.template.signatoryTitle, layout.elements.signatoryTitle) : ''}
  ${textNode(`Certificate: ${input.certificateNumber}`, layout.elements.certificateNumber)}
  ${textNode(`Verification code: ${input.verificationCode}`, layout.elements.verificationCode)}
</svg>`;

    let png: Buffer;
    try {
      png = await sharp(Buffer.from(svg), { density: 180 }).png().toBuffer();
    } catch {
      throw new InternalServerErrorException(
        'Certificate artwork could not be rendered.',
      );
    }

    const document = await PDFDocument.create();
    document.setTitle(`${title} - ${input.learnerName}`);
    document.setSubject(input.courseTitle);
    document.setCreator('OdooKRD Customer Platform');
    const page = document.addPage([841.89, 595.28]);
    const embedded = await document.embedPng(png);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });

    return Buffer.from(await document.save());
  }

  private async readTemplateAsset(
    fileId: string | null,
  ): Promise<Buffer | null> {
    if (!fileId) return null;

    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id: fileId,
        accountScope: AccountScope.PLATFORM,
        companyId: null,
        kind: FileAssetKind.IMAGE,
        status: FileAssetStatus.READY,
        mimeType: {
          in: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        },
      },
      select: {
        storageProvider: true,
        storageKey: true,
        sizeBytes: true,
        sha256: true,
      },
    });
    if (!asset) {
      throw new ConflictException(
        'A certificate template image is no longer available.',
      );
    }

    const stream = await this.storage.open(
      asset.storageProvider,
      asset.storageKey,
    );
    const chunks: Buffer[] = [];

    for await (const chunk of stream as AsyncIterable<unknown>) {
      if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk));
      } else {
        throw new InternalServerErrorException(
          'Certificate template image could not be read.',
        );
      }
    }

    const source = Buffer.concat(chunks);
    const checksum = createHash('sha256').update(source).digest('hex');
    if (source.length !== asset.sizeBytes || checksum !== asset.sha256) {
      throw new InternalServerErrorException(
        'Certificate template image integrity check failed.',
      );
    }

    try {
      return await sharp(source, { failOn: 'error', density: 180 })
        .png()
        .toBuffer();
    } catch {
      throw new InternalServerErrorException(
        'Certificate template image could not be decoded.',
      );
    }
  }

  private async assertTemplateAssets(
    values: Array<string | null | undefined>,
  ): Promise<void> {
    const ids = [
      ...new Set(values.filter((value): value is string => Boolean(value))),
    ];
    if (ids.length === 0) return;

    const assets = await this.prisma.fileAsset.findMany({
      where: {
        id: { in: ids },
        accountScope: AccountScope.PLATFORM,
        companyId: null,
        kind: FileAssetKind.IMAGE,
        status: FileAssetStatus.READY,
        mimeType: {
          in: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        },
      },
      select: { id: true },
    });

    if (assets.length !== ids.length) {
      throw new BadRequestException(
        'Certificate artwork must use active platform PNG, JPEG, WEBP or SVG image assets.',
      );
    }
  }

  private resolveTemplateStatus(
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | undefined,
    active: boolean | undefined,
  ): TrainingCertificateTemplateStatus {
    if (status) {
      return status;
    }
    return active === false
      ? TrainingCertificateTemplateStatus.DRAFT
      : TrainingCertificateTemplateStatus.ACTIVE;
  }

  private normalizePresetKey(value: string | null | undefined): string | null {
    const key = value?.trim() || null;
    if (!key) return null;
    if (!getTrainingCertificateBackgroundPreset(key)) {
      throw new BadRequestException(
        'The selected certificate background preset is invalid.',
      );
    }
    return key;
  }

  private templateSnapshot(template: TemplateRecord): Prisma.InputJsonObject {
    return {
      version: 1,
      templateId: template.id,
      key: template.key,
      name: template.name,
      titleTranslations: this.localizedSnapshot(template.titleTranslations),
      introTranslations: this.localizedSnapshot(template.introTranslations),
      bodyTranslations: this.localizedSnapshot(template.bodyTranslations),
      ...(template.logoFileAssetId
        ? { logoFileAssetId: template.logoFileAssetId }
        : {}),
      ...(template.backgroundFileAssetId
        ? { backgroundFileAssetId: template.backgroundFileAssetId }
        : {}),
      ...(template.signatureFileAssetId
        ? { signatureFileAssetId: template.signatureFileAssetId }
        : {}),
      ...(template.signatoryName
        ? { signatoryName: template.signatoryName }
        : {}),
      ...(template.signatoryTitle
        ? { signatoryTitle: template.signatoryTitle }
        : {}),
      primaryColor: template.primaryColor,
      ...(template.backgroundPresetKey
        ? { backgroundPresetKey: template.backgroundPresetKey }
        : {}),
      layoutVersion: template.layoutVersion,
      layoutConfig: normalizeTrainingCertificateLayout(
        template.layoutConfig,
        template.primaryColor,
      ) as unknown as Prisma.InputJsonValue,
    };
  }

  private assertLocalizedText(value: unknown, field: string): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(`${field} is required.`);
    }

    const source = value as Record<string, unknown>;
    const authored = ['ku', 'ar', 'en'].some((locale) => {
      const candidate = source[locale];
      return typeof candidate === 'string' && candidate.trim().length > 0;
    });
    if (!authored) {
      throw new BadRequestException(
        `${field} requires at least one authored language.`,
      );
    }
  }

  private presentTemplate(template: TemplateRecord) {
    return {
      ...template,
      layoutConfig: normalizeTrainingCertificateLayout(
        template.layoutConfig,
        template.primaryColor,
      ),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  private presentCertificate(certificate: CertificateRecord) {
    return {
      id: certificate.id,
      completionId: certificate.completionId,
      companyId: certificate.companyId,
      userId: certificate.userId,
      courseId: certificate.courseId,
      certificateNumber: certificate.certificateNumber,
      learnerName: certificate.learnerNameSnapshot,
      learnerEmail: certificate.learnerEmailSnapshot,
      companyName: certificate.companyNameSnapshot,
      courseTitle: certificate.courseTitleSnapshot,
      courseTitleTranslations: certificate.courseTitleTranslations,
      locale: certificate.locale as TrainingCertificateLocale,
      scorePercentage: certificate.scorePercentage,
      status: certificate.status,
      issuedAt: certificate.issuedAt.toISOString(),
      expiresAt: certificate.expiresAt?.toISOString() ?? null,
      revokedAt: certificate.revokedAt?.toISOString() ?? null,
      revocationReason: certificate.revocationReason,
      downloadPath: `/training/certificates/${certificate.id}/pdf`,
    };
  }

  private certificateNumber(): string {
    const year = new Date().getUTCFullYear();
    return `OKRD-TRN-${year}-${randomBytes(5).toString('hex').toUpperCase()}`;
  }

  private localizedSnapshot(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const source = value as Record<string, unknown>;
    const ku = source.ku;
    const ar = source.ar;
    const en = source.en;

    return {
      ...(typeof ku === 'string' && ku.trim() ? { ku: ku.trim() } : {}),
      ...(typeof ar === 'string' && ar.trim() ? { ar: ar.trim() } : {}),
      ...(typeof en === 'string' && en.trim() ? { en: en.trim() } : {}),
    };
  }

  private optionalText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private assertPlatform(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Certificate administration is restricted to platform accounts.',
      );
    }
  }

  private requireCustomer(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('A company account is required.');
    }

    return principal.companyId;
  }

  private trainingStorageProvider(
    provider: FileStorageProvider,
  ): TrainingStorageProvider {
    return provider === FileStorageProvider.AWS_S3
      ? TrainingStorageProvider.AWS_S3
      : TrainingStorageProvider.LOCAL;
  }

  private fileStorageProvider(
    provider: TrainingStorageProvider,
  ): FileStorageProvider {
    return provider === TrainingStorageProvider.AWS_S3
      ? FileStorageProvider.AWS_S3
      : FileStorageProvider.LOCAL;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }
}
