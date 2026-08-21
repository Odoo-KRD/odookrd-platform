import type { Locale } from "@odookrd/types";

export interface AdminDictionary {
  navigation: {
    label: string;
    overview: string;
    companies: string;
    myCompany: string;
    users: string;
    roles: string;
    platformAdministration: string;
    companyAdministration: string;
  };
  overview: {
    title: string;
    description: string;
    companiesDescription: string;
    companyDescription: string;
    usersDescription: string;
    rolesDescription: string;
    openSection: string;
  };
  companies: {
    title: string;
    description: string;
    ownDescription: string;
    create: string;
    createTitle: string;
    createDescription: string;
    detailsTitle: string;
    editTitle: string;
    name: string;
    status: string;
    created: string;
    updated: string;
    actions: string;
    view: string;
    save: string;
    saving: string;
    cancel: string;
    changeStatus: string;
    applyStatus: string;
    statusActive: string;
    statusSuspended: string;
    statusArchived: string;
    allStatuses: string;
    emptyTitle: string;
    emptyDescription: string;
    archiveConfirmation: string;
    previous: string;
    next: string;
    records: string;
  };
  roles: {
    title: string;
    description: string;
    readOnly: string;
    name: string;
    scope: string;
    permissions: string;
    noPermissions: string;
    emptyTitle: string;
    emptyDescription: string;
    platform: string;
    company: string;
    platformAdmin: string;
    companyAdmin: string;
    companyUser: string;
  };
  users: {
    title: string;
    nextStep: string;
  };
}

