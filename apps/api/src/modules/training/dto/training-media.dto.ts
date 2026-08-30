import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

export class InitAutomatedTrainingVideoDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_SAFE)
  sizeBytes!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(86_400)
  durationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16_384)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16_384)
  height?: number;
}

export class CompleteAutomatedTrainingVideoDto {
  @IsUUID()
  assetId!: string;
}

export class SetManualTrainingVideoDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  playbackUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_SAFE)
  sourceSizeBytes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_SAFE)
  processedSizeBytes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(86_400)
  durationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16_384)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16_384)
  height?: number;
}

export class AttachTrainingSlidesDto {
  @IsUUID()
  fileAssetId!: string;

  @IsInt()
  @Min(1)
  @Max(10_000)
  pageCount!: number;
}
export class SetTrainingVideoThumbnailDto {
  @IsUUID()
  fileAssetId!: string;
}
