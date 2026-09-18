import {
  buildSearchText,
  slugify,
  uniqueSlug,
  buildSearchTexts,
  normalizeLocalizedTags,
  normalizeSearchInput,
  resolveLocalizedRichText,
  resolveLocalizedTags,
  richTextToPlainText,
  searchColumnFor,
} from './knowledge.rules';

const doc = (...paragraphs: string[]) => ({
  type: 'doc',
  content: paragraphs.map((text) => ({
    type: 'paragraph',
    content: [{ type: 'text', text }],
  })),
});

describe('richTextToPlainText', () => {
  it('flattens nested nodes in document order', () => {
    expect(richTextToPlainText(doc('First line', 'Second line'))).toBe(
      'First line Second line',
    );
  });

  it('separates block boundaries so words do not fuse', () => {
    expect(richTextToPlainText(doc('invoice', 'payment'))).toBe(
      'invoice payment',
    );
  });

  it('collects text carried by marks and inline nodes', () => {
    const value = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and plain' },
          ],
        },
      ],
    };

    expect(richTextToPlainText(value)).toBe('bold and plain');
  });

  it('returns an empty string for null, undefined and empty documents', () => {
    expect(richTextToPlainText(null)).toBe('');
    expect(richTextToPlainText(undefined)).toBe('');
    expect(richTextToPlainText({ type: 'doc', content: [] })).toBe('');
  });
});

describe('normalizeSearchInput', () => {
  it('strips Arabic diacritics so vowelled and unvowelled text match', () => {
    expect(normalizeSearchInput('الدَّفع', 'ar')).toBe(
      normalizeSearchInput('الدفع', 'ar'),
    );
  });

  it('folds hamza carriers and ta marbuta in Arabic', () => {
    expect(normalizeSearchInput('أحمد', 'ar')).toBe('احمد');
    expect(normalizeSearchInput('فاتورة', 'ar')).toBe('فاتوره');
  });

  it('folds Arabic-keyboard letters to their Kurdish counterparts', () => {
    expect(normalizeSearchInput('كوردي', 'ku')).toBe('کوردی');
  });

  it('leaves English untouched', () => {
    expect(normalizeSearchInput('Invoice Payment', 'en')).toBe(
      'Invoice Payment',
    );
  });

  it('is idempotent', () => {
    const once = normalizeSearchInput('الدَّفع', 'ar');

    expect(normalizeSearchInput(once, 'ar')).toBe(once);
  });
});

describe('resolveLocalizedRichText', () => {
  it('prefers the requested locale', () => {
    const value = { en: doc('English'), ku: doc('Kurdish') };

    expect(richTextToPlainText(resolveLocalizedRichText(value, 'en'))).toBe(
      'English',
    );
  });

  it('falls back to another locale when the requested one is missing', () => {
    const value = { ku: doc('Kurdish only') };

    expect(richTextToPlainText(resolveLocalizedRichText(value, 'en'))).toBe(
      'Kurdish only',
    );
  });

  it('returns null when nothing is authored', () => {
    expect(resolveLocalizedRichText({}, 'en')).toBeNull();
  });
});

describe('tags', () => {
  it('resolves tags for a locale with fallback', () => {
    expect(resolveLocalizedTags({ ku: ['پسووڵە'] }, 'en')).toEqual(['پسووڵە']);
  });

  it('returns an empty array rather than null when unset', () => {
    expect(resolveLocalizedTags({}, 'en')).toEqual([]);
    expect(resolveLocalizedTags(null, 'en')).toEqual([]);
  });

  it('trims, drops empties and de-duplicates case-insensitively', () => {
    expect(
      normalizeLocalizedTags(
        { en: ['  VAT ', 'vat', '', 'Invoice'] },
        undefined,
      ),
    ).toEqual({ en: ['VAT', 'Invoice'] });
  });

  it('seeds ku from the fallback when no Kurdish tags are supplied', () => {
    expect(normalizeLocalizedTags({ en: ['VAT'] }, ['باج'])).toEqual({
      en: ['VAT'],
      ku: ['باج'],
    });
  });

  it('ignores a non-string-array payload', () => {
    expect(resolveLocalizedTags({ en: [1, 2] }, 'en')).toEqual([]);
  });
});

