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
  CreateTrainingCompanyAccessDto,
  CreateTrainingServiceAccessDto,
  CreateTrainingUserAccessDto,
  ListTrainingAccessOptionsQueryDto,
  UpdateTrainingCompanyAccessDto,
  UpdateTrainingServiceAccessDto,
  UpdateTrainingUserAccessDto,
} from './dto/training-access.dto';
import { TrainingAccessService } from './training-access.service';

@Controller('training/access')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_ASSIGN)
export class TrainingAccessController {
  constructor(private readonly access: TrainingAccessService) {}

  @Get('company-courses')
  listCompanyCourses(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.access.listCompanyCourses(principal);
  }

  @Get('courses/:courseId/options')
  options(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: ListTrainingAccessOptionsQueryDto,
  ) {
    return this.access.getOptions(principal, courseId, query);
  }

  @Get('courses/:courseId')
  summary(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.access.getSummary(principal, courseId);
  }

  @Post('courses/:courseId/companies')
  createCompany(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() input: CreateTrainingCompanyAccessDto,
  ) {
    return this.access.createCompanyAccess(principal, courseId, input);
  }

  @Patch('courses/:courseId/companies/:accessId')
  updateCompany(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
    @Body() input: UpdateTrainingCompanyAccessDto,
  ) {
    return this.access.updateCompanyAccess(
      principal,
      courseId,
      accessId,
      input,
    );
  }

  @Delete('courses/:courseId/companies/:accessId')
  deleteCompany(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
  ) {
    return this.access.deleteCompanyAccess(principal, courseId, accessId);
  }

  @Post('courses/:courseId/services')
  createService(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() input: CreateTrainingServiceAccessDto,
  ) {
    return this.access.createServiceAccess(principal, courseId, input);
  }

  @Patch('courses/:courseId/services/:accessId')
  updateService(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
    @Body() input: UpdateTrainingServiceAccessDto,
  ) {
    return this.access.updateServiceAccess(
      principal,
      courseId,
      accessId,
      input,
    );
  }

  @Delete('courses/:courseId/services/:accessId')
  deleteService(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
  ) {
    return this.access.deleteServiceAccess(principal, courseId, accessId);
  }

  @Post('courses/:courseId/users')
  createUser(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() input: CreateTrainingUserAccessDto,
  ) {
    return this.access.createUserAccess(principal, courseId, input);
  }

  @Patch('courses/:courseId/users/:accessId')
  updateUser(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
    @Body() input: UpdateTrainingUserAccessDto,
  ) {
    return this.access.updateUserAccess(principal, courseId, accessId, input);
  }

  @Delete('courses/:courseId/users/:accessId')
  deleteUser(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
  ) {
    return this.access.deleteUserAccess(principal, courseId, accessId);
  }
}
