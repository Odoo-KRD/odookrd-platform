import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
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
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import type { UploadedFilePayload } from '../files/files.service';
import { CompanyProfileService } from './company-profile.service';
import {
  CreateCompanyIdentityChangeRequestDto,
  UpdateCompanyContactDto,
} from './dto/company-profile.dto';

@Controller('workspace/company')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class WorkspaceCompanyController {
  constructor(private readonly companyProfile: CompanyProfileService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  profile(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.companyProfile.getOwnProfile(principal);
  }

  @Patch('contact')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  updateContact(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: UpdateCompanyContactDto,
  ) {
    return this.companyProfile.updateOwnContact(principal, input);
  }

  @Get('logo')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  async logo(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Res() response: Response,
  ): Promise<void> {
    const content = await this.companyProfile.getOwnLogo(principal);
    response.status(200);
    response.setHeader('Content-Type', content.asset.mimeType);
    response.setHeader('Content-Length', String(content.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(content.buffer);
  }

  @Get('identity-requests')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  identityRequests(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.companyProfile.listOwnIdentityRequests(principal);
  }

  @Post('identity-requests')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { files: 1, fileSize: 10_485_760 },
    }),
  )
  createIdentityRequest(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateCompanyIdentityChangeRequestDto,
    @UploadedFile() logo: UploadedFilePayload | undefined,
  ) {
    return this.companyProfile.createIdentityRequest(principal, input, logo);
  }
}
