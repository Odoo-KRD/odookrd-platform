import { IsBoolean } from 'class-validator';

export class UpdateUserUiPreferencesDto {
  @IsBoolean()
  sidebarCollapsed!: boolean;
}
