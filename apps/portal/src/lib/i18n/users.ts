import type { Locale } from "@odookrd/types";

export interface UsersDictionary {
  title: string;
  description: string;
  ownDescription: string;
  invite: string;
  inviteTitle: string;
  inviteDescription: string;
  detailsTitle: string;
  email: string;
  status: string;
  accountScope: string;
  company: string;
  roles: string;
  created: string;
  updated: string;
  emailVerified: string;
  emailNotVerified: string;
  actions: string;
  view: string;
  platform: string;
  companyAccount: string;
  platformAccount: string;
  chooseCompany: string;
  chooseRoles: string;
  allCompanies: string;
  allStatuses: string;
  statusInvited: string;
  statusActive: string;
  statusSuspended: string;
  saveRoles: string;
  updateStatus: string;
  applyStatus: string;
  save: string;
  saving: string;
  sendInvitation: string;
  creatingInvitation: string;
  cancel: string;
  previous: string;
  next: string;
  records: string;
  emptyTitle: string;
  emptyDescription: string;
  invitationCreated: string;
  invitationDescription: string;
  invitationExpires: string;
  invitationLink: string;
  copyLink: string;
  copied: string;
  confirmPlatformInvitation: string;
  invitationPending: string;
  acceptanceTitle: string;
  acceptanceDescription: string;
  newPassword: string;
  confirmPassword: string;
  passwordHint: string;
  activateAccount: string;
  activatingAccount: string;
  invalidInvitation: string;
  passwordsDoNotMatch: string;
  acceptanceUnavailable: string;
  accountActivated: string;
}

