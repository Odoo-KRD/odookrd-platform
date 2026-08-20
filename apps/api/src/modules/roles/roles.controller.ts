import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  list(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.rolesService.list(principal);
  }
}
