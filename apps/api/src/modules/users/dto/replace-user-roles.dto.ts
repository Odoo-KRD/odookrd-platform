import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReplaceUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({
    each: true,
  })
  @MaxLength(100, {
    each: true,
  })
  roleKeys!: string[];
}
