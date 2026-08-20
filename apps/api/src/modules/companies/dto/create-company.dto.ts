import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;
}
