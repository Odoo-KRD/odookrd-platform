import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('platform')
  @RequirePermissions(PERMISSIONS.SETTINGS_READ)
  listPlatform(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.settingsService.listPlatform(principal);
  }

  @Patch('platform')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  updatePlatform(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: UpdateSettingsDto,
  ) {
    return this.settingsService.updatePlatform(principal, input.settings);
  }

  @Get('company/:companyId')
  @RequirePermissions(PERMISSIONS.SETTINGS_READ)
  listCompany(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.settingsService.listCompany(principal, companyId);
  }

  @Patch('company/:companyId')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  updateCompany(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() input: UpdateSettingsDto,
  ) {
    return this.settingsService.updateCompany(
      principal,
      companyId,
      input.settings,
    );
  }
}
