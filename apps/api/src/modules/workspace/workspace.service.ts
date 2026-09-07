import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  CompanyServiceStatus,
  FileAssetKind,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { detectSupportedFile } from '../files/file-signature.validator';
import { FilesService, type UploadedFilePayload } from '../files/files.service';
import type { UpdateWorkspaceProfileDto } from './dto/update-workspace-profile.dto';

export const CUSTOMER_ACTIVITY_ACTIONS = [
  'company.created',
  'company.updated',
  'company.status.updated',
  'service.assignment.created',
  'service.assignment.updated',
  'user.invited',
  'user.created',
  'user.status.updated',
  'user.roles.updated',
] as const;

const companySelect = {
  id: true,
  name: true,
  nameTranslations: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

const recentServiceSelect = {
  id: true,
  companyId: true,
  displayName: true,
  displayNameTranslations: true,
  status: true,
  expiresAt: true,
  serviceUrl: true,
  service: {
    select: {
      id: true,
      name: true,
      nameTranslations: true,
      category: true,
    },
  },
} satisfies Prisma.CompanyServiceSelect;

const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly audit: AuditService,
  ) {}

  async overview(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal);
    const now = new Date();
    const upcomingExpiration = new Date(now.getTime() + 30 * 86_400_000);

    const [
      company,
      groupedServices,
      expiringSoon,
      recentServices,
      activity,
      teamMembers,
    ] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: companySelect,
      }),
      this.prisma.companyService.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.companyService.count({
        where: {
          companyId,
          status: CompanyServiceStatus.ACTIVE,
          expiresAt: { gte: now, lte: upcomingExpiration },
        },
      }),
      this.prisma.companyService.findMany({
        where: { companyId },
        select: recentServiceSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: 5,
      }),
      this.prisma.auditLog.findMany({
        where: {
          companyId,
          action: { in: [...CUSTOMER_ACTIVITY_ACTIONS] },
        },
        select: {
          id: true,
          action: true,
          targetType: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 8,
      }),
      this.prisma.user.count({
        where: { companyId, status: UserStatus.ACTIVE },
      }),
    ]);

    if (!company) {
      throw new NotFoundException('Company workspace was not found.');
    }

    const counts: Record<CompanyServiceStatus, number> = {
      PROVISIONING: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
      EXPIRED: 0,
      CANCELLED: 0,
    };

    for (const entry of groupedServices) {
      counts[entry.status] = entry._count._all;
    }

    return {
      company,
      summary: {
        total: Object.values(counts).reduce((total, count) => total + count, 0),
        active: counts.ACTIVE,
        provisioning: counts.PROVISIONING,
        suspended: counts.SUSPENDED,
        expired: counts.EXPIRED,
        cancelled: counts.CANCELLED,
        expiringSoon,
      },
      teamMembers,
      recentServices,
      recentActivity: activity,
    };
  }

  async profile(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal);

    const [user, session] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: principal.userId, companyId },
        select: {
          id: true,
          email: true,
          companyId: true,
          displayName: true,
          whatsappNumber: true,
          certificateName: true,
          avatarFileAssetId: true,
          status: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          company: { select: companySelect },
          userRoles: { select: { role: { select: { key: true } } } },
        },
      }),
      this.prisma.session.findFirst({
        where: {
          id: principal.sessionId,
          userId: principal.userId,
          revokedAt: null,
        },
        select: { lastSeenAt: true },
      }),
    ]);

    if (!user || !user.company) {
      throw new NotFoundException('Account profile was not found.');
    }

    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      displayName: user.displayName,
      whatsappNumber: user.whatsappNumber,
      certificateName: user.certificateName,
      avatarFileAssetId: user.avatarFileAssetId,
      hasAvatar: Boolean(user.avatarFileAssetId),
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      company: user.company,
      roles: user.userRoles.map(({ role }) => role.key).sort(),
      lastSeenAt: session?.lastSeenAt ?? null,
    };
  }

  async updateProfile(
    principal: AuthenticatedPrincipal,
    body: UpdateWorkspaceProfileDto,
  ) {
    const companyId = this.requireCompany(principal);
    const data: Prisma.UserUpdateManyMutationInput = {};
    const changedFields: string[] = [];

    if (body.displayName !== undefined) {
      data.displayName = this.normalizeOptionalText(body.displayName);
      changedFields.push('displayName');
    }

    if (body.whatsappNumber !== undefined) {
      data.whatsappNumber = this.normalizeOptionalText(body.whatsappNumber);
      changedFields.push('whatsappNumber');
    }

    if (body.certificateName !== undefined) {
      data.certificateName = this.normalizeOptionalText(body.certificateName);
      changedFields.push('certificateName');
    }

    if (changedFields.length === 0) {
      return this.profile(principal);
    }

    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.user.updateMany({
        where: {
          id: principal.userId,
          companyId,
          accountScope: AccountScope.COMPANY,
        },
        data,
      });

      if (result.count !== 1) {
        throw new NotFoundException('Account profile was not found.');
      }

      await this.audit.write(
        {
          actorUserId: principal.userId,
          companyId,
          action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
          targetType: 'user',
          targetId: principal.userId,
          metadata: { fields: changedFields },
        },
        transaction,
      );
    });

    return this.profile(principal);
  }

  async updateAvatar(
    principal: AuthenticatedPrincipal,
    file: UploadedFilePayload | undefined,
  ) {
    const companyId = this.requireCompany(principal);
    if (!file?.buffer?.length) {
      throw new BadRequestException('An avatar image is required.');
    }

    const current = await this.prisma.user.findFirst({
      where: {
        id: principal.userId,
        companyId,
        accountScope: AccountScope.COMPANY,
      },
      select: { avatarFileAssetId: true },
    });
    if (!current) {
      throw new NotFoundException('Account profile was not found.');
    }

    const normalizedFile = await this.normalizeAvatar(file);
    const uploaded = await this.files.upload(
      principal,
      { kind: FileAssetKind.IMAGE, companyId },
      normalizedFile,
    );

    try {
      await this.prisma.$transaction(async (transaction) => {
        const result = await transaction.user.updateMany({
          where: {
            id: principal.userId,
            companyId,
            accountScope: AccountScope.COMPANY,
          },
          data: { avatarFileAssetId: uploaded.id },
        });

        if (result.count !== 1) {
          throw new NotFoundException('Account profile was not found.');
        }

        await this.audit.write(
          {
            actorUserId: principal.userId,
            companyId,
            action: AUDIT_ACTIONS.USER_AVATAR_UPDATED,
            targetType: 'user',
            targetId: principal.userId,
            metadata: {
              previousAvatarFileAssetId: current.avatarFileAssetId,
              avatarFileAssetId: uploaded.id,
            },
          },
          transaction,
        );
      });
    } catch (error) {
      await this.files.delete(principal, uploaded.id).catch((cleanupError) => {
        this.logger.error(
          `Failed to clean up new avatar file ${uploaded.id}.`,
          cleanupError instanceof Error ? cleanupError.stack : undefined,
        );
      });
      throw error;
    }

    if (
      current.avatarFileAssetId &&
      current.avatarFileAssetId !== uploaded.id
    ) {
      await this.files
        .delete(principal, current.avatarFileAssetId)
        .catch((error) => {
          this.logger.warn(
            `Previous avatar ${current.avatarFileAssetId} could not be cleaned up: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
          );
        });
    }

    return this.profile(principal);
  }

  async deleteAvatar(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal);
    const current = await this.prisma.user.findFirst({
      where: {
        id: principal.userId,
        companyId,
        accountScope: AccountScope.COMPANY,
      },
      select: { avatarFileAssetId: true },
    });

    if (!current) {
      throw new NotFoundException('Account profile was not found.');
    }

    if (!current.avatarFileAssetId) {
      return this.profile(principal);
    }

    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.user.updateMany({
        where: {
          id: principal.userId,
          companyId,
          accountScope: AccountScope.COMPANY,
        },
        data: { avatarFileAssetId: null },
      });

      if (result.count !== 1) {
        throw new NotFoundException('Account profile was not found.');
      }

      await this.audit.write(
        {
          actorUserId: principal.userId,
          companyId,
          action: AUDIT_ACTIONS.USER_AVATAR_UPDATED,
          targetType: 'user',
          targetId: principal.userId,
          metadata: {
            previousAvatarFileAssetId: current.avatarFileAssetId,
            avatarFileAssetId: null,
          },
        },
        transaction,
      );
    });

    await this.files
      .delete(principal, current.avatarFileAssetId)
      .catch((error) => {
        this.logger.warn(
          `Deleted avatar ${current.avatarFileAssetId} could not be cleaned up: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return this.profile(principal);
  }

  async getAvatar(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal);
    const user = await this.prisma.user.findFirst({
      where: {
        id: principal.userId,
        companyId,
        accountScope: AccountScope.COMPANY,
      },
      select: { avatarFileAssetId: true },
    });

    if (!user?.avatarFileAssetId) {
      throw new NotFoundException('Profile avatar was not found.');
    }

    const content = await this.files.openContent(
      principal,
      user.avatarFileAssetId,
    );

    if (
      content.asset.kind !== FileAssetKind.IMAGE ||
      !AVATAR_MIME_TYPES.has(content.asset.mimeType)
    ) {
      throw new NotFoundException('Profile avatar was not found.');
    }

    return content;
  }

  private async normalizeAvatar(
    file: UploadedFilePayload,
  ): Promise<UploadedFilePayload> {
    const detected = detectSupportedFile(file.buffer);
    if (!AVATAR_MIME_TYPES.has(detected.mimeType)) {
      throw new BadRequestException(
        'Avatar images must be JPEG, PNG, or WebP.',
      );
    }

    try {
      let pipeline = sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 25_000_000,
      })
        .rotate()
        .resize(512, 512, {
          fit: 'cover',
          position: 'centre',
        });

      let extension = 'jpg';
      if (detected.mimeType === 'image/jpeg') {
        pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
      } else if (detected.mimeType === 'image/png') {
        extension = 'png';
        pipeline = pipeline.png({ compressionLevel: 9 });
      } else {
        extension = 'webp';
        pipeline = pipeline.webp({ quality: 88, effort: 4 });
      }

      const buffer = await pipeline.toBuffer();
      return {
        originalname: `avatar.${extension}`,
        mimetype: detected.mimeType,
        size: buffer.length,
        buffer,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'The avatar image could not be processed safely.',
      );
    }
  }

  private normalizeOptionalText(value: string | null): string | null {
    if (value === null) return null;
    const normalized = value.normalize('NFKC').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private requireCompany(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('A company account is required.');
    }

    return principal.companyId;
  }
}
