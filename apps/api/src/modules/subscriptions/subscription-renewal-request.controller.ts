import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import {
  CreateRenewalRequestDto,
  ListRenewalRequestsQueryDto,
  ReviewRenewalRequestDto,
} from './dto/renewal-request.dto';
import { SubscriptionRenewalRequestService } from './subscription-renewal-request.service';

/**
 * Customer-facing renewal requests.
 *
 * Company accounts hold services.read but not services.manage, so raising a
 * request needs only read access while approving it requires an operator.
 */
@Controller('subscription-renewal-requests')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class SubscriptionRenewalRequestController {
  constructor(private readonly requests: SubscriptionRenewalRequestService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListRenewalRequestsQueryDto,
  ) {
    return this.requests.list(principal, query);
  }

  @Post(':requestId/cancel')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  cancel(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.requests.cancel(principal, requestId);
  }

  @Post(':requestId/approve')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  approve(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: ReviewRenewalRequestDto,
  ) {
    return this.requests.approve(principal, requestId, dto);
  }

  @Post(':requestId/reject')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  reject(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: ReviewRenewalRequestDto,
  ) {
    return this.requests.reject(principal, requestId, dto);
  }
}

/**
 * Raising a request is nested under the assignment it concerns, matching the
 * subscription administration routes.
 */
@Controller('service-assignments/:assignmentId/renewal-requests')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class AssignmentRenewalRequestController {
  constructor(private readonly requests: SubscriptionRenewalRequestService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: CreateRenewalRequestDto,
  ) {
    return this.requests.create(principal, assignmentId, dto);
  }
}
