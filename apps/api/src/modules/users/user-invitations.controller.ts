import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { UserInvitationService } from './user-invitation.service';

@Controller('auth/invitations')
export class UserInvitationsController {
  constructor(private readonly invitationService: UserInvitationService) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitationService.accept(dto);
  }
}
