import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

import {
  SubscriptionTerm,
  SubscriptionPeriodSource,
} from '../../../generated/prisma/enums';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionTerm)
  term!: SubscriptionTerm;

  /** Defaults to now when omitted. */
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  /** Required for a CUSTOM term, rejected for every other term. */
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  gracePeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  trial?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalBillingRef?: string | null;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionTerm)
  term?: SubscriptionTerm;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  gracePeriodDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalBillingRef?: string | null;
}

export class RenewSubscriptionDto {
  /** Defaults to the subscription's current term. */
  @IsOptional()
  @IsEnum(SubscriptionTerm)
  term?: SubscriptionTerm;

  /** Required when renewing onto a CUSTOM term. */
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsEnum(SubscriptionPeriodSource)
  source?: SubscriptionPeriodSource;
}

export class CancelSubscriptionDto {
  /**
   * When true the subscription runs to the end of the paid period and stops.
   * When false access is withdrawn immediately.
   */
  @IsOptional()
  @IsBoolean()
  atPeriodEnd?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
