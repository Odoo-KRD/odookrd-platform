import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateTrainingLessonProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(604800)
  positionSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  pageNumber?: number;
}
