import type { Locale } from "@odookrd/types";

import { uiChrome } from "../ui-chrome";

export interface TrainingCustomerDictionary {
  navigation: string;
  catalogTitle: string;
  catalogDescription: string;
  searchPlaceholder: string;
  allCategories: string;
  filter: string;
  clear: string;
  records: string;
  previous: string;
  next: string;
  viewCourse: string;
  sections: string;
  lessons: string;
  noCoursesTitle: string;
  noCoursesDescription: string;
  disabledTitle: string;
  disabledDescription: string;
  courseOutline: string;
  noPublishedContent: string;
  backToCatalog: string;
  mediaComing: string;
  manageTraining: string;
  manageCoursesTitle: string;
  manageCoursesDescription: string;
  noManageableCourses: string;
  manageLearners: string;
  accessTitle: string;
  accessDescription: string;
  companyAccess: string;
  serviceAccess: string;
  userAccess: string;
  addRule: string;
  update: string;
  remove: string;
  company: string;
  service: string;
  learner: string;
  audienceMode: string;
  allUsers: string;
  assignedUsers: string;
  startsAt: string;
  expiresAt: string;
  noStart: string;
  noExpiry: string;
  selectCompany: string;
  selectService: string;
  selectLearner: string;
  chooseCompanyForLearner: string;
  apply: string;
  platformSource: string;
  companyAdminSource: string;
  assignmentRequired: string;
  allUsersAlready: string;
  noAssignments: string;
  accessError: string;
  accessMode: string;
}

export const trainingCustomerDictionaries: Record<
  Locale,
  TrainingCustomerDictionary
