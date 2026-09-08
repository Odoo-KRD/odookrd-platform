import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  CompanyServiceStatus,
  ServiceFeatureValueType,
} from '../../generated/prisma/enums';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { ServiceFeaturePrimitive } from './dto/service-feature.dto';

export const allowedLifecycleTransitions: Record<
  CompanyServiceStatus,
  readonly CompanyServiceStatus[]
> = {
  [CompanyServiceStatus.PROVISIONING]: [
    CompanyServiceStatus.ACTIVE,
    CompanyServiceStatus.SUSPENDED,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.ACTIVE]: [
    CompanyServiceStatus.SUSPENDED,
    CompanyServiceStatus.EXPIRED,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.SUSPENDED]: [
    CompanyServiceStatus.ACTIVE,
    CompanyServiceStatus.EXPIRED,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.EXPIRED]: [
    CompanyServiceStatus.ACTIVE,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.CANCELLED]: [],
};

const prohibitedMonetaryUnit =
  /(?:[$€£]|\b(?:USD|IQD|EUR|GBP|AED|SAR|DOLLARS?|DINARS?|EUROS?)\b)/i;
const storageUnits = new Set(['MB', 'GB', 'TB']);

export function assertPlatformAdministrator(
  principal: AuthenticatedPrincipal,
): void {
  if (
    principal.accountScope !== AccountScope.PLATFORM ||
    principal.companyId !== null
  ) {
    throw new ForbiddenException(
      'Platform service administration is forbidden.',
    );
  }
}

export function assertValidFeatureValue(
  valueType: ServiceFeatureValueType,
  value: unknown,
  unit: string | null | undefined,
  translations: unknown,
): asserts value is ServiceFeaturePrimitive {
  const hasTranslations =
    typeof translations === 'object' &&
    translations !== null &&
    Object.values(translations).some(
      (translation) =>
        typeof translation === 'string' && translation.trim().length > 0,
    );

  if (valueType === ServiceFeatureValueType.BOOLEAN) {
    if (typeof value !== 'boolean' || unit || hasTranslations) {
      throw new BadRequestException(
        'Boolean features require true or false and cannot use units or translated values.',
      );
    }

    return;
  }

  if (
    valueType === ServiceFeatureValueType.NUMBER ||
    valueType === ServiceFeatureValueType.STORAGE
  ) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      hasTranslations
    ) {
      throw new BadRequestException(
        'Number and storage features require a finite number and cannot use translated values.',
      );
    }

    if (unit && prohibitedMonetaryUnit.test(unit)) {
      throw new BadRequestException(
        'Service feature units cannot represent currencies or pricing.',
      );
    }

    if (
      valueType === ServiceFeatureValueType.STORAGE &&
      unit &&
      !storageUnits.has(unit)
    ) {
      throw new BadRequestException(
        'Storage feature units must be MB, GB, TB, or empty.',
      );
    }

    return;
  }

  if (
    valueType !== ServiceFeatureValueType.TEXT ||
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > 500 ||
    unit
  ) {
    throw new BadRequestException(
      'Text features require a non-empty value of at most 500 characters and cannot use units.',
    );
  }
}

export function requireFeaturePrimitive(
  value: Prisma.JsonValue,
): ServiceFeaturePrimitive {
  if (
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'string'
  ) {
    return value;
  }

  throw new ConflictException('An existing service feature value is invalid.');
}

export function jsonInputObject(
  value: Prisma.JsonValue,
): Prisma.InputJsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

export function assertAllowedTransition(
  fromStatus: CompanyServiceStatus,
  toStatus: CompanyServiceStatus,
  reason?: string,
): void {
  if (!allowedLifecycleTransitions[fromStatus].includes(toStatus)) {
    throw new ConflictException(
      `Service status cannot transition from ${fromStatus} to ${toStatus}.`,
    );
  }

  if (
    (toStatus === CompanyServiceStatus.SUSPENDED ||
      toStatus === CompanyServiceStatus.CANCELLED) &&
    !reason?.trim()
  ) {
    throw new BadRequestException(
      'Suspending or cancelling a service requires an operator reason.',
    );
  }
}

export function resolveTransitionDate(value?: string): Date {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 60_000) {
    throw new BadRequestException(
      'The service transition effective date must not be in the future.',
    );
  }

  return date;
}

export function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function optionalDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('A service date is invalid.');
  }

  return date;
}

export function assertValidDates(
  startsAt: Date | null,
  expiresAt: Date | null,
): void {
  if (startsAt && expiresAt && startsAt.getTime() > expiresAt.getTime()) {
    throw new BadRequestException(
      'The service expiration date cannot be earlier than its start date.',
    );
  }
}
