import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import {
  CreateTrainingCertificateTemplateDto,
  IssueTrainingCertificateDto,
  ListTrainingCertificatesQueryDto,
  ListTrainingCertificateTemplatesQueryDto,
  PreviewTrainingCertificateTemplateDto,
  RevokeTrainingCertificateDto,
  UpdateTrainingCertificateTemplateDto,
} from './dto/training-certificate.dto';
import { TrainingCertificateService } from './training-certificate.service';

@Controller('training/certificate-templates')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
export class TrainingCertificateTemplateController {
  constructor(private readonly certificates: TrainingCertificateService) {}

  @Get()
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListTrainingCertificateTemplatesQueryDto,
  ) {
    return this.certificates.listTemplates(principal, query);
  }

  @Get('presets')
  listPresets(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.certificates.listPresets(principal);
  }

  @Get('presets/:presetKey/artwork')
  presetArtwork(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('presetKey') presetKey: string,
    @Res() response: Response,
  ) {
    const result = this.certificates.openPresetArtwork(principal, presetKey);

    response.status(200);
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${result.filename.replaceAll('"', '')}"`,
    );
    response.setHeader('Content-Length', String(result.buffer.length));
    response.setHeader('Cache-Control', 'private, max-age=300');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.end(result.buffer);
  }

  @Post('preview')
  async preview(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: PreviewTrainingCertificateTemplateDto,
    @Res() response: Response,
  ) {
    const result = await this.certificates.previewTemplate(principal, input);

    response.status(200);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${result.filename.replaceAll('"', '')}"`,
    );
    response.setHeader('Content-Length', String(result.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(result.buffer);
  }

  @Post()
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateTrainingCertificateTemplateDto,
  ) {
    return this.certificates.createTemplate(principal, input);
  }

  @Get(':templateId')
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ) {
    return this.certificates.getTemplate(principal, templateId);
  }

  @Patch(':templateId')
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() input: UpdateTrainingCertificateTemplateDto,
  ) {
    return this.certificates.updateTemplate(principal, templateId, input);
  }

  @Post(':templateId/duplicate')
  duplicate(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ) {
    return this.certificates.duplicateTemplate(principal, templateId);
  }
}

@Controller('training/certificates')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_READ)
export class TrainingCertificateController {
  constructor(private readonly certificates: TrainingCertificateService) {}

  @Get()
  listMine(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListTrainingCertificatesQueryDto,
  ) {
    return this.certificates.listMine(principal, query);
  }

  @Get('courses/:slug')
  courseStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
  ) {
    return this.certificates.courseStatus(principal, slug);
  }

  @Post('courses/:slug/issue')
  issue(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Body() input: IssueTrainingCertificateDto,
  ) {
    return this.certificates.issue(principal, slug, input);
  }

  @Get(':certificateId/pdf')
  async pdf(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('certificateId', ParseUUIDPipe) certificateId: string,
    @Res() response: Response,
  ) {
    const result = await this.certificates.openMine(principal, certificateId);

    response.status(200);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${result.filename.replaceAll('"', '')}"`,
    );
    response.setHeader('Content-Length', String(result.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(result.buffer);
  }
}

@Controller('training/certificates/admin')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
export class TrainingCertificateAdminController {
  constructor(private readonly certificates: TrainingCertificateService) {}

  @Get()
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListTrainingCertificatesQueryDto,
  ) {
    return this.certificates.listAdmin(principal, query);
  }

  @Post(':certificateId/revoke')
  revoke(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('certificateId', ParseUUIDPipe) certificateId: string,
    @Body() input: RevokeTrainingCertificateDto,
  ) {
    return this.certificates.revoke(principal, certificateId, input);
  }
}
