import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  overview(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.workspace.overview(principal);
  }

  @Get('profile')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  profile(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.workspace.profile(principal);
  }
}
