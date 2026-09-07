import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
  ReviewCompanyIdentityChangeRequestDto,
  UpdateCompanyProfileDto,
} from './dto/company-profile.dto';

@Controller('companies')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class CompanyProfileAdminController {
  constructor(private readonly companyProfile: CompanyProfileService) {}

  @Get(':id/profile')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  profile(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
  ) {
    return this.companyProfile.getPlatformProfile(principal, companyId);
  }

  @Patch(':id/profile')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  updateProfile(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() input: UpdateCompanyProfileDto,
  ) {
    return this.companyProfile.updatePlatformProfile(
      principal,
      companyId,
      input,
    );
  }

  @Get(':id/logo')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  async logo(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Res() response: Response,
  ): Promise<void> {
    const content = await this.companyProfile.getPlatformLogo(
      principal,
      companyId,
    );
    response.status(200);
    response.setHeader('Content-Type', content.asset.mimeType);
    response.setHeader('Content-Length', String(content.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(content.buffer);
  }

  @Put(':id/logo')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { files: 1, fileSize: 10_485_760 },
    }),
  )
  updateLogo(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
    @UploadedFile() logo: UploadedFilePayload | undefined,
  ) {
    return this.companyProfile.updatePlatformLogo(principal, companyId, logo);
  }

  @Delete(':id/logo')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  deleteLogo(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
  ) {
    return this.companyProfile.deletePlatformLogo(principal, companyId);
  }

  @Get(':id/identity-requests')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  identityRequests(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
  ) {
    return this.companyProfile.listPlatformIdentityRequests(
      principal,
      companyId,
    );
  }

  @Get(':id/identity-requests/:requestId/logo')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  async requestLogo(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Res() response: Response,
  ): Promise<void> {
    const content = await this.companyProfile.getPlatformRequestLogo(
      principal,
      companyId,
      requestId,
    );
    response.status(200);
    response.setHeader('Content-Type', content.asset.mimeType);
    response.setHeader('Content-Length', String(content.buffer.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(content.buffer);
  }

  @Post(':id/identity-requests/:requestId/review')
  @RequirePermissions(PERMISSIONS.COMPANIES_MANAGE)
  reviewIdentityRequest(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() input: ReviewCompanyIdentityChangeRequestDto,
  ) {
    return this.companyProfile.reviewIdentityRequest(
      principal,
      companyId,
      requestId,
      input,
    );
  }
}
