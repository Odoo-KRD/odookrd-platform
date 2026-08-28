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
import { BatchServiceStatusDto } from './dto/service-batch.dto';
import { AttachServiceFeatureDefinitionDto } from './dto/service-feature-definition.dto';
import {
  CreateServiceFeatureDto,
  ListServiceFeaturesQueryDto,
  ReorderServiceFeaturesDto,
  UpdateServiceFeatureDto,
} from './dto/service-feature.dto';
import {
  CreateServiceDto,
  ListServicesQueryDto,
  UpdateServiceDto,
} from './dto/service.dto';
import { ServicesService } from './services.service';

@Controller('services')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListServicesQueryDto,
  ) {
    return this.services.listServices(principal, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) serviceId: string,
  ) {
    return this.services.getService(principal, serviceId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateServiceDto,
  ) {
    return this.services.createService(principal, input);
  }

  @Post('batch-status')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  batchStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: BatchServiceStatusDto,
  ) {
    return this.services.updateServiceStatuses(principal, input);
  }

  @Get(':serviceId/features')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  listFeatures(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: ListServiceFeaturesQueryDto,
  ) {
    return this.services.listServiceFeatures(principal, serviceId, query);
  }

  @Post(':serviceId/features')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  createFeature(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() input: CreateServiceFeatureDto,
  ) {
    return this.services.createServiceFeature(principal, serviceId, input);
  }

  @Post(':serviceId/features/attach')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  attachFeature(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() input: AttachServiceFeatureDefinitionDto,
  ) {
    return this.services.attachFeatureDefinition(principal, serviceId, input);
  }

  @Post(':serviceId/features/reorder')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  reorderFeatures(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() input: ReorderServiceFeaturesDto,
  ) {
    return this.services.reorderServiceFeatures(principal, serviceId, input);
  }

  @Patch(':serviceId/features/:featureId')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  updateFeature(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Param('featureId', ParseUUIDPipe) featureId: string,
    @Body() input: UpdateServiceFeatureDto,
  ) {
    return this.services.updateServiceFeature(
      principal,
      serviceId,
      featureId,
      input,
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Body() input: UpdateServiceDto,
  ) {
    return this.services.updateService(principal, serviceId, input);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  remove(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) serviceId: string,
  ) {
    return this.services.deleteService(principal, serviceId);
  }
}
