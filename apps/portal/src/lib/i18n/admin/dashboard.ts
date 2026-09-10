import type { Locale } from "@odookrd/types";
import { sharedText } from "../shared";

export interface AdminDashboardDictionary {
  customize: string;
  done: string;
  hiddenSections: string;
  restore: string;
  hide: string;
  collapse: string;
  expand: string;
  moveUp: string;
  moveDown: string;
  drag: string;
  reset: string;
  saved: string;
  saveFailed: string;
}

export const adminDashboardDictionaries: Record<
  Locale,
  AdminDashboardDictionary
> = {
  ku: {
    customize: "ڕێکخستنی داشبۆرد",
    done: "تەواو",
    hiddenSections: "بەشە شاردراوەکان",
    restore: sharedText.ku.labels.restore,
    hide: "شاردنەوە",
    collapse: "کورتکردنەوە",
    expand: "فراوانکردن",
    moveUp: sharedText.ku.actions.moveUp,
    moveDown: sharedText.ku.actions.moveDown,
    drag: "ڕاکێشان بۆ گۆڕینی شوێن",
    reset: "گەڕاندنەوە بۆ بنەڕەت",
    saved: "ڕێکخستنەکان پاشەکەوت کران.",
    saveFailed: "پاشەکەوتکردنی ڕێکخستنەکان سەرکەوتوو نەبوو.",
  },
  ar: {
    customize: "تخصيص لوحة التحكم",
    done: "تم",
    hiddenSections: "الأقسام المخفية",
    restore: sharedText.ar.labels.restore,
    hide: "إخفاء",
    collapse: "طي",
    expand: "توسيع",
    moveUp: sharedText.ar.actions.moveUp,
    moveDown: sharedText.ar.actions.moveDown,
    drag: "اسحب لتغيير الترتيب",
    reset: "إعادة الافتراضي",
    saved: "تم حفظ تفضيلات لوحة التحكم.",
    saveFailed: "تعذر حفظ تفضيلات لوحة التحكم.",
  },
  en: {
    customize: "Customize dashboard",
    done: "Done",
    hiddenSections: "Hidden sections",
    restore: sharedText.en.labels.restore,
    hide: "Hide",
    collapse: "Collapse",
    expand: "Expand",
    moveUp: sharedText.en.actions.moveUp,
    moveDown: sharedText.en.actions.moveDown,
    drag: "Drag to reorder",
    reset: "Reset layout",
    saved: "Dashboard preferences saved.",
    saveFailed: "Dashboard preferences could not be saved.",
  },
};
