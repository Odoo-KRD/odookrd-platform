import { IsOptional, IsUUID } from 'class-validator';

export class SubscriptionReportQueryDto {
  /** Platform operators may narrow to one company; company accounts cannot. */
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
