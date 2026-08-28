import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { TrainingAudienceMode } from '../../../generated/prisma/enums';

export class ListTrainingAccessOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class CreateTrainingCompanyAccessDto {
  @IsUUID()
  companyId!: string;

  @IsEnum(TrainingAudienceMode)
  mode!: TrainingAudienceMode;

  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}

export class UpdateTrainingCompanyAccessDto {
  @IsOptional()
  @IsEnum(TrainingAudienceMode)
  mode?: TrainingAudienceMode;

  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}

export class CreateTrainingServiceAccessDto {
  @IsUUID()
  serviceId!: string;

  @IsEnum(TrainingAudienceMode)
  mode!: TrainingAudienceMode;

  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}

export class UpdateTrainingServiceAccessDto {
  @IsOptional()
  @IsEnum(TrainingAudienceMode)
  mode?: TrainingAudienceMode;

  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}

export class CreateTrainingUserAccessDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}

export class UpdateTrainingUserAccessDto {
  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}
