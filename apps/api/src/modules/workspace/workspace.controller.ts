import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Delete,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { UploadedFilePayload } from '../files/files.service';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { UpdateWorkspaceProfileDto } from './dto/update-workspace-profile.dto';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.SERVICES_READ)
  overview(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.workspace.overview(principal);
  }

  @Get('profile')
  profile(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.workspace.profile(principal);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() body: UpdateWorkspaceProfileDto,
  ) {
    return this.workspace.updateProfile(principal, body);
  }

  @Put('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        files: 1,
        fileSize: 10_485_760,
      },
    }),
  )
  updateAvatar(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @UploadedFile() file: UploadedFilePayload | undefined,
  ) {
    return this.workspace.updateAvatar(principal, file);
  }

  @Delete('profile/avatar')
  deleteAvatar(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.workspace.deleteAvatar(principal);
  }

  @Get('profile/avatar')
  async avatar(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Res() response: Response,
  ): Promise<void> {
    const content = await this.workspace.getAvatar(principal);

    response.status(200);
    response.setHeader('Content-Type', content.asset.mimeType);
    response.setHeader('Content-Length', String(content.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(content.buffer);
  }
}
