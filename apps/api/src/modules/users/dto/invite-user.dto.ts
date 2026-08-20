import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { AccountScope } from '../../../generated/prisma/enums';

export class InviteUserDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsEnum(AccountScope)
  accountScope!: AccountScope;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({
    each: true,
  })
  @MaxLength(100, {
    each: true,
  })
  roleKeys!: string[];
}
