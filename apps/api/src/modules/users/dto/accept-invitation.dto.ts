import { IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  displayName!: string;
}
