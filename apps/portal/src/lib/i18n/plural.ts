import type { Locale } from "@odookrd/types";

import { LOCALE_METADATA } from "@/lib/i18n/config";

/**
 * Plural selection.
 *
 * Counts were previously rendered by concatenation — `{count} {noun}` — which
 * is correct in English by accident and wrong in Arabic almost always. Arabic
 * distinguishes six plural categories, so "1 إشعار", "2 إشعار" and "11 إشعار"
 * all need different wording.
 *
 * The categories come from Intl.PluralRules rather than hand-written rules, so
 * they follow CLDR and stay correct if a locale is added later.
 */

/** Kurdish and English distinguish singular from everything else. */
export interface SimplePluralForms {
  one: string;
  other: string;
}

/** Arabic distinguishes all six CLDR categories. */
export interface ArabicPluralForms {
  zero: string;
  one: string;
  two: string;
  few: string;
  many: string;
  other: string;
}

/**
 * A count-bearing phrase in every locale.
 *
 * The shape is per-locale on purpose: TypeScript then requires all six Arabic
 * forms and rejects an Arabic entry that only supplies singular and plural.
 */
export interface PluralPhrase {
  ku: SimplePluralForms;
  ar: ArabicPluralForms;
  en: SimplePluralForms;
}

const pluralRules: Partial<Record<Locale, Intl.PluralRules>> = {};

function rulesFor(locale: Locale): Intl.PluralRules {
  const cached = pluralRules[locale];

  if (cached) {
    return cached;
  }

  const created = new Intl.PluralRules(LOCALE_METADATA[locale].dateLocale);
  pluralRules[locale] = created;

  return created;
}

/**
 * Resolves a phrase for a count, replacing `#` with the number.
 *
 * Falls back to `other` when a locale's rules select a category the phrase does
 * not define, which cannot happen for the shapes above but keeps the function
 * total rather than throwing in front of a customer.
 */
export function plural(
  phrase: PluralPhrase,
  locale: Locale,
  count: number,
): string {
  const forms = phrase[locale] as Partial<Record<Intl.LDMLPluralRule, string>>;
  const category = rulesFor(locale).select(count);
  const template = forms[category] ?? forms.other ?? "";

  return template.replaceAll("#", String(count));
}
