import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService, AuthenticationResult } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import type { AuthenticatedPrincipal } from './interfaces/authenticated-principal.interface';
import { LoginThrottleService } from './login-throttle.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginThrottle: LoginThrottleService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthenticationResult> {
    const clientAddress =
      request.ip || request.socket.remoteAddress || 'unknown';

    this.loginThrottle.assertAllowed(clientAddress, dto.email);

    try {
      const result = await this.authService.authenticate(
        dto.email,
        dto.password,
      );

      this.loginThrottle.recordSuccess(dto.email);

      return result;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        this.loginThrottle.recordFailure(clientAddress, dto.email);
      }

      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  me(@CurrentUser() principal: AuthenticatedPrincipal): {
    user: {
      id: string;
      email: string;
      accountScope: AuthenticatedPrincipal['accountScope'];
      companyId: string | null;
    };
  } {
    return {
      user: {
        id: principal.userId,
        email: principal.email,
        accountScope: principal.accountScope,
        companyId: principal.companyId,
      },
    };
  }

  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() principal: AuthenticatedPrincipal,
  ): Promise<void> {
    await this.authService.logout(principal.sessionId);
  }

  @Post('logout-all')
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() principal: AuthenticatedPrincipal,
  ): Promise<void> {
    await this.authService.logoutAll(principal.userId);
  }
}
