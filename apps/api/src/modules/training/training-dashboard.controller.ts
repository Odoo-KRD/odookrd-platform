import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { TrainingDashboardService } from './training-dashboard.service';

@Controller('training')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_READ)
export class TrainingDashboardController {
  constructor(private readonly dashboard: TrainingDashboardService) {}

  @Get('dashboard-summary')
  summary(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.dashboard.summary(principal);
  }
}
