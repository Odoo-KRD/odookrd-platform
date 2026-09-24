import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const E164 = /^\+[1-9]\d{7,14}$/u;

/**
 * An administrator's edit of another account's details. Omitted fields are
 * left unchanged; null clears an optional field.
 */
export class UpdateUserProfileDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  displayName?: string | null;

  @IsOptional()
  @IsString()
  @Matches(E164)
  whatsappNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  certificateName?: string | null;
}
