import type { Locale } from "@odookrd/types";

export interface SharedActions {
  moveDown: string;
  moveUp: string;
  remove: string;
  retry: string;
  saving: string;
}

const en: SharedActions = {
  moveDown: "Move down",
  moveUp: "Move up",
  remove: "Remove",
  retry: "Try again",
  saving: "Saving...",
};

const ku: SharedActions = {
  moveDown: "نزمکردنەوە",
  moveUp: "بەرزکردنەوە",
  remove: "لابردن",
  retry: "دووبارە هەوڵدانەوە",
  saving: "پاشەکەوت دەکرێت...",
};

const ar: SharedActions = {
  moveDown: "تحريك للأسفل",
  moveUp: "تحريك للأعلى",
  remove: "إزالة",
  retry: "إعادة المحاولة",
  saving: "جارٍ الحفظ...",
};

export const sharedActions: Record<Locale, SharedActions> = { ku, ar, en };
