import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

import type { Prisma } from '../generated/prisma/client';
import { resolveApiLocale } from './index';
import { API_SUPPORTED_LOCALES, type ApiLocale } from './types';

export type ApiLocalizedText = Partial<Record<ApiLocale, string>>;

export function normalizeLocalizedText(
  translations: ApiLocalizedText | undefined,
  fallback: string | null | undefined,
): Prisma.InputJsonObject {
  const normalized: Record<string, string> = {};

  for (const locale of API_SUPPORTED_LOCALES) {
    const value = translations?.[locale]?.trim();

    if (value) {
      normalized[locale] = value;
    }
  }

  const defaultValue = fallback?.trim();

  if (defaultValue && typeof normalized.ku !== 'string') {
    normalized.ku = defaultValue;
  }

  return normalized;
}

export function resolveLocalizedText(
  translations: unknown,
  locale: ApiLocale,
  fallback: string | null,
): string | null {
  if (
    typeof translations !== 'object' ||
    translations === null ||
    Array.isArray(translations)
  ) {
    return fallback;
  }

  const available: Record<string, unknown> = Object.fromEntries(
    Object.entries(translations),
  );
  const orderedLocales = [locale, ...API_SUPPORTED_LOCALES];

  for (const candidate of orderedLocales) {
    const selected: unknown = available[candidate];

    if (typeof selected === 'string' && selected.trim()) {
      return selected;
    }
  }

  return fallback;
}

export function localizeResponse(value: unknown, locale: ApiLocale): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => localizeResponse(item, locale));
  }

  if (typeof value !== 'object' || value === null || value instanceof Date) {
    return value;
  }

  const entries: Record<string, unknown> = Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      localizeResponse(nested, locale),
    ]),
  );

  for (const [field, translationField] of [
    ['name', 'nameTranslations'],
    ['title', 'titleTranslations'],
    ['summary', 'summaryTranslations'],
    ['description', 'descriptionTranslations'],
    ['displayName', 'displayNameTranslations'],
    ['parameterLabel', 'parameterLabelTranslations'],
  ] as const) {
    const original: unknown = entries[field];

    if (
      (typeof original === 'string' || original === null) &&
      translationField in entries
    ) {
      entries[field] = resolveLocalizedText(
        entries[translationField],
        locale,
        original,
      );
    }
  }

  return entries;
}

@Injectable()
export class LocalizedContentInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const locale = resolveApiLocale(request.headers['accept-language']);

    return next
      .handle()
      .pipe(map((value: unknown) => localizeResponse(value, locale)));
  }
}