describe('buildSearchText', () => {
  const source = {
    title: 'How to pay an invoice',
    titleTranslations: { en: 'How to pay an invoice', ku: 'چۆن پارە بدەیت' },
    excerpt: 'Payment steps',
    excerptTranslations: { en: 'Payment steps' },
    bodyTranslations: { en: doc('Open the portal', 'Choose a method') },
    tagsTranslations: { en: ['invoice', 'payment'] },
  };

  it('includes title, excerpt, tags and body', () => {
    const text = buildSearchText(source, 'en');

    expect(text).toContain('How to pay an invoice');
    expect(text).toContain('Payment steps');
    expect(text).toContain('invoice');
    expect(text).toContain('Open the portal');
    expect(text).toContain('Choose a method');
  });

  it('normalizes the stored text the same way search terms are normalized', () => {
    const text = buildSearchText(
      {
        ...source,
        title: 'الدَّفع',
        titleTranslations: { ar: 'الدَّفع' },
        excerpt: null,
        excerptTranslations: {},
        bodyTranslations: {},
        tagsTranslations: {},
      },
      'ar',
    );

    expect(text).toBe(normalizeSearchInput('الدفع', 'ar'));
  });

  it('collapses whitespace', () => {
    expect(buildSearchText(source, 'en')).not.toMatch(/\s{2,}/);
  });

  it('produces all three locales', () => {
    const texts = buildSearchTexts(source);

    expect(texts.searchTextEn).toContain('invoice');
    expect(texts.searchTextKu).toContain('چۆن');
    expect(typeof texts.searchTextAr).toBe('string');
  });

  it('never returns undefined for an empty article', () => {
    const texts = buildSearchTexts({
      title: '',
      titleTranslations: {},
      excerpt: null,
      excerptTranslations: {},
      bodyTranslations: {},
      tagsTranslations: {},
    });

    expect(texts).toEqual({
      searchTextKu: '',
      searchTextAr: '',
      searchTextEn: '',
    });
  });
});

describe('searchColumnFor', () => {
  it('maps each locale to its column and text search configuration', () => {
    expect(searchColumnFor('en')).toEqual({
      column: 'search_text_en',
      config: 'english',
    });
    expect(searchColumnFor('ar')).toEqual({
      column: 'search_text_ar',
      config: 'arabic',
    });
    expect(searchColumnFor('ku')).toEqual({
      column: 'search_text_ku',
      config: 'simple',
    });
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates English titles', () => {
    expect(slugify('How to pay an invoice')).toBe('how-to-pay-an-invoice');
  });

  it('collapses punctuation and repeated separators', () => {
    expect(slugify('VAT:  what   changed? (2026)')).toBe(
      'vat-what-changed-2026',
    );
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  --hello--  ')).toBe('hello');
  });

  it('transliterates Kurdish to Latin letters', () => {
    expect(slugify('چۆن پارە بدەیت')).toBe('chon-pare-bdeyt');
  });

  it('transliterates Arabic to Latin letters', () => {
    expect(slugify('الدفع')).toBe('aldfa');
  });

  it('maps Eastern Arabic digits to ASCII digits', () => {
    expect(slugify('٢٠٢٦')).toBe('2026');
  });

  it('strips Latin accents', () => {
    expect(slugify('Créer une facture')).toBe('creer-une-facture');
  });

  it('returns an empty string when nothing survives', () => {
    expect(slugify('!!! ???')).toBe('');
  });

  it('never ends with a hyphen after truncation', () => {
    expect(slugify('a'.repeat(300))).not.toMatch(/-$/);
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when it is free', () => {
    expect(uniqueSlug('invoices', new Set())).toBe('invoices');
  });

  it('appends an incrementing suffix on collision', () => {
    expect(uniqueSlug('invoices', new Set(['invoices']))).toBe('invoices-2');
    expect(uniqueSlug('invoices', new Set(['invoices', 'invoices-2']))).toBe(
      'invoices-3',
    );
  });
});
