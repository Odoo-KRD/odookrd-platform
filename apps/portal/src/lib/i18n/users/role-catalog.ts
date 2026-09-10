import type { Locale } from "@odookrd/types";

import type { RoleCatalogDictionary } from "../types";

export type { RoleCatalogDictionary } from "../types";

const en = {
  title: "Roles",
  description: "Review available roles and their assigned permissions.",
  readOnly: "Roles are read-only here. Assignments are managed from Users.",
  name: "Role",
  scope: "Scope",
  permissions: "Permissions",
  noPermissions: "No permissions assigned",
  emptyTitle: "No roles available",
  emptyDescription: "No roles are available for the current account.",
  platform: "Platform",
  company: "Company",
  platformAdmin: "Platform administrator",
  companyAdmin: "Company administrator",
  companyUser: "Company user",
} satisfies RoleCatalogDictionary;

const ku = {
  title: "ڕۆڵەکان",
  description: "ڕۆڵە بەردەستەکان و ڕێگەپێدانەکانیان ببینە.",
  readOnly:
    "ڕۆڵەکان تەنها بۆ بینینن. تەرخانکردنیان لە بەشی بەکارهێنەران ئەنجام دەدرێت.",
  name: "ڕۆڵ",
  scope: "مەودا",
  permissions: "ڕێگەپێدانەکان",
  noPermissions: "هیچ ڕێگەپێدانێک نییە",
  emptyTitle: "هیچ ڕۆڵێک بەردەست نییە",
  emptyDescription: "هیچ ڕۆڵێک بۆ ئەم هەژمارە نەدۆزرایەوە.",
  platform: "پلاتفۆرم",
  company: "کۆمپانیا",
  platformAdmin: "بەڕێوەبەری پلاتفۆرم",
  companyAdmin: "بەڕێوەبەری کۆمپانیا",
  companyUser: "بەکارهێنەری کۆمپانیا",
} satisfies RoleCatalogDictionary;

const ar = {
  title: "الأدوار",
  description: "عرض الأدوار المتاحة والصلاحيات المرتبطة بها.",
  readOnly: "الأدوار للعرض فقط. يتم تعيينها من قسم المستخدمين.",
  name: "الدور",
  scope: "النطاق",
  permissions: "الصلاحيات",
  noPermissions: "لا توجد صلاحيات",
  emptyTitle: "لا توجد أدوار متاحة",
  emptyDescription: "لم يتم العثور على أدوار لهذا الحساب.",
  platform: "المنصة",
  company: "الشركة",
  platformAdmin: "مدير المنصة",
  companyAdmin: "مدير الشركة",
  companyUser: "مستخدم الشركة",
} satisfies RoleCatalogDictionary;

export const roleCatalogDictionaries: Record<Locale, RoleCatalogDictionary> = {
  ku,
  ar,
  en,
};
