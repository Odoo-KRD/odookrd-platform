import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import type { ApiLocale } from '../../../i18n/types';

export class ListNotificationAdministrationDeliveriesDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['NOTIFICATION', 'INVITATION', 'TEST'])
  kind?: 'NOTIFICATION' | 'INVITATION' | 'TEST';

  @IsOptional()
  @IsIn(['IN_APP', 'EMAIL', 'WHATSAPP'])
  channel?: 'IN_APP' | 'EMAIL' | 'WHATSAPP';

  @IsOptional()
  @IsIn(['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED'])
  status?: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'SKIPPED';

  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class TestWhatsAppNotificationDto {
  /** E.164, for example +9647501234567. */
  @Matches(/^\+?[0-9 ()-]{8,24}$/)
  destination!: string;

  /**
   * Optional notification type. When it has an approved Twilio template, the
   * test sends that template with sample values; otherwise plain text, which
   * WhatsApp only delivers within 24 hours of the recipient's last message.
   */
  @IsOptional()
  @IsString()
  @MaxLength(150)
  templateKey?: string;

  @IsIn(['ku', 'ar', 'en'])
  locale: ApiLocale = 'ku';
}

export class TestEmailNotificationDto {
  @IsEmail()
  recipient!: string;

  @IsIn(['ku', 'ar', 'en'])
  locale: ApiLocale = 'ku';
}
