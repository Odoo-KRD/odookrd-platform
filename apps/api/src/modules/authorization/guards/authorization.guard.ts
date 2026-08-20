import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { AuthenticatedPrincipal } from '../../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { PermissionKey } from '../permissions';

interface AuthorizationRequest extends Request {
  auth?: AuthenticatedPrincipal;
}

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthorizationRequest>();

    if (!request.auth) {
      throw new UnauthorizedException('Authentication required.');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<
      readonly PermissionKey[]
    >(REQUIRED_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    await this.authorizationService.assertPermissions(
      request.auth,
      requiredPermissions,
    );

    return true;
  }
}
