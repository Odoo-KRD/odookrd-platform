import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
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

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  permissions(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.rolesService.listPermissions(principal);
  }

  @Get(':roleId')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
  ) {
    return this.rolesService.get(principal, roleId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(principal, dto);
  }

  @Patch(':roleId')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(principal, roleId, dto);
  }

  @Patch(':roleId/archive')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  archive(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
  ) {
    return this.rolesService.archive(principal, roleId);
  }

  @Patch(':roleId/restore')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  restore(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
  ) {
    return this.rolesService.restore(principal, roleId);
  }

  @Delete(':roleId')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  remove(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
  ) {
    return this.rolesService.remove(principal, roleId);
  }
}
