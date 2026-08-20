import { SetMetadata } from '@nestjs/common';

import type { PermissionKey } from '../permissions';

export const REQUIRED_PERMISSIONS_KEY = 'authorization:required-permissions';

export const RequirePermissions = (
  ...permissions: PermissionKey[]
): ReturnType<typeof SetMetadata> =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