export const usersDictionaries: Record<Locale, UsersDictionary> = {
  ku: {
    title: "بەکارهێنەران",
    description: "بەڕێوەبردنی هەژمارەکان، ڕۆڵەکان و بانگهێشتەکان.",
    ownDescription: "بەڕێوەبردنی بەکارهێنەرانی کۆمپانیاکەت.",
    invite: "بانگهێشتکردنی بەکارهێنەر",
    inviteTitle: "بانگهێشتکردنی بەکارهێنەری نوێ",
    inviteDescription: "هەژمارێک دروست بکە و بەستەری بانگهێشت وەربگرە.",
    detailsTitle: "وردەکارییەکانی بەکارهێنەر",
    email: "ئیمەیڵ",
    status: "دۆخ",
    accountScope: "جۆری هەژمار",
    company: "کۆمپانیا",
    roles: "ڕۆڵەکان",
    created: "دروستکراوە",
    updated: "نوێکراوەتەوە",
    emailVerified: "ئیمەیڵ پشتڕاستکراوەتەوە",
    emailNotVerified: "ئیمەیڵ پشتڕاست نەکراوەتەوە",
    actions: "کردارەکان",
    view: "بینین",
    platform: "پلاتفۆرم",
    companyAccount: "هەژماری کۆمپانیا",
    platformAccount: "هەژماری پلاتفۆرم",
    chooseCompany: "کۆمپانیا هەڵبژێرە",
    chooseRoles: "لانیکەم یەک ڕۆڵ هەڵبژێرە",
    allCompanies: "هەموو کۆمپانیاکان",
    allStatuses: "هەموو دۆخەکان",
    statusInvited: "بانگهێشتکراو",
    statusActive: "چالاک",
    statusSuspended: "ڕاگیراو",
    saveRoles: "پاشەکەوتکردنی ڕۆڵەکان",
    updateStatus: "گۆڕینی دۆخ",
    applyStatus: "جێبەجێکردن",
    save: "پاشەکەوتکردن",
    saving: "پاشەکەوتکردن...",
    sendInvitation: "دروستکردنی بانگهێشت",
    creatingInvitation: "دروستکردنی بانگهێشت...",
    cancel: "پاشگەزبوونەوە",
    previous: "پێشوو",
    next: "دواتر",
    records: "تۆمار",
    emptyTitle: "هیچ بەکارهێنەرێک نەدۆزرایەوە",
    emptyDescription: "هیچ بەکارهێنەرێک بۆ ئەم هەڵبژاردنە بەردەست نییە.",
    invitationCreated: "بانگهێشتەکە دروستکرا",
    invitationDescription: "ئەم بەستەرە تەنها جارێک نیشان دەدرێت. بە شێوەیەکی پارێزراو بینێرە.",
    invitationExpires: "بەسەردەچێت لە",
    invitationLink: "بەستەری بانگهێشت",
    copyLink: "لەبەرگرتنەوەی بەستەر",
    copied: "لەبەرگیراوە",
    confirmPlatformInvitation: "ئەم هەژمارە دەسەڵاتی پلاتفۆرمی دەبێت. دڵنیایت؟",
    invitationPending: "ئەم هەژمارە چاوەڕێی قبووڵکردنی بانگهێشتەکەیە.",
    acceptanceTitle: "چالاککردنی هەژمار",
    acceptanceDescription: "وشەیەکی نهێنی دابنێ بۆ تەواوکردنی بانگهێشتەکەت.",
    newPassword: "وشەی نهێنی نوێ",
    confirmPassword: "دووبارەکردنەوەی وشەی نهێنی",
    passwordHint: "لانیکەم ١٢ پیت بەکاربهێنە.",
    activateAccount: "چالاککردنی هەژمار",
    activatingAccount: "چالاککردنی هەژمار...",
    invalidInvitation: "بەستەری بانگهێشتەکە نادروستە یان بەسەرچووە.",
    passwordsDoNotMatch: "وشە نهێنییەکان یەکسان نین.",
    acceptanceUnavailable: "نەتوانرا بانگهێشتەکە تەواو بکرێت. تکایە دووبارە هەوڵ بدەوە.",
    accountActivated: "هەژمارەکەت چالاککرا. ئێستا دەتوانیت بچیتە ژوورەوە.",
  },
  ar: {
    title: "المستخدمون",
    description: "إدارة الحسابات والأدوار والدعوات.",
    ownDescription: "إدارة مستخدمي شركتك.",
    invite: "دعوة مستخدم",
    inviteTitle: "دعوة مستخدم جديد",
    inviteDescription: "أنشئ حساباً واحصل على رابط الدعوة.",
    detailsTitle: "تفاصيل المستخدم",
    email: "البريد الإلكتروني",
    status: "الحالة",
    accountScope: "نوع الحساب",
    company: "الشركة",
    roles: "الأدوار",
    created: "تاريخ الإنشاء",
    updated: "آخر تحديث",
    emailVerified: "تم تأكيد البريد الإلكتروني",
    emailNotVerified: "لم يتم تأكيد البريد الإلكتروني",
    actions: "الإجراءات",
    view: "عرض",
    platform: "المنصة",
    companyAccount: "حساب شركة",
    platformAccount: "حساب المنصة",
    chooseCompany: "اختر الشركة",
    chooseRoles: "اختر دوراً واحداً على الأقل",
    allCompanies: "جميع الشركات",
    allStatuses: "جميع الحالات",
    statusInvited: "مدعو",
    statusActive: "نشط",
    statusSuspended: "موقوف",
    saveRoles: "حفظ الأدوار",
    updateStatus: "تغيير الحالة",
    applyStatus: "تطبيق الحالة",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    sendInvitation: "إنشاء الدعوة",
    creatingInvitation: "جارٍ إنشاء الدعوة...",
    cancel: "إلغاء",
    previous: "السابق",
    next: "التالي",
    records: "سجل",
    emptyTitle: "لا يوجد مستخدمون",
    emptyDescription: "لا يوجد مستخدمون مطابقون للاختيار الحالي.",
    invitationCreated: "تم إنشاء الدعوة",
    invitationDescription: "يُعرض هذا الرابط مرة واحدة فقط. أرسله بطريقة آمنة.",
    invitationExpires: "تنتهي صلاحيتها في",
    invitationLink: "رابط الدعوة",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ",
    confirmPlatformInvitation: "سيحصل هذا الحساب على صلاحيات المنصة. هل أنت متأكد؟",
    invitationPending: "ينتظر هذا الحساب قبول الدعوة.",
    acceptanceTitle: "تفعيل الحساب",
    acceptanceDescription: "اختر كلمة مرور لإكمال دعوتك.",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    passwordHint: "استخدم 12 حرفاً على الأقل.",
    activateAccount: "تفعيل الحساب",
    activatingAccount: "جارٍ تفعيل الحساب...",
    invalidInvitation: "رابط الدعوة غير صالح أو منتهي الصلاحية.",
    passwordsDoNotMatch: "كلمتا المرور غير متطابقتين.",
    acceptanceUnavailable: "تعذر إكمال الدعوة. يرجى المحاولة مرة أخرى.",
    accountActivated: "تم تفعيل حسابك. يمكنك الآن تسجيل الدخول.",
  },
  en: {
    title: "Users",
    description: "Manage individual accounts, roles, and invitations.",
    ownDescription: "Manage the users belonging to your company.",
    invite: "Invite user",
    inviteTitle: "Invite a new user",
    inviteDescription: "Create an account and generate a secure invitation link.",
    detailsTitle: "User account details",
    email: "Email address",
    status: "Status",
    accountScope: "Account type",
    company: "Company",
    roles: "Roles",
    created: "Created",
    updated: "Updated",
    emailVerified: "Email verified",
    emailNotVerified: "Email not verified",
    actions: "Actions",
    view: "View",
    platform: "Platform",
    companyAccount: "Company account",
    platformAccount: "Platform account",
    chooseCompany: "Choose a company",
    chooseRoles: "Choose at least one role",
    allCompanies: "All companies",
    allStatuses: "All statuses",
    statusInvited: "Invited",
    statusActive: "Active",
    statusSuspended: "Suspended",
    saveRoles: "Save roles",
    updateStatus: "Change account status",
    applyStatus: "Apply status",
    save: "Save changes",
    saving: "Saving...",
    sendInvitation: "Create invitation",
    creatingInvitation: "Creating invitation...",
    cancel: "Cancel",
    previous: "Previous",
    next: "Next",
    records: "records",
    emptyTitle: "No users found",
    emptyDescription: "No users match the selected filters.",
    invitationCreated: "Invitation created",
    invitationDescription: "This link is shown only once. Share it through a secure channel.",
    invitationExpires: "Expires",
    invitationLink: "Invitation link",
    copyLink: "Copy link",
    copied: "Copied",
    confirmPlatformInvitation: "This account will receive platform-level access. Continue?",
    invitationPending: "This account is waiting for its invitation to be accepted.",
    acceptanceTitle: "Activate your account",
    acceptanceDescription: "Choose a password to complete your invitation.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    passwordHint: "Use at least 12 characters.",
    activateAccount: "Activate account",
    activatingAccount: "Activating account...",
    invalidInvitation: "This invitation is invalid or has expired.",
    passwordsDoNotMatch: "The passwords do not match.",
    acceptanceUnavailable: "The invitation could not be completed. Please try again.",
    accountActivated: "Your account has been activated. You can now sign in.",
  },
};
