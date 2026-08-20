import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AccountScope } from '../../../generated/prisma/enums';
import { AuthService } from '../auth.service';
import {
  AuthenticatedGuard,
  AuthenticatedRequest,
} from './authenticated.guard';
import type { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;

  let capturedToken: string | undefined;
  let authenticationShouldFail: boolean;

  const principal: AuthenticatedPrincipal = {
    sessionId: 'session-id',
    userId: 'user-id',
    email: 'user@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const authService = {
    authenticateSession(token: string): Promise<AuthenticatedPrincipal> {
      capturedToken = token;

      if (authenticationShouldFail) {
        return Promise.reject(
          new UnauthorizedException('Authentication required.'),
        );
      }

      return Promise.resolve(principal);
    },
  } as unknown as AuthService;

  beforeEach(() => {
    capturedToken = undefined;
    authenticationShouldFail = false;

    guard = new AuthenticatedGuard(authService);
  });

  function createContext(request: AuthenticatedRequest): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: <T>(): T => request as unknown as T,
      }),
    } as unknown as ExecutionContext;
  }

  it('accepts a valid Bearer session token', async () => {
    const request = {
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    } as AuthenticatedRequest;

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(capturedToken).toBe('valid-session-token');
    expect(request.auth).toEqual(principal);
  });

  it('accepts a case-insensitive Bearer scheme', async () => {
    const request = {
      headers: {
        authorization: 'bearer valid-session-token',
      },
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it('rejects a missing Authorization header', async () => {
    const request = {
      headers: {},
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a non-Bearer authorization scheme', async () => {
    const request = {
      headers: {
        authorization: 'Basic credentials',
      },
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a Bearer header without a token', async () => {
    const request = {
      headers: {
        authorization: 'Bearer',
      },
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a Bearer header containing additional values', async () => {
    const request = {
      headers: {
        authorization: 'Bearer token extra',
      },
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid session token', async () => {
    authenticationShouldFail = true;

    const request = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );

    expect(capturedToken).toBe('invalid-token');
  });
});
