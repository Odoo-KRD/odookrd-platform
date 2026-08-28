import type { Response } from 'express';
import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { ListTrainingCatalogQueryDto } from './dto/training-catalog.dto';
import { TrainingCatalogService } from './training-catalog.service';

@Controller('training/catalog')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_READ)
export class TrainingCatalogController {
  constructor(private readonly catalog: TrainingCatalogService) {}

  @Get('status')
  status(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.catalog.status(principal);
  }

  @Get()
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListTrainingCatalogQueryDto,
  ) {
    return this.catalog.list(principal, query);
  }

  @Get(':slug/cover')
  async cover(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Res() response: Response,
  ): Promise<void> {
    const cover = await this.catalog.openCover(principal, slug);
    const safeName = cover.originalFilename
      .replace(/[^\x20-\x7e]/g, '_')
      .replace(/["\\;]/g, '_');
    const encodedName = encodeURIComponent(cover.originalFilename);

    response.status(200);
    response.setHeader('Content-Type', cover.mimeType);
    response.setHeader('Content-Length', String(cover.buffer.length));
    response.setHeader('X-File-SHA256', cover.sha256);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
    );

    if (cover.mimeType === 'image/svg+xml') {
      response.setHeader(
        'Content-Security-Policy',
        "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:",
      );
    }

    response.end(cover.buffer);
  }

  @Get(':slug')
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
  ) {
    return this.catalog.get(principal, slug);
  }
}
