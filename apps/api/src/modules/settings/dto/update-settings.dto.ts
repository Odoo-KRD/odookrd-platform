import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class UpdateSettingItemDto {
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/)
  key!: string;

  @IsDefined()
  value!: unknown;
}

export class UpdateSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateSettingItemDto)
  settings!: UpdateSettingItemDto[];
}
