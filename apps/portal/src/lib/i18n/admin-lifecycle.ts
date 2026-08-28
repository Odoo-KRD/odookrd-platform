import type { Locale } from "@odookrd/types";

export interface AdminLifecycleLabels {
  view: string;
  edit: string;
  archive: string;
  restore: string;
  delete: string;
  cancel: string;
  confirm: string;
  archiveTitle: string;
  archiveDescription: string;
  restoreTitle: string;
  restoreDescription: string;
  deleteTitle: string;
  deleteDescription: string;
  failed: string;
}

export const adminLifecycleDictionaries: Record<Locale, AdminLifecycleLabels> =
  {
    ku: {
      view: "بینین",
      edit: "دەستکاری",
      archive: "ئەرشیفکردن",
      restore: "گەڕاندنەوە",
      delete: "سڕینەوە",
      cancel: "پاشگەزبوونەوە",
      confirm: "دڵنیام",
      archiveTitle: "ئەرشیفکردن",
      archiveDescription:
        'ئایا دڵنیایت دەتەوێت "{name}" ئەرشیف بکەیت؟ داتا هەر دەپارێزرێت.',
      restoreTitle: "گەڕاندنەوە",
      restoreDescription:
        'ئایا دڵنیایت دەتەوێت "{name}" بگەڕێنیتەوە بۆ دۆخی چالاک؟',
      deleteTitle: "سڕینەوەی هەمیشەیی",
      deleteDescription:
        'ئایا دڵنیایت دەتەوێت "{name}" بە هەمیشەیی بسڕیتەوە؟ ئەم کردارە ناگەڕێتەوە و تەنها کاتێک ڕێگەپێدراوە کە هیچ داتای پەیوەست نەبێت.',
      failed: "کردارەکە تەواو نەبوو.",
    },
    ar: {
      view: "عرض",
      edit: "تعديل",
      archive: "أرشفة",
      restore: "استعادة",
      delete: "حذف",
      cancel: "إلغاء",
      confirm: "تأكيد",
      archiveTitle: "أرشفة",
      archiveDescription: 'هل تريد أرشفة "{name}"؟ ستبقى البيانات محفوظة.',
      restoreTitle: "استعادة",
      restoreDescription: 'هل تريد استعادة "{name}"؟',
      deleteTitle: "حذف نهائي",
      deleteDescription:
        'هل تريد حذف "{name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء، ولا يُسمح به عند وجود بيانات مرتبطة.',
      failed: "تعذر إكمال الإجراء.",
    },
    en: {
      view: "View",
      edit: "Edit",
      archive: "Archive",
      restore: "Restore",
      delete: "Delete",
      cancel: "Cancel",
      confirm: "Confirm",
      archiveTitle: "Archive",
      archiveDescription: 'Archive "{name}"? Its data will remain preserved.',
      restoreTitle: "Restore",
      restoreDescription: 'Restore "{name}"?',
      deleteTitle: "Delete permanently",
      deleteDescription:
        'Permanently delete "{name}"? This cannot be undone and is allowed only when no dependent platform data exists.',
      failed: "The action could not be completed.",
    },
  };
