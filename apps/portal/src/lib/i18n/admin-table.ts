import type { Locale } from "@odookrd/types";

export interface AdminTableDictionary {
  search: string;
  selectAll: string;
  selectRow: string;
  selected: string;
  clearSelection: string;
  batchAction: string;
  apply: string;
  confirmBatch: string;
  completed: string;
  failed: string;
}

export const adminTableDictionaries: Record<Locale, AdminTableDictionary> = {
  ku: {
    search: "گەڕان لەم پەڕەیە",
    selectAll: "هەڵبژاردنی هەموو ڕیزە دیارەکان",
    selectRow: "هەڵبژاردنی ڕیز",
    selected: "هەڵبژێردراو",
    clearSelection: "پاککردنەوەی هەڵبژاردن",
    batchAction: "کرداری کۆمەڵەیی",
    apply: "جێبەجێکردن",
    confirmBatch: "دڵنیایت لە جێبەجێکردنی {action} بۆ {count} ڕیز؟",
    completed: "کردارەکە بە سەرکەوتوویی تەواو بوو.",
    failed: "کردارەکە تەواو نەبوو.",
  },
  ar: {
    search: "بحث في هذه الصفحة",
    selectAll: "تحديد كل الصفوف الظاهرة",
    selectRow: "تحديد الصف",
    selected: "محدد",
    clearSelection: "مسح التحديد",
    batchAction: "إجراء جماعي",
    apply: "تطبيق",
    confirmBatch: "هل تريد تنفيذ {action} على {count} صفوف؟",
    completed: "اكتمل الإجراء بنجاح.",
    failed: "تعذر إكمال الإجراء.",
  },
  en: {
    search: "Search this page",
    selectAll: "Select all visible rows",
    selectRow: "Select row",
    selected: "selected",
    clearSelection: "Clear selection",
    batchAction: "Batch action",
    apply: "Apply",
    confirmBatch: "Apply {action} to {count} selected rows?",
    completed: "The action completed successfully.",
    failed: "The action could not be completed.",
  },
};
