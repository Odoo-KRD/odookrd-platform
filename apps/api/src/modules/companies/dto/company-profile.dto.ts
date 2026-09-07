import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CompanyStatus } from '../../../generated/prisma/enums';
import { LocalizedNameDto } from '../../../i18n/localized-content.dto';

const nullableText = { each: false };

export class UpdateCompanyContactDto {
  @IsOptional(nullableText)
  @IsEmail()
  @MaxLength(320)
  contactEmail?: string | null;

  @IsOptional(nullableText)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  websiteUrl?: string | null;

  @IsOptional(nullableText)
  @Matches(/^\+?[0-9][0-9\s().-]{6,30}$/)
  @MaxLength(32)
  phone?: string | null;

  @IsOptional(nullableText)
  @IsString()
  @MaxLength(250)
  addressLine1?: string | null;

  @IsOptional(nullableText)
  @IsString()
  @MaxLength(250)
  addressLine2?: string | null;

  @IsOptional(nullableText)
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @IsOptional(nullableText)
  @IsString()
  @MaxLength(120)
  region?: string | null;

  @IsOptional(nullableText)
  @IsString()
  @MaxLength(32)
  postalCode?: string | null;

  @IsOptional(nullableText)
  @Matches(/^[A-Za-z]{2}$/)
  countryCode?: string | null;
}

export class UpdateCompanyProfileDto extends UpdateCompanyContactDto {
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsOptional(nullableText)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(160)
  slug?: string | null;
}

export class CreateCompanyIdentityChangeRequestDto {
  @IsOptional(nullableText)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  proposedName?: string | null;
}

export class ReviewCompanyIdentityChangeRequestDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional(nullableText)
  @IsString()
  @MaxLength(1000)
  reviewNote?: string | null;
}
