import type { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { FileAssetKind } from '../../generated/prisma/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { UploadFileDto } from './dto/upload-file.dto';
import { FilesService, type UploadedFilePayload } from './files.service';
import { FileStorageService } from './storage/file-storage.service';

@Controller('files')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly storage: FileStorageService,
  ) {}

  @Post('storage/s3/test')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  testS3Connection() {
    return this.storage.testS3Connection();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.FILES_UPLOAD)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 104_857_600 },
    }),
  )
  upload(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: UploadFileDto,
    @UploadedFile() file: UploadedFilePayload | undefined,
  ) {
    return this.files.upload(principal, input, file);
  }

  @Get(':fileId')
  @RequirePermissions(PERMISSIONS.FILES_READ)
  getMetadata(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.files.getMetadata(principal, fileId);
  }

  @Get(':fileId/content')
  @RequirePermissions(PERMISSIONS.FILES_READ)
  async getContent(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() response: Response,
  ): Promise<void> {
    const { asset, buffer } = await this.files.openContent(principal, fileId);
    const disposition =
      asset.kind === FileAssetKind.ATTACHMENT ? 'attachment' : 'inline';
    const safeAsciiName = asset.originalFilename
      .replace(/[^\x20-\x7e]/g, '_')
      .replace(/["\\;]/g, '_');
    const encodedName = encodeURIComponent(asset.originalFilename);

    response.status(200);
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader('Content-Length', String(buffer.length));
    response.setHeader('X-File-SHA256', asset.sha256);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`,
    );

    if (asset.mimeType === 'image/svg+xml') {
      response.setHeader(
        'Content-Security-Policy',
        "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:",
      );
    }

    response.end(buffer);
  }

  @Delete(':fileId')
  @RequirePermissions(PERMISSIONS.FILES_MANAGE)
  delete(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.files.delete(principal, fileId);
  }
}