export const adminDictionaries: Record<Locale, AdminDictionary> = {
  ku: {
    navigation: {
      label: "بەڕێوەبردن",
      overview: "گشتی",
      companies: "کۆمپانیاکان",
      myCompany: "کۆمپانیاکەم",
      users: "بەکارهێنەران",
      roles: "ڕۆڵەکان",
      platformAdministration: "بەڕێوەبردنی پلاتفۆرم",
      companyAdministration: "بەڕێوەبردنی کۆمپانیا",
    },
    overview: {
      title: "بەڕێوەبردن",
      description: "بەڕێوەبردنی کۆمپانیا، بەکارهێنەر و دەسەڵاتەکان.",
      companiesDescription: "بینین و بەڕێوەبردنی کۆمپانیا تۆمارکراوەکان.",
      companyDescription: "بینین و نوێکردنەوەی زانیارییەکانی کۆمپانیاکەت.",
      usersDescription: "بەڕێوەبردنی هەژمار و بانگهێشتەکان.",
      rolesDescription: "بینینی ڕۆڵەکان و ڕێگەپێدانەکانیان.",
      openSection: "کردنەوە",
    },
    companies: {
      title: "کۆمپانیاکان",
      description: "بەڕێوەبردنی کۆمپانیاکان و دۆخی هەژمارەکانیان.",
      ownDescription: "زانیارییەکانی کۆمپانیاکەت ببینە و نوێی بکەرەوە.",
      create: "زیادکردنی کۆمپانیا",
      createTitle: "کۆمپانیای نوێ",
      createDescription: "کۆمپانیایەکی نوێ لە پلاتفۆرمەکەدا دروست بکە.",
      detailsTitle: "وردەکارییەکانی کۆمپانیا",
      editTitle: "دەستکاریی زانیارییەکان",
      name: "ناوی کۆمپانیا",
      status: "دۆخ",
      created: "دروستکراوە",
      updated: "نوێکراوەتەوە",
      actions: "کردارەکان",
      view: "بینین",
      save: "پاشەکەوتکردن",
      saving: "پاشەکەوتکردن...",
      cancel: "پاشگەزبوونەوە",
      changeStatus: "گۆڕینی دۆخ",
      applyStatus: "جێبەجێکردن",
      statusActive: "چالاک",
      statusSuspended: "ڕاگیراو",
      statusArchived: "ئەرشیفکراو",
      allStatuses: "هەموو دۆخەکان",
      emptyTitle: "هیچ کۆمپانیایەک نەدۆزرایەوە",
      emptyDescription: "هیچ کۆمپانیایەک لەم دۆخەدا بەردەست نییە.",
      archiveConfirmation: "دڵنیایت لە ئەرشیفکردنی ئەم کۆمپانیایە؟",
      previous: "پێشوو",
      next: "دواتر",
      records: "تۆمار",
    },
    roles: {
      title: "ڕۆڵەکان",
      description: "ڕۆڵە بەردەستەکان و ڕێگەپێدانەکانیان ببینە.",
      readOnly: "ڕۆڵەکان تەنها بۆ بینینن. تەرخانکردنیان لە بەشی بەکارهێنەران ئەنجام دەدرێت.",
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
    },
    users: {
      title: "بەکارهێنەران",
      nextStep: "بەڕێوەبردنی بەکارهێنەران و بانگهێشتەکان لە هەنگاوی داهاتوودا زیاد دەکرێت.",
    },
  },
  ar: {
    navigation: {
      label: "الإدارة",
      overview: "نظرة عامة",
      companies: "الشركات",
      myCompany: "شركتي",
      users: "المستخدمون",
      roles: "الأدوار",
      platformAdministration: "إدارة المنصة",
      companyAdministration: "إدارة الشركة",
    },
    overview: {
      title: "الإدارة",
      description: "إدارة الشركات والمستخدمين والصلاحيات.",
      companiesDescription: "عرض الشركات المسجلة وإدارتها.",
      companyDescription: "عرض معلومات شركتك وتحديثها.",
      usersDescription: "إدارة الحسابات والدعوات.",
      rolesDescription: "عرض الأدوار والصلاحيات المرتبطة بها.",
      openSection: "فتح القسم",
    },
    companies: {
      title: "الشركات",
      description: "إدارة الشركات وحالة حساباتها.",
      ownDescription: "عرض معلومات شركتك وتحديثها.",
      create: "إضافة شركة",
      createTitle: "شركة جديدة",
      createDescription: "إنشاء شركة جديدة على المنصة.",
      detailsTitle: "تفاصيل الشركة",
      editTitle: "تعديل المعلومات",
      name: "اسم الشركة",
      status: "الحالة",
      created: "تاريخ الإنشاء",
      updated: "آخر تحديث",
      actions: "الإجراءات",
      view: "عرض",
      save: "حفظ",
      saving: "جارٍ الحفظ...",
      cancel: "إلغاء",
      changeStatus: "تغيير الحالة",
      applyStatus: "تطبيق",
      statusActive: "نشطة",
      statusSuspended: "موقوفة",
      statusArchived: "مؤرشفة",
      allStatuses: "جميع الحالات",
      emptyTitle: "لا توجد شركات",
      emptyDescription: "لا توجد شركات مطابقة للحالة المحددة.",
      archiveConfirmation: "هل أنت متأكد من أرشفة هذه الشركة؟",
      previous: "السابق",
      next: "التالي",
      records: "سجل",
    },
    roles: {
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
    },
    users: {
      title: "المستخدمون",
      nextStep: "ستتوفر إدارة المستخدمين والدعوات في الخطوة التالية.",
    },
  },
  en: {
    navigation: {
      label: "Administration",
      overview: "Overview",
      companies: "Companies",
      myCompany: "My company",
      users: "Users",
      roles: "Roles",
      platformAdministration: "Platform administration",
      companyAdministration: "Company administration",
    },
    overview: {
      title: "Administration",
      description: "Manage companies, user accounts, and access permissions.",
      companiesDescription: "Review and manage registered customer companies.",
      companyDescription: "Review and update your company's information.",
      usersDescription: "Manage individual accounts and invitations.",
      rolesDescription: "Review available roles and their permissions.",
      openSection: "Open section",
    },
    companies: {
      title: "Companies",
      description: "Manage customer companies and their account status.",
      ownDescription: "Review and update your company's information.",
      create: "Add company",
      createTitle: "New company",
      createDescription: "Create a customer company on the platform.",
      detailsTitle: "Company details",
      editTitle: "Edit company information",
      name: "Company name",
      status: "Status",
      created: "Created",
      updated: "Updated",
      actions: "Actions",
      view: "View",
      save: "Save changes",
      saving: "Saving...",
      cancel: "Cancel",
      changeStatus: "Change status",
      applyStatus: "Apply status",
      statusActive: "Active",
      statusSuspended: "Suspended",
      statusArchived: "Archived",
      allStatuses: "All statuses",
      emptyTitle: "No companies found",
      emptyDescription: "There are no companies matching the selected status.",
      archiveConfirmation: "Are you sure you want to archive this company?",
      previous: "Previous",
      next: "Next",
      records: "records",
    },
    roles: {
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
    },
    users: {
      title: "Users",
      nextStep: "User management and invitations will be added in the next step.",
    },
  },
};
