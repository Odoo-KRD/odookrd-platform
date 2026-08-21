import type { NextFunction, Request, Response } from 'express';

import { apiAr } from './ar';
import { apiEn } from './en';
import { apiKu } from './ku';
import {
  API_SUPPORTED_LOCALES,
  type ApiErrorCode,
  type ApiLocale,
  type ApiTranslations,
} from './types';

export { API_ERROR_CODES, API_SUPPORTED_LOCALES } from './types';
export type { ApiErrorCode, ApiLocale, ApiTranslations } from './types';

export const apiTranslations: Record<ApiLocale, ApiTranslations> = {
  ku: apiKu,
  ar: apiAr,
  en: apiEn,
};

export function resolveApiLocale(
  acceptLanguage: string | string[] | undefined,
): ApiLocale {
  const header = Array.isArray(acceptLanguage)
    ? acceptLanguage.join(',')
    : (acceptLanguage ?? '');

  const preferences = header
    .split(',')
    .map((entry, index) => {
      const [language = '', ...parameters] = entry.split(';');
      const qualityParameter = parameters.find((value) =>
        value.trim().startsWith('q='),
      );
      const parsedQuality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1;
      const quality =
        Number.isFinite(parsedQuality) &&
        parsedQuality >= 0 &&
        parsedQuality <= 1
          ? parsedQuality
          : 0;

      return { language: language.trim().toLowerCase(), quality, index };
    })
    .filter(({ language, quality }) => language.length > 0 && quality > 0)
    .sort(
      (left, right) => right.quality - left.quality || left.index - right.index,
    );

  for (const { language } of preferences) {
    const normalized = language.split(/[-_]/, 1)[0];

    if (normalized === 'ckb') {
      return 'ku';
    }

    for (const locale of API_SUPPORTED_LOCALES) {
      if (normalized === locale) {
        return locale;
      }
    }
  }

  return 'ku';
}

export function translateApiError(
  code: ApiErrorCode,
  locale: ApiLocale,
): string {
  return apiTranslations[locale].errors[code];
}

export function apiLocaleMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const locale = resolveApiLocale(request.headers['accept-language']);

  response.setHeader('Content-Language', locale);
  next();
}
