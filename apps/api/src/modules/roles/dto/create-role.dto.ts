import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { RoleScope } from '../../../generated/prisma/enums';

export class CreateRoleDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{2,99}$/)
  key!: string;

  @IsString()
  @Length(2, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsEnum(RoleScope)
  scope!: RoleScope;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(150, { each: true })
  permissionKeys!: string[];
}
