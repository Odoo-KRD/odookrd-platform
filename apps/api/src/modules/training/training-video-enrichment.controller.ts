import type { Request, Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
  CreateTrainingVideoChapterDto,
  UpdateTrainingCaptionDto,
  UpdateTrainingVideoChapterDto,
} from './dto/training-video-enrichment.dto';
import { TrainingVideoEnrichmentService } from './training-video-enrichment.service';

@Controller('training')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class TrainingVideoEnrichmentController {
  constructor(private readonly enrichment: TrainingVideoEnrichmentService) {}

  @Get(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  getAdmin(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.enrichment.getAdminEnrichment(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/captions',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  uploadCaption(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Req() request: Request,
    @Headers('x-odookrd-size') sizeHeader?: string,
    @Headers('x-odookrd-filename') filenameHeader?: string,
    @Headers('x-odookrd-caption-language') languageHeader?: string,
    @Headers('x-odookrd-caption-label') labelHeader?: string,
    @Headers('x-odookrd-caption-default') defaultHeader?: string,
  ) {
    return this.enrichment.uploadCaption(
      principal,
      courseId,
      sectionId,
      lessonId,
      {
        source: request,
        declaredSize: Number(sizeHeader),
        filename: this.decodeHeader(filenameHeader, 'captions.vtt'),
        languageCode: this.decodeHeader(languageHeader, ''),
        label: this.decodeHeader(labelHeader, ''),
        isDefault: defaultHeader === 'true',
      },
    );
  }

  @Patch(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/captions/:captionId',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  updateCaption(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('captionId', ParseUUIDPipe) captionId: string,
    @Body() input: UpdateTrainingCaptionDto,
  ) {
    return this.enrichment.updateCaption(
      principal,
      courseId,
      sectionId,
      lessonId,
      captionId,
      input,
    );
  }

  @Delete(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/captions/:captionId',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  deleteCaption(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('captionId', ParseUUIDPipe) captionId: string,
  ) {
    return this.enrichment.deleteCaption(
      principal,
      courseId,
      sectionId,
      lessonId,
      captionId,
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/chapters',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  createChapter(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: CreateTrainingVideoChapterDto,
  ) {
    return this.enrichment.createChapter(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Patch(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/chapters/:chapterId',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  updateChapter(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Body() input: UpdateTrainingVideoChapterDto,
  ) {
    return this.enrichment.updateChapter(
      principal,
      courseId,
      sectionId,
      lessonId,
      chapterId,
      input,
    );
  }

  @Delete(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/chapters/:chapterId',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  deleteChapter(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
  ) {
    return this.enrichment.deleteChapter(
      principal,
      courseId,
      sectionId,
      lessonId,
      chapterId,
    );
  }

  @Get(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/preview',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  async preview(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Headers('range') range: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.enrichment.openAdminPreview(
      principal,
      courseId,
      sectionId,
      lessonId,
      range,
    );

    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    if (result.kind === 'HLS') {
      response.status(200);
      response.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      response.end(result.manifest);
      return;
    }

    response.status(result.range.statusCode);
    response.setHeader('Content-Type', 'video/mp4');
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Content-Length', String(result.range.contentLength));
    if (result.range.statusCode === 206) {
      response.setHeader(
        'Content-Range',
        `bytes ${result.range.start}-${result.range.end}/${result.range.sizeBytes}`,
      );
    }
    result.range.stream.pipe(response);
  }

  @Get(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/media/enrichment/preview-resource',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  async previewResource(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query('token') token: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.enrichment.openAdminPreviewResource(
      principal,
      courseId,
      sectionId,
      lessonId,
      token,
    );
    response.status(200);
    response.setHeader('Content-Type', result.contentType);
    response.setHeader('Content-Length', String(result.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.end(result.buffer);
  }

  @Get('catalog/:slug/lessons/:lessonId/enrichment')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  getCustomer(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.enrichment.getCustomerEnrichment(principal, slug, lessonId);
  }

  @Get('catalog/:slug/lessons/:lessonId/captions/:captionId')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  async customerCaption(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('captionId', ParseUUIDPipe) captionId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.enrichment.openCustomerCaption(
      principal,
      slug,
      lessonId,
      captionId,
    );
    response.status(200);
    response.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    response.setHeader('Content-Length', String(result.buffer.length));
    response.setHeader('X-File-SHA256', result.sha256);
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.end(result.buffer);
  }

  private decodeHeader(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    try {
      return decodeURIComponent(value);
    } catch {
      return fallback;
    }
  }
}