> = {
  ku: {
    navigation: "فێرکاری",
    catalogTitle: "کۆرسەکانی من",
    catalogDescription:
      "ئەو کۆرسانە ببینە کە بۆ کۆمپانیا یان هەژماری تۆ بەردەستن.",
    searchPlaceholder: "گەڕان لە کۆرسەکان...",
    allCategories: "هەموو پۆلەکان",
    filter: uiChrome.ku.filter,
    clear: "پاککردنەوە",
    records: "کۆرس",
    previous: uiChrome.ku.previous,
    next: uiChrome.ku.next,
    viewCourse: "بینینی کۆرس",
    sections: "بەش",
    lessons: "وانە",
    noCoursesTitle: "هیچ کۆرسێک بەردەست نییە",
    noCoursesDescription: "لە ئێستادا هیچ کۆرسێک بۆ هەژمارەکەت دیاری نەکراوە.",
    disabledTitle: "فێرکاری بۆ ئەم کۆمپانیایە ناچالاکە",
    disabledDescription:
      "بەڕێوەبەری پلاتفۆڕم دەتوانێت خزمەتگوزاری فێرکاری چالاک بکات.",
    courseOutline: "ناوەڕۆکی کۆرس",
    noPublishedContent: "هێشتا هیچ بەش یان وانەی بڵاوکراوە نییە.",
    backToCatalog: "گەڕانەوە بۆ کۆرسەکان",
    mediaComing: "پخشکردنی وانە لە 3C.2 زیاد دەکرێت.",
    manageTraining: "بەڕێوەبردنی دەستگەیشتن",
    manageCoursesTitle: "بەڕێوەبردنی فێرکاری کۆمپانیا",
    manageCoursesDescription:
      "فێرخوازان بۆ کۆرسە دیاریکراوەکانی کۆمپانیا بەڕێوەببە.",
    noManageableCourses: "هیچ کۆرسێکی بەڕێوەبردن نییە.",
    manageLearners: "بەڕێوەبردنی فێرخوازان",
    accessTitle: "دەستگەیشتنی کۆرس",
    accessDescription:
      "دەستگەیشتنی کۆمپانیا، خزمەتگوزاری فێرکاری و فێرخواز بەڕێوەببە.",
    companyAccess: "دەستگەیشتنی کۆمپانیا",
    serviceAccess: "دەستگەیشتنی خزمەتگوزاری فێرکاری",
    userAccess: "دیاریکردنی فێرخواز",
    addRule: "زیادکردنی یاسای دەستگەیشتن",
    update: "نوێکردنەوە",
    remove: "لابردن",
    company: "کۆمپانیا",
    service: "خزمەتگوزاری",
    learner: "فێرخواز",
    audienceMode: "شێوازی دەستگەیشتن",
    allUsers: "هەموو بەکارهێنەران",
    assignedUsers: "تەنها فێرخوازانی دیاریکراو",
    startsAt: "بەرواری دەستپێک",
    expiresAt: "بەرواری کۆتایی",
    noStart: "بێ سنووری دەستپێک",
    noExpiry: "بێ بەرواری کۆتایی",
    selectCompany: "کۆمپانیا هەڵبژێرە",
    selectService: "خزمەتگوزاری هەڵبژێرە",
    selectLearner: "فێرخواز هەڵبژێرە",
    chooseCompanyForLearner: "سەرەتا کۆمپانیا هەڵبژێرە",
    apply: uiChrome.ku.apply,
    platformSource: "پلاتفۆڕم",
    companyAdminSource: "بەڕێوەبەری کۆمپانیا",
    assignmentRequired: "ئەم کۆرسە پێویستی بە دیاریکردنی فێرخواز هەیە.",
    allUsersAlready:
      "هەموو بەکارهێنەرانی کۆمپانیا خۆکارانە دەستگەیشتنیان هەیە.",
    noAssignments: "هیچ فێرخوازێک دیاری نەکراوە.",
    accessError: "کرداری دەستگەیشتن سەرکەوتوو نەبوو.",
    accessMode: "شێوازی دەستگەیشتن",
  },
  ar: {
    navigation: "التدريب",
    catalogTitle: "دوراتي",
    catalogDescription: "استعرض الدورات المتاحة لشركتك أو لحسابك بشكل مباشر.",
    searchPlaceholder: "البحث في الدورات...",
    allCategories: "كل التصنيفات",
    filter: uiChrome.ar.filter,
    clear: "مسح",
    records: "دورة",
    previous: uiChrome.ar.previous,
    next: uiChrome.ar.next,
    viewCourse: "عرض الدورة",
    sections: "أقسام",
    lessons: "دروس",
    noCoursesTitle: "لا توجد دورات متاحة",
    noCoursesDescription: "لا توجد حالياً دورات مخصصة لحسابك.",
    disabledTitle: "التدريب غير مفعّل لهذه الشركة",
    disabledDescription: "يمكن لمسؤول المنصة تفعيل خدمة التدريب لهذه الشركة.",
    courseOutline: "محتوى الدورة",
    noPublishedContent: "لا توجد أقسام أو دروس منشورة بعد.",
    backToCatalog: "العودة إلى الدورات",
    mediaComing: "تشغيل الدرس سيضاف في المرحلة 3C.2.",
    manageTraining: "إدارة الوصول",
    manageCoursesTitle: "إدارة تدريب الشركة",
    manageCoursesDescription: "إدارة المتعلمين للدورات المتاحة لشركتك.",
    noManageableCourses: "لا توجد دورات يمكن إدارتها.",
    manageLearners: "إدارة المتعلمين",
    accessTitle: "الوصول إلى الدورة",
    accessDescription: "إدارة وصول الشركات وخدمات التدريب والمتعلمين.",
    companyAccess: "وصول الشركة",
    serviceAccess: "وصول خدمة التدريب",
    userAccess: "تعيين المتعلمين",
    addRule: "إضافة قاعدة وصول",
    update: "تحديث",
    remove: "إزالة",
    company: "الشركة",
    service: "الخدمة",
    learner: "المتعلم",
    audienceMode: "نمط الوصول",
    allUsers: "جميع المستخدمين",
    assignedUsers: "المستخدمون المعيّنون فقط",
    startsAt: "تاريخ البدء",
    expiresAt: "تاريخ الانتهاء",
    noStart: "بدون حد بداية",
    noExpiry: "بدون انتهاء",
    selectCompany: "اختر شركة",
    selectService: "اختر خدمة",
    selectLearner: "اختر متعلماً",
    chooseCompanyForLearner: "اختر الشركة أولاً",
    apply: uiChrome.ar.apply,
    platformSource: "المنصة",
    companyAdminSource: "مسؤول الشركة",
    assignmentRequired: "تتطلب هذه الدورة تعيين المتعلمين بشكل فردي.",
    allUsersAlready: "جميع مستخدمي الشركة لديهم وصول تلقائي لهذه الدورة.",
    noAssignments: "لا يوجد متعلمون معيّنون.",
    accessError: "تعذر إكمال عملية الوصول.",
    accessMode: "نمط الوصول",
  },
  en: {
    navigation: "Training",
    catalogTitle: "My Courses",
    catalogDescription:
      "Browse courses made available to your company or directly to your account.",
    searchPlaceholder: "Search courses...",
    allCategories: "All categories",
    filter: uiChrome.en.filter,
    clear: "Clear",
    records: "courses",
    previous: uiChrome.en.previous,
    next: uiChrome.en.next,
    viewCourse: "View course",
    sections: "Sections",
    lessons: "Lessons",
    noCoursesTitle: "No courses available",
    noCoursesDescription:
      "No training courses are currently entitled to your account.",
    disabledTitle: "Training is disabled for this company",
    disabledDescription:
      "A platform administrator can enable the Training service for this company.",
    courseOutline: "Course outline",
    noPublishedContent: "No published sections or lessons are available yet.",
    backToCatalog: "Back to courses",
    mediaComing: "Lesson playback will be enabled in Stage 3C.2.",
    manageTraining: "Manage access",
    manageCoursesTitle: "Company Training Management",
    manageCoursesDescription:
      "Manage learners for courses made available to your company.",
    noManageableCourses: "There are no company training courses to manage.",
    manageLearners: "Manage learners",
    accessTitle: "Course Access",
    accessDescription:
      "Manage company, TRAINING service, and individual learner access.",
    companyAccess: "Company access",
    serviceAccess: "TRAINING service access",
    userAccess: "Learner assignments",
    addRule: "Add access rule",
    update: "Update",
    remove: "Remove",
    company: "Company",
    service: "Service",
    learner: "Learner",
    audienceMode: "Audience mode",
    allUsers: "All users",
    assignedUsers: "Assigned users only",
    startsAt: "Start date",
    expiresAt: "Expiry date",
    noStart: "No start restriction",
    noExpiry: "No expiry",
    selectCompany: "Select company",
    selectService: "Select service",
    selectLearner: "Select learner",
    chooseCompanyForLearner: "Choose a company first",
    apply: uiChrome.en.apply,
    platformSource: "Platform",
    companyAdminSource: "Company Admin",
    assignmentRequired: "This course requires individual learner assignment.",
    allUsersAlready:
      "All company users already receive this course automatically.",
    noAssignments: "No learners have been assigned.",
    accessError: "The access operation could not be completed.",
    accessMode: "Access mode",
  },
};
