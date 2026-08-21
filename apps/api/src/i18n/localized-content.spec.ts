import {
  localizeResponse,
  normalizeLocalizedText,
  resolveLocalizedText,
} from './localized-content';

describe('Multilingual database content', () => {
  it('preserves all supplied languages and trims their values', () => {
    expect(
      normalizeLocalizedText(
        { ku: '  کۆمپانیا  ', ar: ' شركة ', en: ' Company ' },
        'Legacy company',
      ),
    ).toEqual({ ku: 'کۆمپانیا', ar: 'شركة', en: 'Company' });
  });

  it('backfills the legacy value only when Kurdish is missing', () => {
    expect(normalizeLocalizedText({ en: 'Company' }, 'کۆمپانیا')).toEqual({
      en: 'Company',
      ku: 'کۆمپانیا',
    });
  });

  it('keeps nullable descriptions and service labels genuinely optional', () => {
    expect(normalizeLocalizedText(undefined, null)).toEqual({});
    expect(resolveLocalizedText({}, 'en', null)).toBeNull();
  });

  it('prefers the requested language before the Kurdish fallback', () => {
    const translations = { ku: 'کۆمپانیا', ar: 'الشركة', en: 'Company' };

    expect(resolveLocalizedText(translations, 'en', 'Legacy')).toBe('Company');
    expect(resolveLocalizedText(translations, 'ar', 'Legacy')).toBe('الشركة');
    expect(resolveLocalizedText(translations, 'ku', 'Legacy')).toBe('کۆمپانیا');
  });

  it('falls back to Kurdish and then the legacy value without empty labels', () => {
    expect(resolveLocalizedText({ ku: 'کۆمپانیا' }, 'en', 'Legacy')).toBe(
      'کۆمپانیا',
    );
    expect(resolveLocalizedText({ en: '   ' }, 'en', 'Legacy')).toBe('Legacy');
  });

  it('localizes nested company assignments without exposing new fields', () => {
    const response = localizeResponse(
      {
        items: [
          {
            displayName: 'خزمەتگوزاری',
            displayNameTranslations: { ku: 'خزمەتگوزاری', en: 'My service' },
            company: {
              id: 'company-id',
              name: 'کۆمپانیا',
              nameTranslations: { ku: 'کۆمپانیا', en: 'Company' },
            },
            service: {
              name: 'ئۆدۆ',
              nameTranslations: { ku: 'ئۆدۆ', en: 'Odoo' },
              description: 'وەسف',
              descriptionTranslations: { ku: 'وەسف', en: 'Description' },
            },
          },
        ],
      },
      'en',
    );

    expect(response).toEqual({
      items: [
        {
          displayName: 'My service',
          displayNameTranslations: { ku: 'خزمەتگوزاری', en: 'My service' },
          company: {
            id: 'company-id',
            name: 'Company',
            nameTranslations: { ku: 'کۆمپانیا', en: 'Company' },
          },
          service: {
            name: 'Odoo',
            nameTranslations: { ku: 'ئۆدۆ', en: 'Odoo' },
            description: 'Description',
            descriptionTranslations: { ku: 'وەسف', en: 'Description' },
          },
        },
      ],
    });
  });

  it('preserves dates, ordinary responses, and existing untranslated records', () => {
    const createdAt = new Date('2026-08-22T00:00:00.000Z');

    expect(
      localizeResponse({ name: 'Existing company', createdAt }, 'ar'),
    ).toEqual({
      name: 'Existing company',
      createdAt,
    });
  });
});
