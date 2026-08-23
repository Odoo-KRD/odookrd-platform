import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { UpdateUserUiPreferencesDto } from './dto/update-user-ui-preferences.dto';
import { UserUiPreferencesService } from './user-ui-preferences.service';

@Controller('me/preferences')
@UseGuards(AuthenticatedGuard)
export class UserUiPreferencesController {
  constructor(
    private readonly userUiPreferencesService: UserUiPreferencesService,
  ) {}

  @Get()
  get(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.userUiPreferencesService.get(principal);
  }

  @Patch()
  update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: UpdateUserUiPreferencesDto,
  ) {
    return this.userUiPreferencesService.update(principal, dto);
  }
}
