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
import { ServicesService } from './services.service';

@Controller('service-assignments')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class ServiceAssignmentsController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListServiceAssignmentsQueryDto,
  ) {
    return this.services.listAssignments(principal, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.services.getAssignment(principal, assignmentId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateServiceAssignmentDto,
  ) {
    return this.services.createAssignment(principal, input);
  }

  @Post('batch-transition')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  batchTransition(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: BatchAssignmentTransitionDto,
  ) {
    return this.services.transitionAssignments(principal, input);
  }

  @Get(':id/features')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  listFeatures(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.services.listAssignmentFeatures(principal, assignmentId, query);
  }

  @Patch(':id/features/:featureId')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  updateFeature(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Param('featureId', ParseUUIDPipe) featureId: string,
    @Body() input: UpdateCompanyServiceFeatureDto,
  ) {
    return this.services.updateAssignmentFeature(
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
    return this.services.syncAssignmentFeatures(principal, assignmentId);
  }

  @Get(':id/history')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  history(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.services.listAssignmentHistory(principal, assignmentId, query);
  }

  @Post(':id/transitions')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  transition(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() input: CreateServiceTransitionDto,
  ) {
    return this.services.transitionAssignment(principal, assignmentId, input);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() input: UpdateServiceAssignmentDto,
  ) {
    return this.services.updateAssignment(principal, assignmentId, input);
  }
}
