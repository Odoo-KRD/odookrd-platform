import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const TRAINING_REPORT_EXPORT_DATASETS = [
  'courses',
  'learners',
  'quizzes',
  'certificates',
] as const;

export type TrainingReportExportDataset =
  (typeof TRAINING_REPORT_EXPORT_DATASETS)[number];

export class TrainingReportingFiltersDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Matches(calendarDatePattern)
  dateFrom?: string;

  @IsOptional()
  @Matches(calendarDatePattern)
  dateTo?: string;
}

export class TrainingReportingListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Matches(calendarDatePattern)
  dateFrom?: string;

  @IsOptional()
  @Matches(calendarDatePattern)
  dateTo?: string;
}

export class TrainingReportingExportQueryDto extends TrainingReportingFiltersDto {
  @IsIn(TRAINING_REPORT_EXPORT_DATASETS)
  dataset!: TrainingReportExportDataset;
}
