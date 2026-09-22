import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import {
  ListNotificationAdministrationDeliveriesDto,
  TestEmailNotificationDto,
  TestWhatsAppNotificationDto,
} from './dto/notification-administration.dto';
import { NotificationAdministrationService } from './notification-administration.service';

@Controller('notification-administration')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
export class NotificationAdministrationController {
  constructor(
    private readonly administration: NotificationAdministrationService,
  ) {}

  @Get('provider-status')
  providerStatus(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.administration.providerStatus(principal);
  }

  @Get('whatsapp-templates')
  whatsappTemplates(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.administration.whatsappTemplates(principal);
  }

  @Post('test-email')
  testEmail(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: TestEmailNotificationDto,
  ) {
    return this.administration.testEmail(
      principal,
      input.recipient,
      input.locale,
    );
  }

  @Post('test-whatsapp')
  testWhatsApp(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: TestWhatsAppNotificationDto,
  ) {
    return this.administration.testWhatsApp(principal, input);
  }

  @Get('deliveries')
  deliveries(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListNotificationAdministrationDeliveriesDto,
  ) {
    return this.administration.listDeliveries(principal, query);
  }
}
