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
  CreateTicketDto,
  CreateTicketReplyDto,
  ListCustomerTicketsQueryDto,
} from './dto/helpdesk.dto';
import { HelpdeskService } from './helpdesk.service';

/**
 * Customer helpdesk. helpdesk.read opens the door; which tickets are visible
 * (own only, or the whole company with helpdesk.company.read) is decided in
 * HelpdeskService from the principal, never from request parameters.
 *
 * Attachments are uploaded first through POST /v1/files (kind ATTACHMENT),
 * which scopes them to the uploader's company, and then referenced here by id.
 */
@Controller('helpdesk')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.HELPDESK_READ)
export class HelpdeskController {
  constructor(private readonly helpdesk: HelpdeskService) {}

  @Get('departments')
  listDepartments() {
    return this.helpdesk.listDepartments();
  }

  @Get('tickets')
  listTickets(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListCustomerTicketsQueryDto,
  ) {
    return this.helpdesk.listTickets(principal, query);
  }

  @Post('tickets')
  createTicket(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateTicketDto,
  ) {
    return this.helpdesk.createTicket(principal, input);
  }

  @Get('tickets/:ticketId')
  getTicket(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    return this.helpdesk.getTicket(principal, ticketId);
  }

  @Post('tickets/:ticketId/messages')
  reply(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() input: CreateTicketReplyDto,
  ) {
    return this.helpdesk.reply(principal, ticketId, input);
  }

  @Post('tickets/:ticketId/close')
  close(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    return this.helpdesk.close(principal, ticketId);
  }
}
