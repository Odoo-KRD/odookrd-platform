import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  CompanyIdentityChangeRequestStatus,
  FileAssetKind,
} from '../../generated/prisma/enums';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { detectSupportedFile } from '../files/file-signature.validator';
import { FilesService, type UploadedFilePayload } from '../files/files.service';
import type {
  CreateCompanyIdentityChangeRequestDto,
  ReviewCompanyIdentityChangeRequestDto,
  UpdateCompanyContactDto,
  UpdateCompanyProfileDto,
} from './dto/company-profile.dto';

const COMPANY_LOGO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const companyProfileSelect = {
  id: true,
  name: true,
  nameTranslations: true,
  status: true,
  slug: true,
  contactEmail: true,
  websiteUrl: true,
  phone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  region: true,
  postalCode: true,
  countryCode: true,
  logoFileAssetId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

const identityRequestSelect = {
  id: true,
  companyId: true,
  requestedByUserId: true,
  proposedName: true,
  proposedLogoFileAssetId: true,
  status: true,
  reviewNote: true,
  reviewedByUserId: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  requestedBy: {
    select: {
      email: true,
    },
  },
} satisfies Prisma.CompanyIdentityChangeRequestSelect;

type CompanyProfileRecord = Prisma.CompanyGetPayload<{
  select: typeof companyProfileSelect;
}>;

type IdentityRequestRecord = Prisma.CompanyIdentityChangeRequestGetPayload<{
  select: typeof identityRequestSelect;
}>;

@Injectable()
export class CompanyProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly audit: AuditService,
  ) {}

  async getOwnProfile(principal: AuthenticatedPrincipal) {
    return this.getProfile(principal, this.requireCompany(principal));
  }

  async getPlatformProfile(
    principal: AuthenticatedPrincipal,
    companyId: string,
  ) {
    this.assertPlatform(principal);
    return this.getProfile(principal, companyId);
  }

  async updateOwnContact(
    principal: AuthenticatedPrincipal,
    input: UpdateCompanyContactDto,
  ) {
    const companyId = this.requireCompany(principal);
    const data = this.contactData(input);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one contact field is required.');
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.company.updateMany({
        where: { id: companyId },
        data,
      });

      if (result.count !== 1) {
        throw new NotFoundException('Company was not found.');
      }

      await this.audit.write(
        {
          actorUserId: principal.userId,
          companyId,
          action: AUDIT_ACTIONS.COMPANY_CONTACT_UPDATED,
          targetType: 'company',
          targetId: companyId,
          metadata: { fields: Object.keys(data) },
        },
        transaction,
      );

      return transaction.company.findUniqueOrThrow({
        where: { id: companyId },
        select: companyProfileSelect,
      });
    });

    return this.presentCompany(updated);
  }

  async updatePlatformProfile(
    principal: AuthenticatedPrincipal,
    companyId: string,
    input: UpdateCompanyProfileDto,
  ) {
    this.assertPlatform(principal);

    const current = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!current) {
      throw new NotFoundException('Company was not found.');
    }

    const data: Prisma.CompanyUpdateInput = {
      ...this.contactData(input),
    };

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        throw new BadRequestException('Company name cannot be blank.');
      }
      data.name = name;
    }

    if (input.nameTranslations !== undefined) {
      data.nameTranslations = normalizeLocalizedText(
        input.nameTranslations,
        input.name ?? current.name,
      );
    }

    if (input.slug !== undefined) {
      data.slug = this.optionalText(input.slug);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one company field is required.');
    }

    try {
      const updated = await this.prisma.$transaction(async (transaction) => {
        const company = await transaction.company.update({
          where: { id: companyId },
          data,
          select: companyProfileSelect,
        });

        await this.audit.write(
          {
            actorUserId: principal.userId,
            companyId,
            action: AUDIT_ACTIONS.COMPANY_PROFILE_UPDATED,
            targetType: 'company',
            targetId: companyId,
            metadata: { fields: Object.keys(data) },
          },
          transaction,
        );

        return company;
      });

      return this.presentCompany(updated);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2002'
      ) {
        throw new ConflictException('The company slug is already in use.');
      }
      throw error;
    }
  }

  async createIdentityRequest(
    principal: AuthenticatedPrincipal,
    input: CreateCompanyIdentityChangeRequestDto,
    file: UploadedFilePayload | undefined,
  ) {
    const companyId = this.requireCompany(principal);
    const proposedName = this.optionalText(input.proposedName);

    const existing = await this.prisma.companyIdentityChangeRequest.findFirst({
      where: {
        companyId,
        status: CompanyIdentityChangeRequestStatus.PENDING,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'A company identity change request is already pending review.',
      );
    }

    let uploaded: { id: string } | null = null;

    if (file?.buffer?.length) {
      const normalized = await this.normalizeLogo(file);
      uploaded = await this.files.upload(
        principal,
        { kind: FileAssetKind.IMAGE, companyId },
        normalized,
      );
    }

    if (!proposedName && !uploaded) {
      throw new BadRequestException(
        'Suggest a company name, a company logo, or both.',
      );
    }

    try {
      const request = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.companyIdentityChangeRequest.create({
          data: {
            companyId,
            requestedByUserId: principal.userId,
            proposedName,
            proposedLogoFileAssetId: uploaded?.id ?? null,
          },
          select: identityRequestSelect,
        });

        await this.audit.write(
          {
            actorUserId: principal.userId,
            companyId,
            action: AUDIT_ACTIONS.COMPANY_IDENTITY_CHANGE_REQUESTED,
            targetType: 'company_identity_change_request',
            targetId: created.id,
            metadata: {
              proposedName: Boolean(proposedName),
              proposedLogo: Boolean(uploaded),
            },
          },
          transaction,
        );

        return created;
      });

      return this.presentRequest(request);
    } catch (error) {
      if (uploaded) {
        await this.files.delete(principal, uploaded.id).catch(() => undefined);
      }
      throw error;
    }
  }

  async listOwnIdentityRequests(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal);
    const requests = await this.prisma.companyIdentityChangeRequest.findMany({
      where: { companyId },
      select: identityRequestSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
    });

    return requests.map((request) => this.presentRequest(request));
  }

  async listPlatformIdentityRequests(
    principal: AuthenticatedPrincipal,
    companyId: string,
  ) {
    this.assertPlatform(principal);
    await this.requireExistingCompany(companyId);

    const requests = await this.prisma.companyIdentityChangeRequest.findMany({
      where: { companyId },
      select: identityRequestSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
    });

    return requests.map((request) => this.presentRequest(request));
  }

  async reviewIdentityRequest(
    principal: AuthenticatedPrincipal,
    companyId: string,
    requestId: string,
    input: ReviewCompanyIdentityChangeRequestDto,
  ) {
    this.assertPlatform(principal);

    const request = await this.prisma.companyIdentityChangeRequest.findFirst({
      where: { id: requestId, companyId },
      select: identityRequestSelect,
    });

    if (!request) {
      throw new NotFoundException('Company identity request was not found.');
    }

    if (request.status !== CompanyIdentityChangeRequestStatus.PENDING) {
      throw new ConflictException(
        'Only pending company identity requests can be reviewed.',
      );
    }

    const decision =
      input.decision === 'APPROVED'
        ? CompanyIdentityChangeRequestStatus.APPROVED
        : CompanyIdentityChangeRequestStatus.REJECTED;
    const reviewedAt = new Date();

    const previousCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        logoFileAssetId: true,
        nameTranslations: true,
      },
    });

    if (!previousCompany) {
      throw new NotFoundException('Company was not found.');
    }

    const updatedRequest = await this.prisma.$transaction(
      async (transaction) => {
        if (decision === CompanyIdentityChangeRequestStatus.APPROVED) {
          await transaction.company.update({
            where: { id: companyId },
            data: {
              ...(request.proposedName
                ? {
                    name: request.proposedName,
                    nameTranslations: normalizeLocalizedText(
                      { ku: request.proposedName },
                      request.proposedName,
                    ),
                  }
                : {}),
              ...(request.proposedLogoFileAssetId
                ? { logoFileAssetId: request.proposedLogoFileAssetId }
                : {}),
            },
          });
        }

        const reviewed = await transaction.companyIdentityChangeRequest.update({
          where: { id: request.id },
          data: {
            status: decision,
            reviewNote: this.optionalText(input.reviewNote),
            reviewedByUserId: principal.userId,
            reviewedAt,
          },
          select: identityRequestSelect,
        });

        await this.audit.write(
          {
            actorUserId: principal.userId,
            companyId,
            action: AUDIT_ACTIONS.COMPANY_IDENTITY_CHANGE_REVIEWED,
            targetType: 'company_identity_change_request',
            targetId: request.id,
            metadata: {
              decision,
              appliedName: Boolean(
                decision === CompanyIdentityChangeRequestStatus.APPROVED &&
                request.proposedName,
              ),
              appliedLogo: Boolean(
                decision === CompanyIdentityChangeRequestStatus.APPROVED &&
                request.proposedLogoFileAssetId,
              ),
            },
          },
          transaction,
        );

        return reviewed;
      },
    );

    if (
      decision === CompanyIdentityChangeRequestStatus.APPROVED &&
      request.proposedLogoFileAssetId &&
      previousCompany.logoFileAssetId &&
      previousCompany.logoFileAssetId !== request.proposedLogoFileAssetId
    ) {
      await this.files
        .delete(principal, previousCompany.logoFileAssetId)
        .catch(() => undefined);
    }

    return this.presentRequest(updatedRequest);
  }

  async updatePlatformLogo(
    principal: AuthenticatedPrincipal,
    companyId: string,
    file: UploadedFilePayload | undefined,
  ) {
    this.assertPlatform(principal);
    await this.requireExistingCompany(companyId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('A company logo is required.');
    }

    const normalized = await this.normalizeLogo(file);
    const uploaded = await this.files.upload(
      principal,
      { kind: FileAssetKind.IMAGE, companyId },
      normalized,
    );

    const current = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { logoFileAssetId: true },
    });

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.company.update({
          where: { id: companyId },
          data: { logoFileAssetId: uploaded.id },
        });

        await this.audit.write(
          {
            actorUserId: principal.userId,
            companyId,
            action: AUDIT_ACTIONS.COMPANY_LOGO_UPDATED,
            targetType: 'company',
            targetId: companyId,
            metadata: {
              previousLogoFileAssetId: current.logoFileAssetId,
              logoFileAssetId: uploaded.id,
            },
          },
          transaction,
        );
      });
    } catch (error) {
      await this.files.delete(principal, uploaded.id).catch(() => undefined);
      throw error;
    }

    if (current.logoFileAssetId && current.logoFileAssetId !== uploaded.id) {
      await this.files
        .delete(principal, current.logoFileAssetId)
        .catch(() => undefined);
    }

    return this.getPlatformProfile(principal, companyId);
  }

  async deletePlatformLogo(
    principal: AuthenticatedPrincipal,
    companyId: string,
  ) {
    this.assertPlatform(principal);

    const current = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, logoFileAssetId: true },
    });

    if (!current) {
      throw new NotFoundException('Company was not found.');
    }

    if (!current.logoFileAssetId) {
      return this.getPlatformProfile(principal, companyId);
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: { logoFileAssetId: null },
    });

    await this.files
      .delete(principal, current.logoFileAssetId)
      .catch(() => undefined);

    return this.getPlatformProfile(principal, companyId);
  }

  async getOwnLogo(principal: AuthenticatedPrincipal) {
    return this.getLogo(principal, this.requireCompany(principal));
  }

  async getPlatformLogo(principal: AuthenticatedPrincipal, companyId: string) {
    this.assertPlatform(principal);
    return this.getLogo(principal, companyId);
  }

  async getPlatformRequestLogo(
    principal: AuthenticatedPrincipal,
    companyId: string,
    requestId: string,
  ) {
    this.assertPlatform(principal);
    const request = await this.prisma.companyIdentityChangeRequest.findFirst({
      where: { id: requestId, companyId },
      select: { proposedLogoFileAssetId: true },
    });

    if (!request?.proposedLogoFileAssetId) {
      throw new NotFoundException('Proposed company logo was not found.');
    }

    return this.files.openContent(principal, request.proposedLogoFileAssetId);
  }

  private async getProfile(
    principal: AuthenticatedPrincipal,
    companyId: string,
  ) {
    if (
      principal.accountScope === AccountScope.COMPANY &&
      principal.companyId !== companyId
    ) {
      throw new NotFoundException('Company was not found.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: companyProfileSelect,
    });

    if (!company) {
      throw new NotFoundException('Company was not found.');
    }

    return this.presentCompany(company);
  }

  private async getLogo(principal: AuthenticatedPrincipal, companyId: string) {
    const profile = await this.getProfile(principal, companyId);

    if (!profile.logoFileAssetId) {
      throw new NotFoundException('Company logo was not found.');
    }

    return this.files.openContent(principal, profile.logoFileAssetId);
  }

  private contactData(
    input: UpdateCompanyContactDto,
  ): Prisma.CompanyUpdateInput {
    return {
      ...(input.contactEmail === undefined
        ? {}
        : { contactEmail: this.optionalText(input.contactEmail) }),
      ...(input.websiteUrl === undefined
        ? {}
        : { websiteUrl: this.optionalText(input.websiteUrl) }),
      ...(input.phone === undefined
        ? {}
        : { phone: this.optionalText(input.phone) }),
      ...(input.addressLine1 === undefined
        ? {}
        : { addressLine1: this.optionalText(input.addressLine1) }),
      ...(input.addressLine2 === undefined
        ? {}
        : { addressLine2: this.optionalText(input.addressLine2) }),
      ...(input.city === undefined
        ? {}
        : { city: this.optionalText(input.city) }),
      ...(input.region === undefined
        ? {}
        : { region: this.optionalText(input.region) }),
      ...(input.postalCode === undefined
        ? {}
        : { postalCode: this.optionalText(input.postalCode) }),
      ...(input.countryCode === undefined
        ? {}
        : {
            countryCode:
              this.optionalText(input.countryCode)?.toUpperCase() ?? null,
          }),
    };
  }

  private presentCompany(company: CompanyProfileRecord) {
    return {
      ...company,
      hasLogo: Boolean(company.logoFileAssetId),
    };
  }

  private presentRequest(request: IdentityRequestRecord) {
    return {
      id: request.id,
      companyId: request.companyId,
      requestedByUserId: request.requestedByUserId,
      requestedByEmail: request.requestedBy.email,
      proposedName: request.proposedName,
      proposedLogoFileAssetId: request.proposedLogoFileAssetId,
      hasProposedLogo: Boolean(request.proposedLogoFileAssetId),
      status: request.status,
      reviewNote: request.reviewNote,
      reviewedByUserId: request.reviewedByUserId,
      reviewedAt: request.reviewedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  private async normalizeLogo(
    file: UploadedFilePayload,
  ): Promise<UploadedFilePayload> {
    const detected = detectSupportedFile(file.buffer);

    if (!COMPANY_LOGO_MIME_TYPES.has(detected.mimeType)) {
      throw new BadRequestException(
        'Company logos must be JPEG, PNG, or WebP.',
      );
    }

    try {
      const metadata = await sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 25_000_000,
      }).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Missing image dimensions.');
      }

      let pipeline = sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 25_000_000,
      })
        .rotate()
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true,
        });

      let extension = 'jpg';
      if (detected.mimeType === 'image/png') {
        extension = 'png';
        pipeline = pipeline.png({ compressionLevel: 8 });
      } else if (detected.mimeType === 'image/webp') {
        extension = 'webp';
        pipeline = pipeline.webp({ quality: 90 });
      } else {
        pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
      }

      const buffer = await pipeline.toBuffer();

      return {
        originalname: `company-logo.${extension}`,
        mimetype: detected.mimeType,
        size: buffer.length,
        buffer,
      };
    } catch {
      throw new BadRequestException(
        'The company logo could not be decoded safely.',
      );
    }
  }

  private requireCompany(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('A company-scoped account is required.');
    }

    return principal.companyId;
  }

  private assertPlatform(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException('Platform administrator scope is required.');
    }
  }

  private async requireExistingCompany(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Company was not found.');
    }
  }

  private optionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}
