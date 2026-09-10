import type { Locale } from "@odookrd/types";
import { sharedText } from "../shared";

export interface CustomerDashboardV2Dictionary {
  navigation: {
    learning: string;
    myCourses: string;
    myCertificates: string;
    companyAccount: string;
    companyProfile: string;
    myProfile: string;
  };
  header: {
    customerPortal: string;
    openNavigation: string;
    closeNavigation: string;
    notifications: string;
    recentNotifications: string;
    noNotifications: string;
    unread: string;
    markRead: string;
    markAllRead: string;
    viewAll: string;
    accountMenu: string;
    myAccount: string;
    editProfile: string;
    myCompany: string;
    myCourses: string;
    myCertificates: string;
    administration: string;
    logout: string;
    loggingOut: string;
  };
  dashboard: {
    eyebrow: string;
    welcome: string;
    welcomeFallback: string;
    description: string;
    activeServices: string;
    coursesInProgress: string;
    completedCourses: string;
    unreadNotifications: string;
    learningProgress: string;
    learningProgressDescription: string;
    averageProgress: string;
    completed: string;
    inProgress: string;
    notStarted: string;
    myLearning: string;
    myLearningDescription: string;
    viewAllCourses: string;
    noCourses: string;
    noCoursesDescription: string;
    lessonsCompleted: string;
    recentActivity: string;
    noRecentActivity: string;
    continueLearning: string;
    startCourse: string;
    viewCourse: string;
    viewCertificate: string;
    courseCompleted: string;
    quickAccess: string;
    services: string;
    profile: string;
    company: string;
    notifications: string;
  };
  profile: {
    eyebrow: string;
    title: string;
    description: string;
    avatar: string;
    avatarDescription: string;
    uploadAvatar: string;
    changeAvatar: string;
    removeAvatar: string;
    avatarHint: string;
    displayName: string;
    displayNamePlaceholder: string;
    email: string;
    emailReadonly: string;
    whatsapp: string;
    whatsappPlaceholder: string;
    preferredLanguage: string;
    certificateName: string;
    certificateNamePlaceholder: string;
    saveChanges: string;
    saving: string;
    saved: string;
    uploadFailed: string;
    saveFailed: string;
    invalidAvatar: string;
    accountInformation: string;
  };
}

export const customerDashboardV2Dictionaries: Record<
  Locale,
  CustomerDashboardV2Dictionary
