import type { Locale } from "@odookrd/types";

/**
 * Interface chrome shared by every dictionary.
 *
 * These read identically in all three locales wherever they appear, so they
 * are authored once here and referenced from the domain dictionaries. Domain
 * enum labels (PENDING, SUSPENDED, DRAFT) are deliberately NOT shared: they
 * render the same today but belong to unrelated enums, and coupling them
 * would mean rewording one silently reworded the other.
 */
export interface UiChrome {
  actions: string;
  apply: string;
  changeStatus: string;
  close: string;
  custom: string;
  disabled: string;
  duration: string;
  edit: string;
  enabled: string;
  filter: string;
  logo: string;
  next: string;
  previous: string;
  view: string;
}

const en: UiChrome = {
  actions: "Actions",
  apply: "Apply",
  changeStatus: "Change status",
  close: "Close",
  custom: "Custom",
  disabled: "Disabled",
  duration: "Duration",
  edit: "Edit",
  enabled: "Enabled",
  filter: "Filter",
  logo: "Logo",
  next: "Next",
  previous: "Previous",
  view: "View",
};

const ku: UiChrome = {
  actions: "کردارەکان",
  apply: "جێبەجێکردن",
  changeStatus: "گۆڕینی دۆخ",
  close: "داخستن",
  custom: "تایبەت",
  disabled: "ناچالاک",
  duration: "ماوە",
  edit: "دەستکاری",
  enabled: "چالاک",
  filter: "پاڵاوتن",
  logo: "لۆگۆ",
  next: "دواتر",
  previous: "پێشوو",
  view: "بینین",
};

const ar: UiChrome = {
  actions: "الإجراءات",
  apply: "تطبيق",
  changeStatus: "تغيير الحالة",
  close: "إغلاق",
  custom: "مخصص",
  disabled: "معطّل",
  duration: "المدة",
  edit: "تعديل",
  enabled: "مفعّل",
  filter: "تصفية",
  logo: "الشعار",
  next: "التالي",
  previous: "السابق",
  view: "عرض",
};

export const uiChrome: Record<Locale, UiChrome> = { ku, ar, en };
