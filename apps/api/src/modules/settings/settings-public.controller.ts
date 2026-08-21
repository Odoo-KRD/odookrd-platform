import { Controller, Get } from '@nestjs/common';

import { SettingsService } from './settings.service';

@Controller('settings/public')
export class SettingsPublicController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  listPublic() {
    return this.settingsService.listPublic();
  }
}
