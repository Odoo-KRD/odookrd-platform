import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import {
  DeliverExistingInvitationDto,
  InvitationLocaleDto,
  ReplaceAdministrationRolesDto,
} from './dto/invitation-administration.dto';
import { UserAdministrationService } from './user-administration.service';

@Controller('users')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.USERS_MANAGE)
export class UserAdministrationController {
  constructor(private readonly administration: UserAdministrationService) {}

  @Get(':id/administration')
  details(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
  ) {
    return this.administration.details(principal, userId);
  }

  @Put(':id/administration/roles')
  replaceRoles(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() input: ReplaceAdministrationRolesDto,
  ) {
    return this.administration.replaceRoles(principal, userId, input.roleKeys);
  }

  @Post(':id/invitations/deliver')
  deliver(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() input: DeliverExistingInvitationDto,
  ) {
    return this.administration.deliverExisting(
      principal,
      userId,
      input.token,
      input.locale,
      input.whatsappNumber,
    );
  }

  @Post(':id/invitations/resend')
  resend(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() input: InvitationLocaleDto,
  ) {
    return this.administration.resend(
      principal,
      userId,
      input.locale,
      input.whatsappNumber,
    );
  }

  @Post(':id/invitations/regenerate')
  regenerate(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) userId: string,
  ) {
    return this.administration.regenerate(principal, userId);
  }
}
