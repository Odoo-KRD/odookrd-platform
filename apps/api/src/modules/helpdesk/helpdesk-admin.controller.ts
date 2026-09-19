import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
  AssignTicketDto,
  BatchTicketAssignDto,
  BatchTicketStatusDto,
  CreateStaffMessageDto,
  CreateTicketDepartmentDto,
  ListQueueQueryDto,
  UpdateTicketDepartmentDto,
  UpdateTicketDto,
} from './dto/helpdesk-admin.dto';
import { HelpdeskAdminService } from './helpdesk-admin.service';

/**
 * Staff helpdesk. Every route needs helpdesk.manage; assignment routes also
 * need helpdesk.assign. A method-level @RequirePermissions replaces the class
 * one, so assignment routes list both keys.
 */
@Controller('helpdesk/admin')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.HELPDESK_MANAGE)
export class HelpdeskAdminController {
  constructor(private readonly admin: HelpdeskAdminService) {}

  @Get('tickets')
  listQueue(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListQueueQueryDto,
  ) {
    return this.admin.listQueue(principal, query);
  }

  @Post('tickets/batch/status')
  batchStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: BatchTicketStatusDto,
  ) {
    return this.admin.batchStatus(principal, input);
  }

  @Post('tickets/batch/assign')
  @RequirePermissions(PERMISSIONS.HELPDESK_MANAGE, PERMISSIONS.HELPDESK_ASSIGN)
  batchAssign(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: BatchTicketAssignDto,
  ) {
    return this.admin.batchAssign(principal, input);
  }

  @Get('tickets/:ticketId')
  getTicket(@Param('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.admin.getTicket(ticketId);
  }

  @Patch('tickets/:ticketId')
  updateTicket(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() input: UpdateTicketDto,
  ) {
    return this.admin.updateTicket(principal, ticketId, input);
  }

  @Post('tickets/:ticketId/assign')
  @RequirePermissions(PERMISSIONS.HELPDESK_MANAGE, PERMISSIONS.HELPDESK_ASSIGN)
  assignTicket(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() input: AssignTicketDto,
  ) {
    return this.admin.assignTicket(principal, ticketId, input);
  }

  @Post('tickets/:ticketId/messages')
  addMessage(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() input: CreateStaffMessageDto,
  ) {
    return this.admin.addMessage(principal, ticketId, input);
  }

  @Get('assignees')
  listAssignees() {
    return this.admin.listAssignees();
  }

  @Get('departments')
  listDepartments() {
    return this.admin.listDepartments();
  }

  @Post('departments')
  createDepartment(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateTicketDepartmentDto,
  ) {
    return this.admin.createDepartment(principal, input);
  }

  @Get('departments/:departmentId')
  getDepartment(@Param('departmentId', ParseUUIDPipe) departmentId: string) {
    return this.admin.getDepartment(departmentId);
  }

  @Patch('departments/:departmentId')
  updateDepartment(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() input: UpdateTicketDepartmentDto,
  ) {
    return this.admin.updateDepartment(principal, departmentId, input);
  }

  @Delete('departments/:departmentId')
  deleteDepartment(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
  ) {
    return this.admin.deleteDepartment(principal, departmentId);
  }
}
