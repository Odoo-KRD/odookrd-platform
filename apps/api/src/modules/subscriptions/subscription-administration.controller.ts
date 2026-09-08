import {
  Body,
  Controller,
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
import {
  CancelSubscriptionDto,
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { SubscriptionAdministrationService } from './subscription-administration.service';

@Controller('service-assignments/:assignmentId/subscription')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class SubscriptionAdministrationController {
  constructor(
    private readonly subscriptions: SubscriptionAdministrationService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.subscriptions.get(principal, assignmentId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptions.create(principal, assignmentId, dto);
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptions.update(principal, assignmentId, dto);
  }

  @Post('renew')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  renew(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: RenewSubscriptionDto,
  ) {
    return this.subscriptions.renew(principal, assignmentId, dto);
  }

  @Post('cancel')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  cancel(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptions.cancel(principal, assignmentId, dto);
  }
}