> = {
  ku: {
    navigation: {
      learning: "فێربوون",
      myCourses: "کۆرسەکانم",
      myCertificates: "بڕوانامەکانم",
      companyAccount: "کۆمپانیا و هەژمار",
      companyProfile: "پڕۆفایلی کۆمپانیا",
      myProfile: "پڕۆفایلی من",
    },
    header: {
      customerPortal: "پۆرتاڵی کڕیار",
      openNavigation: "کردنەوەی ڕێنیشاندەر",
      closeNavigation: "داخستنی ڕێنیشاندەر",
      notifications: "ئاگادارکردنەوەکان",
      recentNotifications: "نوێترین ئاگادارکردنەوەکان",
      noNotifications: "ئاگادارکردنەوەی نوێ نییە.",
      unread: sharedText.ku.labels.unread,
      markRead: sharedText.ku.labels.markRead,
      markAllRead: sharedText.ku.labels.markAllRead,
      viewAll: "بینینی هەموو",
      accountMenu: "مێنیوی هەژمار",
      myAccount: "هەژماری من",
      editProfile: "دەستکاری پڕۆفایل",
      myCompany: "کۆمپانیای من",
      myCourses: "کۆرسەکانم",
      myCertificates: "بڕوانامەکانم",
      administration: "بەڕێوەبردن",
      logout: "چوونەدەرەوە",
      loggingOut: "چوونەدەرەوە...",
    },
    dashboard: {
      eyebrow: "پۆرتاڵی کڕیار",
      welcome: "بەخێربێیت، {name}",
      welcomeFallback: "بەخێربێیت",
      description: "پوختەی خزمەتگوزاری، فێربوون و چالاکییەکانی هەژمارەکەت.",
      activeServices: "خزمەتگوزارییە چالاکەکان",
      coursesInProgress: "کۆرسی لە بەردەوامیدا",
      completedCourses: "کۆرسی تەواوکراو",
      unreadNotifications: "ئاگادارکردنەوەی نەخوێندراوە",
      learningProgress: "پێشکەوتنی فێربوون",
      learningProgressDescription: "دۆخی گشتی کۆرسەکانی تۆ.",
      averageProgress: "تێکڕای پێشکەوتن",
      completed: "تەواوکراو",
      inProgress: "لە بەردەوامیدا",
      notStarted: "دەست پێ نەکراوە",
      myLearning: "فێربوونی من",
      myLearningDescription:
        "بەردەوام بە لە شوێنی دواوە یان بڕوانامەی کۆرسی تەواوکراو ببینە.",
      viewAllCourses: "بینینی هەموو کۆرسەکان",
      noCourses: "هێشتا کۆرسێک بۆ تۆ دیاری نەکراوە.",
      noCoursesDescription:
        "کاتێک دەستگەیشتنت بۆ کۆرسێک چالاک بکرێت، لێرە دەردەکەوێت.",
      lessonsCompleted: sharedText.ku.labels.lessonsCompleted,
      recentActivity: sharedText.ku.labels.recentActivity,
      noRecentActivity: "هێشتا چالاکییەک تۆمار نەکراوە",
      continueLearning: "بەردەوام بە لە فێربوون",
      startCourse: "دەستپێکردنی کۆرس",
      viewCourse: "بینینی کۆرس",
      viewCertificate: "بینینی بڕوانامە",
      courseCompleted: sharedText.ku.labels.courseCompleted,
      quickAccess: "دەستگەیشتنی خێرا",
      services: "خزمەتگوزارییەکانم",
      profile: "پڕۆفایلی من",
      company: "کۆمپانیای من",
      notifications: "ئاگادارکردنەوەکان",
    },
    profile: {
      eyebrow: "هەژماری من",
      title: "پڕۆفایلی من",
      description:
        "زانیارییە کەسییەکان، وێنە، زمان و ناوی بڕوانامەکەت بەڕێوەببە.",
      avatar: "وێنەی پڕۆفایل",
      avatarDescription: "وێنەیەکی پیشەیی بۆ ناسنامەی هەژمارەکەت زیاد بکە.",
      uploadAvatar: "بارکردنی وێنە",
      changeAvatar: "گۆڕینی وێنە",
      removeAvatar: "سڕینەوەی وێنە",
      avatarHint:
        "JPEG، PNG یان WebP — زۆرترین 10MB. وێنەکە بە شێوەی 512×512 ئامادە دەکرێت.",
      displayName: "ناوی پیشاندان",
      displayNamePlaceholder: "ناوی تەواو",
      email: "ئیمەیڵ",
      emailReadonly: "ئیمەیڵ لەم پەڕەیەوە ناگۆڕدرێت.",
      whatsapp: "ژمارەی WhatsApp",
      whatsappPlaceholder: "+9647XXXXXXXXX",
      preferredLanguage: "زمانی پەسەندکراو",
      certificateName: "ناوی بڕوانامە",
      certificateNamePlaceholder: "ناو وەک دەبێت لە بڕوانامەدا پیشان بدرێت",
      saveChanges: "پاشەکەوتکردنی گۆڕانکارییەکان",
      saving: sharedText.ku.actions.saving,
      saved: "گۆڕانکارییەکان پاشەکەوت کران.",
      uploadFailed: "بارکردنی وێنە سەرکەوتوو نەبوو.",
      saveFailed: "پاشەکەوتکردنی گۆڕانکارییەکان سەرکەوتوو نەبوو.",
      invalidAvatar: "تەنها JPEG، PNG یان WebP تا 10MB ڕێگەپێدراوە.",
      accountInformation: "زانیاری هەژمار",
    },
  },
  ar: {
    navigation: {
      learning: "التعلّم",
      myCourses: "دوراتي",
      myCertificates: "شهاداتي",
      companyAccount: "الشركة والحساب",
      companyProfile: "ملف الشركة",
      myProfile: "ملفي الشخصي",
    },
    header: {
      customerPortal: "بوابة العميل",
      openNavigation: "فتح التنقل",
      closeNavigation: "إغلاق التنقل",
      notifications: "الإشعارات",
      recentNotifications: "أحدث الإشعارات",
      noNotifications: "لا توجد إشعارات حديثة.",
      unread: sharedText.ar.labels.unread,
      markRead: sharedText.ar.labels.markRead,
      markAllRead: sharedText.ar.labels.markAllRead,
      viewAll: "عرض الكل",
      accountMenu: "قائمة الحساب",
      myAccount: "حسابي",
      editProfile: "تعديل الملف الشخصي",
      myCompany: "شركتي",
      myCourses: "دوراتي",
      myCertificates: "شهاداتي",
      administration: "الإدارة",
      logout: "تسجيل الخروج",
      loggingOut: "جاري تسجيل الخروج...",
    },
    dashboard: {
      eyebrow: "بوابة العميل",
      welcome: "مرحباً، {name}",
      welcomeFallback: "مرحباً",
      description: "نظرة سريعة على خدماتك وتعلّمك ونشاط حسابك.",
      activeServices: "الخدمات النشطة",
      coursesInProgress: "الدورات قيد التقدم",
      completedCourses: "الدورات المكتملة",
      unreadNotifications: "الإشعارات غير المقروءة",
      learningProgress: "تقدم التعلّم",
      learningProgressDescription: "الحالة الإجمالية لدوراتك المخصصة.",
      averageProgress: "متوسط التقدم",
      completed: "مكتمل",
      inProgress: "قيد التقدم",
      notStarted: "لم يبدأ",
      myLearning: "تعلّمي",
      myLearningDescription: "واصل من آخر نقطة أو افتح شهادة الدورة المكتملة.",
      viewAllCourses: "عرض كل الدورات",
      noCourses: "لا توجد دورات مخصصة لك حالياً.",
      noCoursesDescription:
        "ستظهر الدورات هنا عند منح حسابك صلاحية الوصول إليها.",
      lessonsCompleted: sharedText.ar.labels.lessonsCompleted,
      recentActivity: sharedText.ar.labels.recentActivity,
      noRecentActivity: "لا يوجد نشاط مسجل بعد",
      continueLearning: "متابعة التعلّم",
      startCourse: "بدء الدورة",
      viewCourse: "عرض الدورة",
      viewCertificate: "عرض الشهادة",
      courseCompleted: sharedText.ar.labels.courseCompleted,
      quickAccess: "وصول سريع",
      services: "خدماتي",
      profile: "ملفي الشخصي",
      company: "شركتي",
      notifications: "الإشعارات",
    },
    profile: {
      eyebrow: "حسابي",
      title: "ملفي الشخصي",
      description:
        "إدارة هويتك الشخصية والصورة واللغة والاسم المستخدم في الشهادة.",
      avatar: "صورة الملف الشخصي",
      avatarDescription: "أضف صورة احترافية لهوية حسابك.",
      uploadAvatar: "رفع صورة",
      changeAvatar: "تغيير الصورة",
      removeAvatar: "حذف الصورة",
      avatarHint:
        "JPEG أو PNG أو WebP — حتى 10MB. يتم تجهيز الصورة بمقاس 512×512.",
      displayName: "اسم العرض",
      displayNamePlaceholder: "الاسم الكامل",
      email: "البريد الإلكتروني",
      emailReadonly: "لا يمكن تغيير البريد الإلكتروني من هذه الصفحة.",
      whatsapp: "رقم WhatsApp",
      whatsappPlaceholder: "+9647XXXXXXXXX",
      preferredLanguage: "اللغة المفضلة",
      certificateName: "الاسم على الشهادة",
      certificateNamePlaceholder: "الاسم كما يجب أن يظهر على الشهادة",
      saveChanges: "حفظ التغييرات",
      saving: "جاري الحفظ...",
      saved: "تم حفظ التغييرات.",
      uploadFailed: "تعذر رفع الصورة.",
      saveFailed: "تعذر حفظ التغييرات.",
      invalidAvatar: "يُسمح فقط بملفات JPEG أو PNG أو WebP حتى 10MB.",
      accountInformation: "معلومات الحساب",
    },
  },
  en: {
    navigation: {
      learning: "Learning",
      myCourses: "My Courses",
      myCertificates: "My Certificates",
      companyAccount: "Company & Account",
      companyProfile: "Company Profile",
      myProfile: "My Profile",
    },
    header: {
      customerPortal: "Customer Portal",
      openNavigation: "Open navigation",
      closeNavigation: "Close navigation",
      notifications: "Notifications",
      recentNotifications: "Recent notifications",
      noNotifications: "No recent notifications.",
      unread: sharedText.en.labels.unread,
      markRead: sharedText.en.labels.markRead,
      markAllRead: sharedText.en.labels.markAllRead,
      viewAll: "View all",
      accountMenu: "Account menu",
      myAccount: "My Account",
      editProfile: "Edit Profile",
      myCompany: "My Company",
      myCourses: "My Courses",
      myCertificates: "My Certificates",
      administration: "Administration",
      logout: "Log out",
      loggingOut: "Logging out...",
    },
    dashboard: {
      eyebrow: "Customer Portal",
      welcome: "Welcome, {name}",
      welcomeFallback: "Welcome",
      description:
        "A concise view of your services, learning, and account activity.",
      activeServices: "Active Services",
      coursesInProgress: "Courses In Progress",
      completedCourses: "Completed Courses",
      unreadNotifications: "Unread Notifications",
      learningProgress: "Learning Progress",
      learningProgressDescription:
        "Overall status across your assigned courses.",
      averageProgress: "Average progress",
      completed: "Completed",
      inProgress: "In Progress",
      notStarted: "Not Started",
      myLearning: "My Learning",
      myLearningDescription:
        "Continue where you left off or open a certificate for a completed course.",
      viewAllCourses: "View all courses",
      noCourses: "No courses are assigned to you yet.",
      noCoursesDescription:
        "Courses will appear here as soon as access is assigned to your account.",
      lessonsCompleted: sharedText.en.labels.lessonsCompleted,
      recentActivity: sharedText.en.labels.recentActivity,
      noRecentActivity: "No activity recorded yet",
      continueLearning: "Continue Learning",
      startCourse: "Start Course",
      viewCourse: "View Course",
      viewCertificate: "View Certificate",
      courseCompleted: sharedText.en.labels.courseCompleted,
      quickAccess: "Quick Access",
      services: "My Services",
      profile: "My Profile",
      company: "My Company",
      notifications: "Notifications",
    },
    profile: {
      eyebrow: "My Account",
      title: "My Profile",
      description:
        "Manage your personal identity, avatar, language, and certificate name.",
      avatar: "Profile photo",
      avatarDescription: "Add a professional image to your account identity.",
      uploadAvatar: "Upload photo",
      changeAvatar: "Change photo",
      removeAvatar: "Remove photo",
      avatarHint:
        "JPEG, PNG or WebP — up to 10MB. The image is normalized to 512×512.",
      displayName: "Display Name",
      displayNamePlaceholder: "Full name",
      email: "Email",
      emailReadonly: "Email cannot be changed from this page.",
      whatsapp: "WhatsApp Number",
      whatsappPlaceholder: "+9647XXXXXXXXX",
      preferredLanguage: "Preferred Language",
      certificateName: "Certificate Name",
      certificateNamePlaceholder:
        "Name exactly as it should appear on certificates",
      saveChanges: "Save Changes",
      saving: sharedText.en.actions.saving,
      saved: "Your changes have been saved.",
      uploadFailed: "The photo could not be uploaded.",
      saveFailed: "Your changes could not be saved.",
      invalidAvatar: "Only JPEG, PNG or WebP files up to 10MB are allowed.",
      accountInformation: "Account Information",
    },
  },
};
