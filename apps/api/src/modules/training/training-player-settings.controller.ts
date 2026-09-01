import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { TrainingPlayerSettingsService } from './training-player-settings.service';

@Controller('training')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class TrainingPlayerSettingsController {
  constructor(private readonly playerSettings: TrainingPlayerSettingsService) {}

  @Get('player-settings')
  @RequirePermissions(PERMISSIONS.TRAINING_READ)
  getPlayerSettings() {
    return this.playerSettings.resolve();
  }
}
