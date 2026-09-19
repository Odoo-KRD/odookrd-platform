import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { BatchMutationIdsDto } from '../../../common/batch/batch-mutation.dto';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import {
  TicketDepartmentStatus,
  TicketPriority,
  TicketStatus,
} from '../../../generated/prisma/enums';
import {
  LocalizedDescriptionDto,
  LocalizedNameDto,
} from '../../../i18n/localized-content.dto';
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_MESSAGE_BODY_LENGTH,
} from '../helpdesk.rules';

export const QUEUE_SORTS = ['activity', 'created', 'priority'] as const;
export type QueueSort = (typeof QUEUE_SORTS)[number];

export class ListQueueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  /** A staff user id, `me`, or `unassigned`. */
  @IsOptional()
  @Matches(
    /^(me|unassigned|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
    { message: 'assignee must be a user id, "me" or "unassigned".' },
  )
  assignee?: string;

  /** Matches the reference or the subject. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(QUEUE_SORTS)
  sort?: QueueSort;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

/**
 * The field is required: null unassigns, a missing field is a 400, so an
 * empty request body cannot silently unassign a ticket.
 */
export class AssignTicketDto {
  @ValidateIf((input: AssignTicketDto) => input.assigneeUserId !== null)
  @IsUUID()
  assigneeUserId!: string | null;
}

/**
 * isInternal has no default on purpose: the client must say which kind of
 * message it is sending, so a missing field cannot turn a private note into a
 * customer-visible reply or the other way round.
 */
export class CreateStaffMessageDto {
  @IsBoolean()
  isInternal!: boolean;

  @IsString()
  @MaxLength(MAX_MESSAGE_BODY_LENGTH)
  body!: string;

  /** Public replies only: the status to leave the ticket in. */
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  /** Public replies only; internal notes cannot carry files. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS_PER_MESSAGE)
  @IsUUID('all', { each: true })
  attachmentIds?: string[];
}

export class BatchTicketStatusDto extends BatchMutationIdsDto {
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}

export class BatchTicketAssignDto extends BatchMutationIdsDto {
  @ValidateIf((input: BatchTicketAssignDto) => input.assigneeUserId !== null)
  @IsUUID()
  assigneeUserId!: string | null;
}

export class CreateTicketDepartmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  /** Omit to derive it from the English name, else the base name. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsEnum(TicketDepartmentStatus)
  status?: TicketDepartmentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateTicketDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsEnum(TicketDepartmentStatus)
  status?: TicketDepartmentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
