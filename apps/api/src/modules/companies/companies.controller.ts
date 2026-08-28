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

import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../authorization/permissions';
import { CompaniesService } from './companies.service';
import { BatchCompanyStatusDto } from './dto/batch-company-status.dto';
import { BatchDeleteCompaniesDto } from './dto/batch-delete-companies.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListCompaniesQueryDto,
  ) {
    return this.companiesService.list(principal, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  getById(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
  ) {
    return this.companiesService.getById(principal, companyId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(principal, dto);
  }

  @Post('batch-status')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  batchStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: BatchCompanyStatusDto,
  ) {
    return this.companiesService.updateStatuses(principal, dto);
  }

  @Post('batch-delete')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  batchDelete(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: BatchDeleteCompaniesDto,
  ) {
    return this.companiesService.deleteMany(principal, dto.ids);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  delete(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
  ) {
    return this.companiesService.delete(principal, companyId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(principal, companyId, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  updateStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: UpdateCompanyStatusDto,
  ) {
    return this.companiesService.updateStatus(principal, companyId, dto);
  }
}
