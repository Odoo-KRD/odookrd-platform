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

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SERVICES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Body() input: UpdateServiceDto,
  ) {
    return this.services.updateService(principal, serviceId, input);
  }
}
