import type { PluralPhrase } from "@/lib/i18n/plural";

/**
 * Count-bearing phrases.
 *
 * `#` is replaced by the number. Arabic supplies all six CLDR categories
 * because it genuinely distinguishes them; Kurdish and English need only two.
 *
 * Kurdish keeps the noun in the singular after a numeral, so `one` and `other`
 * read the same. That is correct rather than an oversight — the helper still
 * routes through Intl.PluralRules, so the day a locale is added that behaves
 * differently, nothing here has to change.
 */

export const recordsPhrase: PluralPhrase = {
  en: { one: "# record", other: "# records" },
  ku: { one: "# تۆمار", other: "# تۆمار" },
  ar: {
    zero: "لا سجلات",
    one: "سجل واحد",
    two: "سجلان",
    few: "# سجلات",
    many: "# سجلًا",
    other: "# سجل",
  },
};

export const unreadPhrase: PluralPhrase = {
  en: { one: "# unread", other: "# unread" },
  ku: { one: "# نەخوێندراو", other: "# نەخوێندراو" },
  ar: {
    zero: "لا إشعارات غير مقروءة",
    one: "إشعار واحد غير مقروء",
    two: "إشعاران غير مقروءين",
    few: "# إشعارات غير مقروءة",
    many: "# إشعارًا غير مقروء",
    other: "# إشعار غير مقروء",
  },
};

export const selectedPhrase: PluralPhrase = {
  en: { one: "# selected", other: "# selected" },
  ku: { one: "# دیاریکراو", other: "# دیاریکراو" },
  ar: {
    zero: "لا عناصر محددة",
    one: "عنصر واحد محدد",
    two: "عنصران محددان",
    few: "# عناصر محددة",
    many: "# عنصرًا محددًا",
    other: "# عنصر محدد",
  },
};

export const questionsPhrase: PluralPhrase = {
  en: { one: "# question", other: "# questions" },
  ku: { one: "# پرسیار", other: "# پرسیار" },
  ar: {
    zero: "لا أسئلة",
    one: "سؤال واحد",
    two: "سؤالان",
    few: "# أسئلة",
    many: "# سؤالًا",
    other: "# سؤال",
  },
};
