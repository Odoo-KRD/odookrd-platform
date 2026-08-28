import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { FileAssetKind } from '../../../generated/prisma/enums';

export class UploadFileDto {
  @IsEnum(FileAssetKind)
  kind!: FileAssetKind;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
