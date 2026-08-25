import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { InviteUserDto } from './dto/invite-user.dto';
import { BatchUserStatusDto } from './dto/batch-user-status.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListUsersQueryDto,
  ) {
    return this.usersService.list(principal, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  getById(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.getById(principal, userId);
  }

  @Post('invitations')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  invite(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: InviteUserDto,
  ) {
    return this.usersService.invite(principal, dto);
  }

  @Post('batch-status')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  batchStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: BatchUserStatusDto,
  ) {
    return this.usersService.updateStatuses(principal, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  updateStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(principal, userId, dto);
  }

  @Put(':id/roles')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  replaceRoles(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: ReplaceUserRolesDto,
  ) {
    return this.usersService.replaceRoles(principal, userId, dto);
  }
}
