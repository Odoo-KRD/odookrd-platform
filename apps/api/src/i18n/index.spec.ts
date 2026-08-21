import {
  API_ERROR_CODES,
  apiTranslations,
  resolveApiLocale,
  translateApiError,
} from './index';

describe('API localization foundation', () => {
  it('defaults to Kurdish when no supported language is provided', () => {
    expect(resolveApiLocale(undefined)).toBe('ku');
    expect(resolveApiLocale('fr-FR, tr-TR')).toBe('ku');
  });

  it('normalizes Kurdish Sorani, Arabic, and English regional variants', () => {
    expect(resolveApiLocale('ckb-IQ')).toBe('ku');
    expect(resolveApiLocale('ku-IQ')).toBe('ku');
    expect(resolveApiLocale('ar-IQ')).toBe('ar');
    expect(resolveApiLocale('en-GB')).toBe('en');
  });

  it('honors language quality weights and rejects disabled preferences', () => {
    expect(resolveApiLocale('en;q=0.4, ar-IQ;q=0.9')).toBe('ar');
    expect(resolveApiLocale('ar;q=0, en;q=0.8')).toBe('en');
    expect(resolveApiLocale(['fr-FR', 'en-US;q=0.7'])).toBe('en');
  });

  it('keeps stable API error identifiers translated in every locale', () => {
    for (const locale of ['ku', 'ar', 'en'] as const) {
      for (const code of Object.values(API_ERROR_CODES)) {
        expect(translateApiError(code, locale).trim()).not.toBe('');
      }
    }
  });

  it('reserves complete notification translations for the upcoming delivery stage', () => {
    const expected = Object.keys(apiTranslations.ku.notifications).sort();

    expect(Object.keys(apiTranslations.ar.notifications).sort()).toEqual(
      expected,
    );
    expect(Object.keys(apiTranslations.en.notifications).sort()).toEqual(
      expected,
    );
  });
});
