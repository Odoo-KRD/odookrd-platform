import type { Request, Response } from 'express';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import {
  AttachTrainingSlidesDto,
  CompleteAutomatedTrainingVideoDto,
  InitAutomatedTrainingVideoDto,
  SetManualTrainingVideoDto,
  SetTrainingVideoThumbnailDto,
} from './dto/training-media.dto';
import { TrainingMediaService } from './training-media.service';

@Controller('training')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class TrainingMediaController {
  constructor(private readonly media: TrainingMediaService) {}

  @Get('courses/:courseId/sections/:sectionId/lessons/:lessonId/media')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  getAdminMedia(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.media.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/aws-automated/init',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  initAutomated(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: InitAutomatedTrainingVideoDto,
  ) {
    return this.media.initAutomatedVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/aws-automated/complete',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  completeAutomated(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: CompleteAutomatedTrainingVideoDto,
  ) {
    return this.media.completeAutomatedVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/aws-automated/retry',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  retryAutomated(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.media.retryAutomatedVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/aws-manual',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  setManual(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: SetManualTrainingVideoDto,
  ) {
    return this.media.setManualVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Put('courses/:courseId/sections/:sectionId/lessons/:lessonId/media/local')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  setLocal(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Req() request: Request,
    @Headers('x-odookrd-filename') filenameHeader?: string,
    @Headers('x-odookrd-size') sizeHeader?: string,
    @Headers('x-odookrd-duration') durationHeader?: string,
    @Headers('x-odookrd-width') widthHeader?: string,
    @Headers('x-odookrd-height') heightHeader?: string,
  ) {
    const sizeBytes = this.requiredPositiveInt(sizeHeader, 'Video size');
    let filename = 'video.mp4';
    if (filenameHeader) {
      try {
        filename = decodeURIComponent(filenameHeader);
      } catch {
        filename = 'video.mp4';
      }
    }
    return this.media.setLocalVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
      request,
      {
        filename,
        sizeBytes,
        durationSeconds: this.optionalPositiveInt(durationHeader),
        width: this.optionalPositiveInt(widthHeader),
        height: this.optionalPositiveInt(heightHeader),
      },
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/thumbnail',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  setThumbnail(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: SetTrainingVideoThumbnailDto,
  ) {
    return this.media.setVideoThumbnail(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Post('courses/:courseId/sections/:sectionId/lessons/:lessonId/media/slides')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  attachDocument(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: AttachTrainingSlidesDto,
  ) {
    return this.media.attachDocument(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Delete('courses/:courseId/sections/:sectionId/lessons/:lessonId/media/video')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  deleteVideo(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.media.deleteVideo(principal, courseId, sectionId, lessonId);
  }

  @Delete('courses/:courseId/sections/:sectionId/lessons/:lessonId/media')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  clearMedia(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.media.clearMedia(principal, courseId, sectionId, lessonId);
  }

  @Get('catalog/:slug/lessons/:lessonId')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  getCustomerLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.media.getCustomerLesson(principal, slug, lessonId);
  }

  @Get('catalog/:slug/lessons/:lessonId/video')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  async openLocalVideo(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Headers('range') range: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.media.openLocalVideo(
      principal,
      slug,
      lessonId,
      range,
    );
    response.status(result.statusCode);
    response.setHeader('Content-Type', 'video/mp4');
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Content-Length', String(result.contentLength));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Content-Disposition', 'inline; filename="lesson.mp4"');
    if (result.statusCode === 206) {
      response.setHeader(
        'Content-Range',
        `bytes ${result.start}-${result.end}/${result.sizeBytes}`,
      );
    }
    result.stream.pipe(response);
  }

  @Get('catalog/:slug/lessons/:lessonId/slides')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  async openDocument(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.media.openDocument(principal, slug, lessonId);
    response.status(200);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Length', String(result.sizeBytes));
    response.setHeader('X-File-SHA256', result.sha256);
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader(
      'Content-Disposition',
      'inline; filename="document.pdf"',
    );
    result.stream.pipe(response);
  }

  @Get('catalog/:slug/lessons/:lessonId/article-assets/:fileId')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  async openArticleAsset(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.media.openArticleAsset(
      principal,
      slug,
      lessonId,
      fileId,
    );

    const safeAsciiName = result.filename
      .replace(/[^\x20-\x7e]/g, '_')
      .replace(/["\\;]/g, '_');
    const encodedName = encodeURIComponent(result.filename);
    const disposition = result.inline ? 'inline' : 'attachment';

    response.status(200);
    response.setHeader('Content-Type', result.mimeType);
    response.setHeader('Content-Length', String(result.sizeBytes));
    response.setHeader('X-File-SHA256', result.sha256);
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`,
    );

    if (result.mimeType === 'image/svg+xml') {
      response.setHeader(
        'Content-Security-Policy',
        "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:",
      );
    }

    result.stream.pipe(response);
  }

  @Get('catalog/:slug/lessons/:lessonId/resources/:resourceId')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  async openResource(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.media.openCustomerResource(
      principal,
      slug,
      lessonId,
      resourceId,
    );
    const safeAsciiName = result.filename
      .replace(/[^\x20-\x7e]/g, '_')
      .replace(/["\\;]/g, '_');
    const encodedName = encodeURIComponent(result.filename);
    response.status(200);
    response.setHeader('Content-Type', result.mimeType);
    response.setHeader('Content-Length', String(result.sizeBytes));
    response.setHeader('X-File-SHA256', result.sha256);
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`,
    );
    result.stream.pipe(response);
  }

  @Get('catalog/:slug/lessons/:lessonId/hls')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  async openHls(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Res() response: Response,
  ): Promise<void> {
    const manifest = await this.media.openHlsManifest(
      principal,
      slug,
      lessonId,
    );
    response.status(200);
    response.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(manifest);
  }

  @Get('catalog/:slug/lessons/:lessonId/hls-resource')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  async openHlsResource(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query('token') token: string,
    @Res() response: Response,
  ): Promise<void> {
    const resource = await this.media.openHlsResource(
      principal,
      slug,
      lessonId,
      token,
    );
    response.status(200);
    response.setHeader('Content-Type', resource.contentType);
    response.setHeader('Content-Length', String(resource.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.end(resource.buffer);
  }

  private requiredPositiveInt(
    value: string | undefined,
    label: string,
  ): number {
    const parsed = value ? Number(value) : Number.NaN;
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`${label} is invalid.`);
    }
    return parsed;
  }

  private optionalPositiveInt(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
  }
}
