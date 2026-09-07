import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const E164 = /^\+[1-9]\d{7,14}$/u;

export class UpdateWorkspaceProfileDto {
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
