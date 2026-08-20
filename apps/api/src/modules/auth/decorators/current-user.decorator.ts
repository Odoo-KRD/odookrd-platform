import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthenticatedRequest } from '../guards/authenticated.guard';
import { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.auth) {
      throw new UnauthorizedException('Authentication required.');
    }

    return request.auth;
  },
);
