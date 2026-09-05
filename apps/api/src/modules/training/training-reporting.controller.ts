import {
  Controller,
  Get,
  Headers,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { resolveApiLocale } from '../../i18n';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import {
  TrainingReportingExportQueryDto,
  TrainingReportingFiltersDto,
  TrainingReportingListQueryDto,
} from './dto/training-reporting.dto';
import { TrainingReportingService } from './training-reporting.service';

@Controller('training/reports')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_REPORTS_READ)
export class TrainingReportingController {
  constructor(private readonly reports: TrainingReportingService) {}

  @Get('options')
  options(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: TrainingReportingFiltersDto,
  ) {
    return this.reports.options(principal, query);
  }

  @Get('overview')
  overview(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: TrainingReportingFiltersDto,
  ) {
    return this.reports.overview(principal, query);
  }

  @Get('courses')
  courses(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: TrainingReportingListQueryDto,
  ) {
    return this.reports.courses(principal, query);
  }

  @Get('learners')
  learners(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: TrainingReportingListQueryDto,
  ) {
    return this.reports.learners(principal, query);
  }

  @Get('quizzes')
  quizzes(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: TrainingReportingListQueryDto,
  ) {
    return this.reports.quizzes(principal, query);
  }

  @Get('certificates')
  certificates(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: TrainingReportingListQueryDto,
  ) {
    return this.reports.certificates(principal, query);
  }

  @Get('export')
  async exportCsv(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: TrainingReportingExportQueryDto,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Res() response: Response,
  ) {
    const result = await this.reports.exportCsv(
      principal,
      query,
      resolveApiLocale(acceptLanguage),
    );

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
