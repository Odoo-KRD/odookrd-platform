import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from '../auth.service';
import { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedPrincipal;
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    request.auth = await this.authService.authenticateSession(token);

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [scheme, token, extra] = authorization.trim().split(/\s+/);

    if (scheme?.toLowerCase() !== 'bearer' || !token || extra !== undefined) {
      return null;
    }

    return token;
  }
}
