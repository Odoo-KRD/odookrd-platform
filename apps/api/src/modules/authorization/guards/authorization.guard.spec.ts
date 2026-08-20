import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AccountScope } from '../../../generated/prisma/enums';
import type { AuthenticatedPrincipal } from '../../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization.service';
import { AuthorizationGuard } from './authorization.guard';
import { PERMISSIONS, type PermissionKey } from '../permissions';

interface AuthorizationRequest extends Request {
  auth?: AuthenticatedPrincipal;
}

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard;

  let requiredPermissions: readonly PermissionKey[] | undefined;
  let capturedPrincipal: AuthenticatedPrincipal | undefined;
  let capturedPermissions: readonly PermissionKey[] | undefined;
  let authorizationCalls: number;
  let authorizationShouldFail: boolean;

  const principal: AuthenticatedPrincipal = {
    sessionId: 'session-id',
    userId: 'user-id',
    email: 'user@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const reflector = {
    getAllAndOverride(): readonly PermissionKey[] | undefined {
      return requiredPermissions;
    },
  } as unknown as Reflector;

  const authorizationService = {
    assertPermissions(
      currentPrincipal: AuthenticatedPrincipal,
      permissions: readonly PermissionKey[],
    ): Promise<object> {
      capturedPrincipal = currentPrincipal;
      capturedPermissions = permissions;
      authorizationCalls += 1;

      if (authorizationShouldFail) {
        return Promise.reject(
          new ForbiddenException('Insufficient permissions.'),
        );
      }

      return Promise.resolve({});
    },
  } as unknown as AuthorizationService;

  beforeEach(() => {
    requiredPermissions = undefined;
    capturedPrincipal = undefined;
    capturedPermissions = undefined;
    authorizationCalls = 0;
    authorizationShouldFail = false;

    guard = new AuthorizationGuard(reflector, authorizationService);
  });

  function createContext(request: AuthorizationRequest): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: <T>(): T => request as unknown as T,
      }),
      getHandler: () => function handler() {},
      getClass: () => class TestController {},
    } as unknown as ExecutionContext;
  }

  it('rejects a request without an authenticated principal', async () => {
    const request = {
      headers: {},
    } as AuthorizationRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );

    expect(authorizationCalls).toBe(0);
  });

  it('allows an authenticated route without permission metadata', async () => {
    const request = {
      headers: {},
      auth: principal,
    } as AuthorizationRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(authorizationCalls).toBe(0);
  });

  it('checks declared permissions for the authenticated principal', async () => {
    requiredPermissions = [PERMISSIONS.USERS_READ, PERMISSIONS.ROLES_READ];

    const request = {
      headers: {},
      auth: principal,
    } as AuthorizationRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(authorizationCalls).toBe(1);
    expect(capturedPrincipal).toBe(principal);
    expect(capturedPermissions).toEqual([
      PERMISSIONS.USERS_READ,
      PERMISSIONS.ROLES_READ,
    ]);
  });

  it('propagates forbidden authorization failures', async () => {
    requiredPermissions = [PERMISSIONS.USERS_MANAGE];
    authorizationShouldFail = true;

    const request = {
      headers: {},
      auth: principal,
    } as AuthorizationRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      ForbiddenException,
    );

    expect(authorizationCalls).toBe(1);
  });
});
