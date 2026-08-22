import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.NOTIFICATIONS_READ)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListNotificationsDto,
  ) {
    return this.notifications.list(principal, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.notifications.unreadCount(principal);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.notifications.markAllRead(principal);
  }

  @Patch(':recipientId/read')
  markRead(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
  ) {
    return this.notifications.markRead(principal, recipientId);
  }
}
