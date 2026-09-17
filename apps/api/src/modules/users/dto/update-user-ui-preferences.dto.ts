import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Dashboard cards come and go as the portal grows, so this DTO only checks the
 * shape. UserUiPreferencesService drops any key it does not know, which keeps a
 * newer portal working against an API that has not been redeployed yet.
 */
const MAX_DASHBOARD_SECTIONS = 50;
const MAX_SECTION_KEY_LENGTH = 60;

export class DashboardPreferencesDto {
  @IsArray()
  @ArrayMaxSize(MAX_DASHBOARD_SECTIONS)
  @IsString({ each: true })
  @MaxLength(MAX_SECTION_KEY_LENGTH, { each: true })
  order!: string[];

  @IsArray()
  @ArrayMaxSize(MAX_DASHBOARD_SECTIONS)
  @IsString({ each: true })
  @MaxLength(MAX_SECTION_KEY_LENGTH, { each: true })
  hidden!: string[];

  @IsArray()
  @ArrayMaxSize(MAX_DASHBOARD_SECTIONS)
  @IsString({ each: true })
  @MaxLength(MAX_SECTION_KEY_LENGTH, { each: true })
  collapsed!: string[];
}

export class UpdateUserUiPreferencesDto {
  @IsOptional()
  @IsBoolean()
  sidebarCollapsed?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardPreferencesDto)
  dashboardPreferences?: DashboardPreferencesDto;
}
