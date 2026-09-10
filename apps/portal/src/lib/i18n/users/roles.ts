import type { Locale } from "@odookrd/types";

import { uiChrome } from "../ui-chrome";
import { sharedText } from "../shared";

export interface RoleAdministrationDictionary {
  create: string;
  createTitle: string;
  createDescription: string;
  edit: string;
  editTitle: string;
  editDescription: string;
  details: string;
  key: string;
  keyHint: string;
  name: string;
  description: string;
  scope: string;
  platform: string;
  company: string;
  type: string;
  status: string;
  active: string;
  archived: string;
  system: string;
  custom: string;
  permissions: string;
  permissionSearch: string;
  noPermissionMatches: string;
  assignedUsers: string;
  save: string;
  saving: string;
  delete: string;
  deleting: string;
  deleteConfirm: string;
  systemProtected: string;
  immutableFields: string;
  back: string;
  view: string;
  roleSearch: string;
  noRoleMatches: string;
}

export const roleAdministrationDictionaries: Record<
  Locale,
  RoleAdministrationDictionary
> = {
  ku: {
    create: "دروستکردنی ڕۆڵ",
    createTitle: "ڕۆڵی نوێ",
    createDescription: "ڕۆڵێکی تایبەت و ڕێگەپێدانەکانی دروست بکە.",
    edit: uiChrome.ku.edit,
    editTitle: "دەستکاریی ڕۆڵ",
    editDescription: "ناو، وەسف و ڕێگەپێدانەکانی ڕۆڵەکە بگۆڕە.",
    details: "وردەکاری",
    key: "کلیلی سیستەم",
    keyHint: "پیتی بچووک، ژمارە و _ بەکاربهێنە؛ دوای دروستکردن ناگۆڕدرێت.",
    name: "ناوی ڕۆڵ",
    description: "وەسف",
    scope: sharedText.ku.labels.scope,
    platform: "پلاتفۆرم",
    company: "کۆمپانیا",
    type: sharedText.ku.labels.type,
    status: "دۆخ",
    active: sharedText.ku.status.active,
    archived: sharedText.ku.status.archived,
    system: "سیستەم",
    custom: uiChrome.ku.custom,
    permissions: sharedText.ku.labels.permissions,
    permissionSearch: "گەڕان لە ڕێگەپێدانەکان",
    noPermissionMatches: "هیچ ڕێگەپێدانێک نەدۆزرایەوە.",
    assignedUsers: "بەکارهێنەری تەرخانکراو",
    save: "پاشەکەوتکردنی ڕۆڵ",
    saving: sharedText.ku.actions.saving,
    delete: "سڕینەوەی ڕۆڵ",
    deleting: "سڕینەوە...",
    deleteConfirm: "دڵنیایت لە سڕینەوەی ئەم ڕۆڵە؟",
    systemProtected:
      "ڕۆڵەکانی سیستەم پارێزراون و ناتوانرێت دەستکاری یان بسڕدرێنەوە.",
    immutableFields: "کلیل و مەودای ڕۆڵ دوای دروستکردن ناگۆڕدرێن.",
    back: "گەڕانەوە",
    view: uiChrome.ku.view,
    roleSearch: "گەڕان لە ڕۆڵەکان",
    noRoleMatches: "هیچ ڕۆڵێک لەگەڵ گەڕانەکە ناگونجێت.",
  },
  ar: {
    create: "إنشاء دور",
    createTitle: "دور جديد",
    createDescription: "أنشئ دوراً مخصصاً وحدد صلاحياته.",
    edit: uiChrome.ar.edit,
    editTitle: "تعديل الدور",
    editDescription: "غيّر اسم الدور ووصفه وصلاحياته.",
    details: "التفاصيل",
    key: "مفتاح النظام",
    keyHint: "استخدم أحرفاً صغيرة وأرقاماً و _؛ لا يمكن تغييره بعد الإنشاء.",
    name: "اسم الدور",
    description: "الوصف",
    scope: sharedText.ar.labels.scope,
    platform: "المنصة",
    company: "الشركة",
    type: sharedText.ar.labels.type,
    status: "الحالة",
    active: sharedText.ar.status.active,
    archived: sharedText.ar.status.archived,
    system: "نظام",
    custom: uiChrome.ar.custom,
    permissions: sharedText.ar.labels.permissions,
    permissionSearch: "بحث في الصلاحيات",
    noPermissionMatches: "لا توجد صلاحيات مطابقة.",
    assignedUsers: "المستخدمون المعينون",
    save: "حفظ الدور",
    saving: sharedText.ar.actions.saving,
    delete: "حذف الدور",
    deleting: "جارٍ الحذف...",
    deleteConfirm: "هل أنت متأكد من حذف هذا الدور؟",
    systemProtected: "أدوار النظام محمية ولا يمكن تعديلها أو أرشفتها أو حذفها.",
    immutableFields: "مفتاح الدور ونطاقه لا يتغيران بعد الإنشاء.",
    back: "رجوع",
    view: uiChrome.ar.view,
    roleSearch: "بحث في الأدوار",
    noRoleMatches: "لا توجد أدوار مطابقة للبحث.",
  },
  en: {
    create: "Create role",
    createTitle: "New role",
    createDescription: "Create a custom role and choose its permissions.",
    edit: uiChrome.en.edit,
    editTitle: "Edit role",
    editDescription: "Change the role name, description, and permissions.",
    details: "Details",
    key: "System key",
    keyHint:
      "Use lowercase letters, numbers, and _; it cannot change after creation.",
    name: "Role name",
    description: "Description",
    scope: sharedText.en.labels.scope,
    platform: "Platform",
    company: "Company",
    type: sharedText.en.labels.type,
    status: "Status",
    active: sharedText.en.status.active,
    archived: sharedText.en.status.archived,
    system: "System",
    custom: uiChrome.en.custom,
    permissions: sharedText.en.labels.permissions,
    permissionSearch: "Search permissions",
    noPermissionMatches: "No permissions match the search.",
    assignedUsers: "Assigned users",
    save: "Save role",
    saving: sharedText.en.actions.saving,
    delete: "Delete role",
    deleting: "Deleting...",
    deleteConfirm: "Are you sure you want to delete this role?",
    systemProtected:
      "System roles are protected and cannot be edited, archived, or deleted.",
    immutableFields: "The role key and scope cannot change after creation.",
    back: "Back",
    view: uiChrome.en.view,
    roleSearch: "Search roles",
    noRoleMatches: "No roles match the search.",
  },
};
