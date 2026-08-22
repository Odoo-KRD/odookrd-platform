import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import type { ApiLocale } from '../../../i18n/types';

const E164 = /^\+[1-9]\d{7,14}$/u;

export class InvitationLocaleDto {
  @IsIn(['ku', 'ar', 'en'])
  locale: ApiLocale = 'ku';

  @IsOptional()
  @IsString()
  @Matches(E164)
  whatsappNumber?: string;
}

export class DeliverExistingInvitationDto extends InvitationLocaleDto {
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;
}

export class ReplaceAdministrationRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  roleKeys!: string[];
}
