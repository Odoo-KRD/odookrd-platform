import type { Locale } from "@odookrd/types";

import type { RoleCatalogDictionary } from "../types";
import { sharedText } from "../shared";

export type { RoleCatalogDictionary } from "../types";

const en = {
  title: "Roles",
  description: "Review available roles and their assigned permissions.",
  readOnly: "Roles are read-only here. Assignments are managed from Users.",
  name: "Role",
  scope: sharedText.en.labels.scope,
  permissions: sharedText.en.labels.permissions,
  noPermissions: "No permissions assigned",
  emptyTitle: "No roles available",
  emptyDescription: "No roles are available for the current account.",
  platform: "Platform",
  company: "Company",
  platformAdmin: "Platform administrator",
  companyAdmin: "Company administrator",
  companyUser: sharedText.en.labels.companyUser,
} satisfies RoleCatalogDictionary;

const ku = {
  title: "ڕۆڵەکان",
  description: "ڕۆڵە بەردەستەکان و ڕێگەپێدانەکانیان ببینە.",
  readOnly:
    "ڕۆڵەکان تەنها بۆ بینینن. تەرخانکردنیان لە بەشی بەکارهێنەران ئەنجام دەدرێت.",
  name: "ڕۆڵ",
  scope: sharedText.ku.labels.scope,
  permissions: sharedText.ku.labels.permissions,
  noPermissions: "هیچ ڕێگەپێدانێک نییە",
  emptyTitle: "هیچ ڕۆڵێک بەردەست نییە",
  emptyDescription: "هیچ ڕۆڵێک بۆ ئەم هەژمارە نەدۆزرایەوە.",
  platform: "پلاتفۆرم",
  company: "کۆمپانیا",
  platformAdmin: "بەڕێوەبەری پلاتفۆرم",
  companyAdmin: "بەڕێوەبەری کۆمپانیا",
  companyUser: sharedText.ku.labels.companyUser,
} satisfies RoleCatalogDictionary;

const ar = {
  title: "الأدوار",
  description: "عرض الأدوار المتاحة والصلاحيات المرتبطة بها.",
  readOnly: "الأدوار للعرض فقط. يتم تعيينها من قسم المستخدمين.",
  name: "الدور",
  scope: sharedText.ar.labels.scope,
  permissions: sharedText.ar.labels.permissions,
  noPermissions: "لا توجد صلاحيات",
  emptyTitle: "لا توجد أدوار متاحة",
  emptyDescription: "لم يتم العثور على أدوار لهذا الحساب.",
  platform: "المنصة",
  company: "الشركة",
  platformAdmin: "مدير المنصة",
  companyAdmin: "مدير الشركة",
  companyUser: sharedText.ar.labels.companyUser,
} satisfies RoleCatalogDictionary;

export const roleCatalogDictionaries: Record<Locale, RoleCatalogDictionary> = {
  ku,
  ar,
  en,
};
