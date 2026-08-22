import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import type { ApiLocale } from '../../../i18n/types';

export class SendNotificationBroadcastDto {
  @IsUUID()
  requestId!: string;

  @IsIn(['ALL_CUSTOMERS', 'COMPANY'])
  audience!: 'ALL_CUSTOMERS' | 'COMPANY';

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsIn(['ku', 'ar', 'en'])
  locale: ApiLocale = 'ku';

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(3500)
  body!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @IsIn(['IN_APP', 'EMAIL', 'WHATSAPP'], { each: true })
  channels!: Array<'IN_APP' | 'EMAIL' | 'WHATSAPP'>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionUrl?: string;
}
