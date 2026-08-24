import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  ValidateNested,
} from 'class-validator';

const DASHBOARD_SECTION_KEYS = [
  'companies',
  'users',
  'roles',
  'services',
  'notifications',
  'settings',
] as const;

export class DashboardPreferencesDto {
  @IsArray()
  @ArrayMaxSize(DASHBOARD_SECTION_KEYS.length)
  @IsIn(DASHBOARD_SECTION_KEYS, { each: true })
  order!: string[];

  @IsArray()
  @ArrayMaxSize(DASHBOARD_SECTION_KEYS.length)
  @IsIn(DASHBOARD_SECTION_KEYS, { each: true })
  hidden!: string[];

  @IsArray()
  @ArrayMaxSize(DASHBOARD_SECTION_KEYS.length)
  @IsIn(DASHBOARD_SECTION_KEYS, { each: true })
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
