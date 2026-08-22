import { IsEmail, IsIn, IsOptional, IsUUID } from 'class-validator';

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

export class TestEmailNotificationDto {
  @IsEmail()
  recipient!: string;

  @IsIn(['ku', 'ar', 'en'])
  locale: ApiLocale = 'ku';
}
