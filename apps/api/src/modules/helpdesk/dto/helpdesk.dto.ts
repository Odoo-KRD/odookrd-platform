import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { TicketPriority, TicketStatus } from '../../../generated/prisma/enums';
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_MESSAGE_BODY_LENGTH,
  MAX_TICKET_SUBJECT_LENGTH,
} from '../helpdesk.rules';

export class CreateTicketDto {
  @IsUUID()
  departmentId!: string;

  /** Customer's own assessment; staff can re-triage it afterwards. */
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  /** The company service this is about; omitted when none applies. */
  @IsOptional()
  @IsUUID()
  companyServiceId?: string;

  @IsString()
  @MaxLength(MAX_TICKET_SUBJECT_LENGTH)
  subject!: string;

  @IsString()
  @MaxLength(MAX_MESSAGE_BODY_LENGTH)
  body!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS_PER_MESSAGE)
  @IsUUID('all', { each: true })
  attachmentIds?: string[];
}

export class CreateTicketReplyDto {
  @IsString()
  @MaxLength(MAX_MESSAGE_BODY_LENGTH)
  body!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS_PER_MESSAGE)
  @IsUUID('all', { each: true })
  attachmentIds?: string[];
}

export class ListCustomerTicketsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  /** Matches the reference (TKT-2026-00041) or the subject. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
