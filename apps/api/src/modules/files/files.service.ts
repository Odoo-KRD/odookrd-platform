import { createHash } from 'node:crypto';
import path from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  FileAssetKind,
  FileAssetStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { UploadFileDto } from './dto/upload-file.dto';
import { detectSupportedFile } from './file-signature.validator';
import { FileStorageService } from './storage/file-storage.service';

export interface UploadedFilePayload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const fileAssetSelect = {
  id: true,
  accountScope: true,
  companyId: true,
  kind: true,
  storageProvider: true,
  storageKey: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  sha256: true,
  status: true,
  uploadedByUserId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.FileAssetSelect;

type FileAssetRecord = Prisma.FileAssetGetPayload<{
  select: typeof fileAssetSelect;
}>;

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorageService,
    private readonly audit: AuditService,
    private readonly settings: SettingsService,
    private readonly configService: ConfigService,
  ) {}

  async upload(
    principal: AuthenticatedPrincipal,
    input: UploadFileDto,
    file: UploadedFilePayload | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('A file is required.');
    }

    const detected = detectSupportedFile(file.buffer);
    this.assertKindMatches(input.kind, detected.family);
    await this.assertMimeTypeEnabled(detected.mimeType);
    await this.assertSizeAllowed(input.kind, file.size);

    const scope = await this.resolveUploadScope(principal, input.companyId);
    const originalFilename = this.sanitizeFilename(file.originalname);
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const storageProvider = await this.storage.getConfiguredProvider();
    const storageKey = this.storage.createStorageKey(
      scope.accountScope,
      scope.companyId,
    );

    await this.storage.put(storageProvider, {
      storageKey,
      buffer: file.buffer,
      mimeType: detected.mimeType,
      sha256,
    });

    try {
      const asset = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.fileAsset.create({
          data: {
            accountScope: scope.accountScope,
            companyId: scope.companyId,
            kind: input.kind,
            storageProvider,
            storageKey,
            originalFilename,
            mimeType: detected.mimeType,
            sizeBytes: file.size,
            sha256,
            uploadedByUserId: principal.userId,
          },
          select: fileAssetSelect,
        });

        await this.audit.write(
          {
            actorUserId: principal.userId,
            companyId: scope.companyId,
            action: AUDIT_ACTIONS.FILE_UPLOADED,
            targetType: 'file_asset',
            targetId: created.id,
            metadata: {
              kind: created.kind,
              storageProvider: created.storageProvider,
              mimeType: created.mimeType,
              sizeBytes: created.sizeBytes,
              sha256: created.sha256,
            },
          },
          transaction,
        );

        return created;
      });

      return this.present(asset);
    } catch (error) {
      await this.storage
        .delete(storageProvider, storageKey)
        .catch((cleanupError: unknown) => {
          this.logger.error(
            `Failed to clean up stored object ${storageKey} after database failure.`,
            cleanupError instanceof Error ? cleanupError.stack : undefined,
          );
        });
      throw error;
    }
  }

  async getMetadata(principal: AuthenticatedPrincipal, fileId: string) {
    const asset = await this.getAuthorizedAsset(principal, fileId);
    return this.present(asset);
  }

  async openContent(principal: AuthenticatedPrincipal, fileId: string) {
    const asset = await this.getAuthorizedAsset(principal, fileId);
    const stream = await this.storage.open(
      asset.storageProvider,
      asset.storageKey,
    );
    const chunks: Buffer[] = [];

    try {
      for await (const chunk of stream as AsyncIterable<unknown>) {
        if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
          chunks.push(Buffer.from(chunk));
          continue;
        }

        throw new Error('Stored file stream returned an unsupported chunk.');
      }
    } catch (error) {
      this.logger.error(
        `Failed to read stored file ${asset.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Stored file could not be read.');
    }

    const buffer = Buffer.concat(chunks);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    if (buffer.length !== asset.sizeBytes || sha256 !== asset.sha256) {
      this.logger.error(
        `Integrity check failed for file ${asset.id}: expected ${asset.sizeBytes}/${asset.sha256}, got ${buffer.length}/${sha256}.`,
      );
      throw new InternalServerErrorException(
        'Stored file integrity check failed.',
      );
    }

    return { asset: this.present(asset), buffer };
  }

  async delete(principal: AuthenticatedPrincipal, fileId: string) {
    const asset = await this.getAuthorizedAsset(principal, fileId);
    const deletedAt = new Date();

    const updated = await this.prisma.$transaction(async (transaction) => {
      const deleted = await transaction.fileAsset.update({
        where: { id: asset.id },
        data: { status: FileAssetStatus.DELETED, deletedAt },
        select: fileAssetSelect,
      });

      await this.audit.write(
        {
          actorUserId: principal.userId,
          companyId: asset.companyId,
          action: AUDIT_ACTIONS.FILE_DELETED,
          targetType: 'file_asset',
          targetId: asset.id,
          metadata: {
            kind: asset.kind,
            storageProvider: asset.storageProvider,
          },
        },
        transaction,
      );

      return deleted;
    });

    await this.storage
      .delete(asset.storageProvider, asset.storageKey)
      .catch((error: unknown) => {
        this.logger.error(
          `File ${asset.id} was soft-deleted but storage cleanup failed.`,
          error instanceof Error ? error.stack : undefined,
        );
      });

    return this.present(updated);
  }

  private async getAuthorizedAsset(
    principal: AuthenticatedPrincipal,
    fileId: string,
  ): Promise<FileAssetRecord> {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
      select: fileAssetSelect,
    });

    if (!asset || asset.status !== FileAssetStatus.READY) {
      throw new NotFoundException('File was not found.');
    }

    if (principal.accountScope === AccountScope.PLATFORM) {
      return asset;
    }

    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId ||
      asset.accountScope !== AccountScope.COMPANY ||
      asset.companyId !== principal.companyId
    ) {
      throw new NotFoundException('File was not found.');
    }

    return asset;
  }

  private async resolveUploadScope(
    principal: AuthenticatedPrincipal,
    requestedCompanyId?: string,
  ): Promise<{ accountScope: AccountScope; companyId: string | null }> {
    if (principal.accountScope === AccountScope.PLATFORM) {
      if (!requestedCompanyId) {
        return { accountScope: AccountScope.PLATFORM, companyId: null };
      }

      const company = await this.prisma.company.findUnique({
        where: { id: requestedCompanyId },
        select: { id: true },
      });
      if (!company) {
        throw new BadRequestException('The target company does not exist.');
      }

      return {
        accountScope: AccountScope.COMPANY,
        companyId: requestedCompanyId,
      };
    }

    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('A company-scoped account is required.');
    }

    if (requestedCompanyId && requestedCompanyId !== principal.companyId) {
      throw new ForbiddenException('Cross-company file upload is not allowed.');
    }

    return {
      accountScope: AccountScope.COMPANY,
      companyId: principal.companyId,
    };
  }

  private assertKindMatches(
    kind: FileAssetKind,
    detectedFamily: 'IMAGE' | 'DOCUMENT' | 'ATTACHMENT',
  ): void {
    if (kind === FileAssetKind.IMAGE && detectedFamily !== 'IMAGE') {
      throw new BadRequestException(
        'IMAGE assets must contain a supported image.',
      );
    }

    if (kind === FileAssetKind.DOCUMENT && detectedFamily !== 'DOCUMENT') {
      throw new BadRequestException('DOCUMENT assets must contain a PDF file.');
    }
  }

  private async assertSizeAllowed(
    kind: FileAssetKind,
    size: number,
  ): Promise<void> {
    const settingKey =
      kind === FileAssetKind.IMAGE
        ? 'files.upload.max_image_mb'
        : kind === FileAssetKind.DOCUMENT
          ? 'files.upload.max_document_mb'
          : 'files.upload.max_attachment_mb';
    const configKey =
      kind === FileAssetKind.IMAGE
        ? 'FILES_MAX_IMAGE_BYTES'
        : kind === FileAssetKind.DOCUMENT
          ? 'FILES_MAX_DOCUMENT_BYTES'
          : 'FILES_MAX_ATTACHMENT_BYTES';
    const defaultBytes = kind === FileAssetKind.IMAGE ? 10_485_760 : 52_428_800;
    const configured = await this.settings.resolveConfiguredValue(settingKey);
    const limit =
      typeof configured === 'number'
        ? configured * 1_048_576
        : this.configService.get<number>(configKey, defaultBytes);

    if (size <= 0 || size > limit) {
      throw new BadRequestException(
        `File size exceeds the configured ${kind.toLowerCase()} limit.`,
      );
    }
  }

  private async assertMimeTypeEnabled(mimeType: string): Promise<void> {
    const keyByMime: Record<string, string> = {
      'image/jpeg': 'files.types.jpeg_enabled',
      'image/png': 'files.types.png_enabled',
      'image/webp': 'files.types.webp_enabled',
      'image/gif': 'files.types.gif_enabled',
      'image/svg+xml': 'files.types.svg_enabled',
      'application/pdf': 'files.types.pdf_enabled',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'files.types.docx_enabled',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'files.types.pptx_enabled',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'files.types.xlsx_enabled',
      'application/zip': 'files.types.zip_enabled',
    };
    const key = keyByMime[mimeType];
    if (!key) {
      throw new BadRequestException('The uploaded file type is not supported.');
    }

    const configured = await this.settings.resolveConfiguredValue(key);
    if (configured === false) {
      throw new BadRequestException(
        `The uploaded ${mimeType} file type is disabled by platform policy.`,
      );
    }
  }

  private sanitizeFilename(filename: string): string {
    const basename = path.basename(filename || 'file').normalize('NFKC');
    const normalized = Array.from(basename)
      .filter((character) => {
        const codePoint = character.codePointAt(0);
        return codePoint !== undefined && codePoint >= 32 && codePoint !== 127;
      })
      .join('')
      .trim();

    if (!normalized) {
      return 'file';
    }

    return normalized.slice(0, 255);
  }

  private present(asset: FileAssetRecord) {
    return {
      id: asset.id,
      accountScope: asset.accountScope,
      companyId: asset.companyId,
      kind: asset.kind,
      storageProvider: asset.storageProvider,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      sha256: asset.sha256,
      status: asset.status,
      uploadedByUserId: asset.uploadedByUserId,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      deletedAt: asset.deletedAt?.toISOString() ?? null,
      contentPath: `/files/${asset.id}/content`,
    };
  }
}
