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
  CreateServiceFeatureDefinitionDto,
  ListServiceFeatureDefinitionsDto,
  UpdateServiceFeatureDefinitionDto,
} from './dto/service-feature-definition.dto';
import { ServicesService } from './services.service';

@Controller('service-feature-definitions')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class ServiceFeatureDefinitionsController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListServiceFeatureDefinitionsDto,
  ) {
    return this.services.listFeatureDefinitions(principal, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  get(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) definitionId: string,
  ) {
    return this.services.getFeatureDefinition(principal, definitionId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateServiceFeatureDefinitionDto,
  ) {
    return this.services.createFeatureDefinition(principal, input);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) definitionId: string,
    @Body() input: UpdateServiceFeatureDefinitionDto,
  ) {
    return this.services.updateFeatureDefinition(
      principal,
      definitionId,
      input,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  remove(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) definitionId: string,
  ) {
    return this.services.deleteFeatureDefinition(principal, definitionId);
  }
}
