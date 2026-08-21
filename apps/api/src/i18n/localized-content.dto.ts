import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LocalizedNameDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  ku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  ar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  en?: string;
}

export class LocalizedDescriptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  ku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  ar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  en?: string;
}
