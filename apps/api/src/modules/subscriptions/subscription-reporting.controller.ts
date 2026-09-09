import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { SubscriptionReportQueryDto } from './dto/subscription-report.dto';
import { SubscriptionReportingService } from './subscription-reporting.service';

@Controller('subscription-reports')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class SubscriptionReportingController {
  constructor(private readonly reports: SubscriptionReportingService) {}

  @Get('pipeline')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  pipeline(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: SubscriptionReportQueryDto,
  ) {
    return this.reports.pipeline(principal, query);
  }

  @Get('pipeline/export')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  async exportPipeline(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: SubscriptionReportQueryDto,
    @Res() response: Response,
  ) {
    const result = await this.reports.pipelineCsv(principal, query);
    this.sendCsv(response, result);
  }

  @Get('renewal-history/export')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  async exportRenewalHistory(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: SubscriptionReportQueryDto,
    @Res() response: Response,
  ) {
    const result = await this.reports.renewalHistoryCsv(principal, query);
    this.sendCsv(response, result);
  }

  private sendCsv(
    response: Response,
    result: { filename: string; buffer: Buffer },
  ): void {
    response.status(200);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename.replaceAll('"', '')}"`,
    );
    response.setHeader('Content-Length', String(result.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(result.buffer);
  }
}
