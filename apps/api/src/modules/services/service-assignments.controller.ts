import {
  Body,
  Controller,
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
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { BatchAssignmentTransitionDto } from './dto/service-batch.dto';
import { UpdateCompanyServiceFeatureDto } from './dto/service-feature.dto';
import { CreateServiceTransitionDto } from './dto/service-lifecycle.dto';
import {
  CreateServiceAssignmentDto,
  ListServiceAssignmentsQueryDto,
  UpdateServiceAssignmentDto,
} from './dto/service-assignment.dto';
import { ServiceAssignmentsService } from './service-assignments.service';
import { ServiceLifecycleService } from './service-lifecycle.service';

@Controller('service-assignments')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class ServiceAssignmentsController {
  constructor(
    private readonly assignments: ServiceAssignmentsService,
    private readonly lifecycle: ServiceLifecycleService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListServiceAssignmentsQueryDto,
  ) {
    return this.assignments.listAssignments(principal, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.assignments.getAssignment(principal, assignmentId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateServiceAssignmentDto,
  ) {
    return this.assignments.createAssignment(principal, input);
  }

  @Post('batch-transition')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  batchTransition(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: BatchAssignmentTransitionDto,
  ) {
    return this.lifecycle.transitionAssignments(principal, input);
  }

  @Get(':id/features')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  listFeatures(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.assignments.listAssignmentFeatures(
      principal,
      assignmentId,
      query,
    );
  }

  @Patch(':id/features/:featureId')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  updateFeature(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Param('featureId', ParseUUIDPipe) featureId: string,
    @Body() input: UpdateCompanyServiceFeatureDto,
  ) {
    return this.assignments.updateAssignmentFeature(
      principal,
      assignmentId,
      featureId,
      input,
    );
  }

  @Post(':id/features/sync')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  syncFeatures(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.assignments.syncAssignmentFeatures(principal, assignmentId);
  }

  @Get(':id/history')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  history(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.lifecycle.listAssignmentHistory(principal, assignmentId, query);
  }

  @Post(':id/transitions')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  transition(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() input: CreateServiceTransitionDto,
  ) {
    return this.lifecycle.transitionAssignment(principal, assignmentId, input);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() input: UpdateServiceAssignmentDto,
  ) {
    return this.assignments.updateAssignment(principal, assignmentId, input);
  }
}
