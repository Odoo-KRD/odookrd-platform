import type { Locale } from "@odookrd/types";

export interface TrainingCustomerWorkspaceDictionary {
  courseLibrary: string;
  availableCourses: string;
  courseOverview: string;
  startCourse: string;
  openLesson: string;
  lessonUnavailable: string;
  readyContent: string;
  sectionLabel: string;
  lessonLabel: string;
  expandSection: string;
  categoryLabel: string;
  courseContent: string;
  currentLesson: string;
  previousLesson: string;
  nextLesson: string;
  resources: string;
  download: string;
  noResources: string;
  lessonInformation: string;
  curriculum: string;
  openCurriculum: string;
  lessonsTab: string;
  chaptersTab: string;
  resourcesTab: string;
  enterFullscreen: string;
  exitFullscreen: string;
  collapseCourseSidebar: string;
  expandCourseSidebar: string;
  closeCourseSidebar: string;
}

export const trainingCustomerWorkspaceDictionaries: Record<
  Locale,
  TrainingCustomerWorkspaceDictionary
> = {
  en: {
    courseLibrary: "Course library",
    availableCourses: "Courses available to your account",
    courseOverview: "Course overview",
    startCourse: "Start course",
    openLesson: "Open lesson",
    lessonUnavailable: "Content unavailable",
    readyContent: "Ready to learn",
    sectionLabel: "Section",
    lessonLabel: "Lesson",
    expandSection: "Course section",
    categoryLabel: "Category",
    courseContent: "Course content",
    currentLesson: "Current lesson",
    previousLesson: "Previous lesson",
    nextLesson: "Next lesson",
    resources: "Resources",
    download: "Download",
    noResources: "No resources are attached to this lesson.",
    lessonInformation: "Lesson information",
    curriculum: "Curriculum",
    openCurriculum: "Open course content",
    lessonsTab: "Lessons",
    chaptersTab: "Chapters",
    resourcesTab: "Resources",
    enterFullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    collapseCourseSidebar: "Collapse course sidebar",
    expandCourseSidebar: "Expand course sidebar",
    closeCourseSidebar: "Close course sidebar",
  },
  ku: {
    courseLibrary: "کتێبخانەی کۆرسەکان",
    availableCourses: "ئەو کۆرسانەی بۆ هەژمارەکەت بەردەستن",
    courseOverview: "پوختەی کۆرس",
    startCourse: "دەستپێکردنی کۆرس",
    openLesson: "کردنەوەی وانە",
    lessonUnavailable: "ناوەڕۆک بەردەست نییە",
    readyContent: "ئامادەی فێربوون",
    sectionLabel: "بەش",
    lessonLabel: "وانە",
    expandSection: "بەشی کۆرس",
    categoryLabel: "پۆل",
    courseContent: "ناوەڕۆکی کۆرس",
    currentLesson: "وانەی ئێستا",
    previousLesson: "وانەی پێشوو",
    nextLesson: "وانەی دواتر",
    resources: "سەرچاوەکان",
    download: "داگرتن",
    noResources: "هیچ سەرچاوەیەک بەو وانەیەوە نەبەستراوە.",
    lessonInformation: "زانیارییەکانی وانە",
    curriculum: "پڕۆگرامی کۆرس",
    openCurriculum: "کردنەوەی ناوەڕۆکی کۆرس",
    lessonsTab: "وانەکان",
    chaptersTab: "بەشەکان",
    resourcesTab: "سەرچاوەکان",
    enterFullscreen: "پڕکردنەوەی شاشە",
    exitFullscreen: "دەرچوون لە پڕشاشە",
    collapseCourseSidebar: "بچووککردنەوەی لیستی کۆرس",
    expandCourseSidebar: "کردنەوەی لیستی کۆرس",
    closeCourseSidebar: "داخستنی لیستی کۆرس",
  },
  ar: {
    courseLibrary: "مكتبة الدورات",
    availableCourses: "الدورات المتاحة لحسابك",
    courseOverview: "نظرة عامة على الدورة",
    startCourse: "بدء الدورة",
    openLesson: "فتح الدرس",
    lessonUnavailable: "المحتوى غير متاح",
    readyContent: "جاهز للتعلم",
    sectionLabel: "قسم",
    lessonLabel: "درس",
    expandSection: "قسم الدورة",
    categoryLabel: "الفئة",
    courseContent: "محتوى الدورة",
    currentLesson: "الدرس الحالي",
    previousLesson: "الدرس السابق",
    nextLesson: "الدرس التالي",
    resources: "الموارد",
    download: "تنزيل",
    noResources: "لا توجد موارد مرفقة بهذا الدرس.",
    lessonInformation: "معلومات الدرس",
    curriculum: "منهج الدورة",
    openCurriculum: "فتح محتوى الدورة",
    lessonsTab: "الدروس",
    chaptersTab: "الفصول",
    resourcesTab: "الموارد",
    enterFullscreen: "ملء الشاشة",
    exitFullscreen: "الخروج من ملء الشاشة",
    collapseCourseSidebar: "طي قائمة الدورة",
    expandCourseSidebar: "توسيع قائمة الدورة",
    closeCourseSidebar: "إغلاق قائمة الدورة",
  },
};
