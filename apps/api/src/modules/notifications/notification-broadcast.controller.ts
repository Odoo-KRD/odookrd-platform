import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { SendNotificationBroadcastDto } from './dto/notification-broadcast.dto';
import { NotificationBroadcastService } from './notification-broadcast.service';

@Controller('notification-administration/broadcasts')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
export class NotificationBroadcastController {
  constructor(private readonly broadcasts: NotificationBroadcastService) {}

  @Get('options')
  options(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.broadcasts.options(principal);
  }

  @Post()
  send(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: SendNotificationBroadcastDto,
  ) {
    return this.broadcasts.send(principal, input);
  }
}
