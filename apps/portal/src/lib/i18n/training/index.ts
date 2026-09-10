import type {
  Locale,
  TrainingCategoryStatus,
  TrainingContentStatus,
  TrainingCourseStatus,
} from "@odookrd/types";
import { uiChrome } from "../ui-chrome";
import { sharedText } from "../shared";

export interface TrainingDictionary {
  navigation: string;
  contentAdministration: string;
  coursesNavigation: string;
  categoriesNavigation: string;
  title: string;
  description: string;
  categoriesTitle: string;
  categoriesDescription: string;
  coursesTitle: string;
  coursesDescription: string;
  courseEditor: string;
  courseEditorDescription: string;
  searchCategories: string;
  searchCourses: string;
  allStatuses: string;
  allCategories: string;
  filter: string;
  clearFilters: string;
  records: string;
  previous: string;
  next: string;
  coverImage: string;
  uploadCover: string;
  replaceCover: string;
  removeCover: string;
  uploadingCover: string;
  coverUploadFailed: string;
  coverHelp: string;
  noCover: string;
  structure: string;
  editMetadata: string;
  categories: string;
  courses: string;
  sections: string;
  lessons: string;
  addCategory: string;
  addCourse: string;
  addSection: string;
  addLesson: string;
  newCategory: string;
  editCategory: string;
  newCourse: string;
  editCourse: string;
  newSection: string;
  editSection: string;
  newLesson: string;
  editLesson: string;
  key: string;
  slug: string;
  name: string;
  courseTitle: string;
  sectionTitle: string;
  lessonTitle: string;
  descriptionField: string;
  summary: string;
  thumbnailUrl: string;
  category: string;
  status: string;
  sortOrder: string;
  courseCount: string;
  sectionCount: string;
  lessonCount: string;
  video: string;
  videoPending: string;
  actions: string;
  view: string;
  edit: string;
  back: string;
  save: string;
  saving: string;
  cancel: string;
  noCategories: string;
  noCourses: string;
  noSections: string;
  noLessons: string;
  editor: {
    professionalHint: string;
    dragSection: string;
    dragLesson: string;
    addSection: string;
    addLesson: string;
    editSection: string;
    editLesson: string;
    sectionDialogHelp: string;
    lessonDialogHelp: string;
    richDescription: string;
    moveHint: string;
    structureSaving: string;
    structureSaved: string;
    structureFailed: string;
    create: string;
    update: string;
    close: string;
    emptySection: string;
    lessonType: string;
    archive: string;
    restore: string;
    delete: string;
    sectionDeleteConfirm: string;
    lessonDeleteConfirm: string;
    actionFailed: string;
    toolbar: {
      paragraph: string;
      heading2: string;
      heading3: string;
      bold: string;
      italic: string;
      strike: string;
      bulletList: string;
      orderedList: string;
      blockquote: string;
      codeBlock: string;
      undo: string;
      redo: string;
      image: string;
      attachment: string;
      fullscreen: string;
      exitFullscreen: string;
      uploadFailed: string;
      alignLeft: string;
      alignCenter: string;
      alignRight: string;
      directionLtr: string;
      directionRtl: string;
      separator: string;
      separatorPrompt: string;
      imageAlignLeft: string;
      imageAlignCenter: string;
      imageAlignRight: string;
      imageMove: string;
      imageDelete: string;
      imageResize: string;
      imageActualSize: string;
      placeholder: string;
      link: string;
      unlink: string;
      linkPrompt: string;
      linkInvalid: string;
      dialogApply: string;
      dialogCancel: string;
    };
  };
  categoryStatus: Record<TrainingCategoryStatus, string>;
  courseStatus: Record<TrainingCourseStatus, string>;
  contentStatus: Record<TrainingContentStatus, string>;
}

export const trainingDictionaries: Record<Locale, TrainingDictionary> = {
  ku: {
    navigation: "فێرکاری ئۆنلاین",
    contentAdministration: "بەڕێوەبردنی ناوەڕۆک",
    coursesNavigation: "کۆرسەکان",
    categoriesNavigation: "پۆلەکان",
    title: "فێرکاری ئۆنلاین",
    description: "کۆرس و پۆلەکانی پلاتفۆڕمی فێرکاری ئۆنلاین بەڕێوەببە.",
    categoriesTitle: "پۆلەکانی کۆرس",
    categoriesDescription:
      "پۆلەکانی کۆرس ڕێکبخە و دۆخ و ڕیزبەندییان بەڕێوەببە.",
    coursesTitle: "کۆرسەکان",
    coursesDescription: "زانیاری کۆرسەکان، دۆخ، پۆل و ناوەڕۆکیان بەڕێوەببە.",
    courseEditor: "دەستکاریکەری کۆرس",
    courseEditorDescription: "بەش و پێکهاتەی وانەکانی ئەم کۆرسە بەڕێوەببە.",
    searchCategories: "گەڕان لە پۆلەکان...",
    searchCourses: "گەڕان لە کۆرسەکان...",
    allStatuses: sharedText.ku.labels.allStatuses,
    allCategories: sharedText.ku.labels.allCategories,
    filter: uiChrome.ku.filter,
    clearFilters: sharedText.ku.labels.clearFilters,
    records: "تۆمار",
    previous: uiChrome.ku.previous,
    next: uiChrome.ku.next,
    coverImage: "وێنەی بەرگ",
    uploadCover: "بارکردنی وێنە",
    replaceCover: "گۆڕینی وێنە",
    removeCover: "لابردنی وێنە",
    uploadingCover: "وێنە بار دەکرێت...",
    coverUploadFailed: "بارکردنی وێنە سەرکەوتوو نەبوو.",
    coverHelp:
      "وێنەی JPEG، PNG، WEBP، GIF یان SVG باربکە؛ فایل بە APIی پارێزراوی پلاتفۆڕم هەڵدەگیرێت.",
    noCover: "هیچ وێنەیەکی بەرگ دانەنراوە",
    structure: "بەش / وانە",
    editMetadata: "دەستکاریکردنی زانیاری",
    categories: "پۆلەکان",
    courses: sharedText.ku.labels.courses,
    sections: sharedText.ku.labels.sections,
    lessons: sharedText.ku.labels.lessons,
    addCategory: "زیادکردنی پۆل",
    addCourse: "زیادکردنی کۆرس",
    addSection: "زیادکردنی بەش",
    addLesson: "زیادکردنی وانە",
    newCategory: "پۆلی نوێ",
    editCategory: "دەستکاریکردنی پۆل",
    newCourse: "کۆرسی نوێ",
    editCourse: "دەستکاریکردنی کۆرس",
    newSection: "بەشی نوێ",
    editSection: "دەستکاریکردنی بەش",
    newLesson: "وانەی نوێ",
    editLesson: "دەستکاریکردنی وانە",
    key: "کلیل",
    slug: sharedText.ku.labels.slug,
    name: "ناو",
    courseTitle: "ناونیشانی کۆرس",
    sectionTitle: "ناونیشانی بەش",
    lessonTitle: "ناونیشانی وانە",
    descriptionField: "وەسف",
    summary: "پوختە",
    thumbnailUrl: "بەستەری وێنۆچکە",
    category: sharedText.ku.labels.category,
    status: "دۆخ",
    sortOrder: "ڕیزبەندی",
    courseCount: "کۆرس",
    sectionCount: "بەش",
    lessonCount: "وانە",
    video: "ڤیدیۆ",
    videoPending: "میدیای ڤیدیۆ بە شێوەی جیا پەیوەست دەکرێت.",
    actions: uiChrome.ku.actions,
    view: uiChrome.ku.view,
    edit: uiChrome.ku.edit,
    back: "گەڕانەوە",
    save: "پاشەکەوتکردن",
    saving: sharedText.ku.actions.saving,
    cancel: "پاشگەزبوونەوە",
    noCategories: "هیچ پۆلێکی کۆرس نییە.",
    noCourses: "هیچ کۆرسێک نییە.",
    noSections: "هیچ بەشێک نییە.",
    noLessons: "هیچ وانەیەک نییە.",
    editor: {
      professionalHint: "بەش و وانەکان لەم پەڕەیەدا بە ڕاکێشان و دانان ڕێکبخە.",
      dragSection: "ڕاکێشانی بەش",
      dragLesson: "ڕاکێشانی وانە",
      addSection: "زیادکردنی بەش",
      addLesson: "زیادکردنی وانە",
      editSection: "دەستکاریکردنی بەش",
      editLesson: "دەستکاریکردنی وانە",
      sectionDialogHelp: "ناونیشان، وەسفی دەوڵەمەند و دۆخی بەش بەڕێوەببە.",
      lessonDialogHelp: "ناونیشان، وەسفی دەوڵەمەند و دۆخی وانە بەڕێوەببە.",
      richDescription: "وەسفی دەوڵەمەند",
      moveHint: "بە دەستگرتنی نیشانی ڕاکێشان، بەش و وانەکان بگوازەرەوە.",
      structureSaving: "پێکهاتە پاشەکەوت دەکرێت...",
      structureSaved: "پێکهاتە پاشەکەوت کرا.",
      structureFailed:
        "پاشەکەوتکردنی پێکهاتە سەرکەوتوو نەبوو؛ گۆڕانکارییەکە گەڕێندرایەوە.",
      create: "زیادکردن",
      update: "نوێکردنەوە",
      close: uiChrome.ku.close,
      emptySection: "ئەم بەشە هێشتا هیچ وانەیەکی نییە.",
      lessonType: "وانە",
      archive: "ئەرشیف",
      restore: sharedText.ku.labels.restore,
      delete: "سڕینەوە",
      sectionDeleteConfirm:
        "دڵنیایت لە سڕینەوەی ئەم بەشە؟ ئەم کردارە ناگەڕێتەوە.",
      lessonDeleteConfirm:
        "دڵنیایت لە سڕینەوەی ئەم وانەیە؟ ئەم کردارە ناگەڕێتەوە.",
      actionFailed: "کردارەکە سەرکەوتوو نەبوو.",
      toolbar: {
        paragraph: "پەرەگراف",
        heading2: "سەردێڕ ٢",
        heading3: "سەردێڕ ٣",
        bold: "تۆخ",
        italic: "لار",
        strike: "هێڵ بەسەر",
        bulletList: "لیستی خاڵدار",
        orderedList: "لیستی ژمارەدار",
        blockquote: "وتە",
        codeBlock: "بلۆکی کۆد",
        undo: "پاشگەزبوونەوە",
        redo: "دووبارە",
        image: "بارکردنی وێنە",
        attachment: "هاوپێچکردنی فایل",
        fullscreen: "پڕشاشە",
        exitFullscreen: sharedText.ku.labels.exitFullscreen,
        uploadFailed: "بارکردنی فایل سەرکەوتوو نەبوو.",
        alignLeft: "ڕیزکردن بۆ چەپ",
        alignCenter: "ڕیزکردن بۆ ناوەڕاست",
        alignRight: "ڕیزکردن بۆ ڕاست",
        directionLtr: "ئاڕاستەی LTR",
        directionRtl: "ئاڕاستەی RTL",
        separator: "زیادکردنی هێڵی جیاکەرەوە",
        separatorPrompt: "ناونیشانی هێڵی جیاکەرەوە (ئارەزوومەندانە)",
        imageAlignLeft: "وێنە بۆ چەپ",
        imageAlignCenter: "وێنە بۆ ناوەڕاست",
        imageAlignRight: "وێنە بۆ ڕاست",
        imageMove: "گواستنەوەی وێنە",
        imageDelete: "سڕینەوەی وێنە",
        imageResize: "گۆڕینی قەبارەی وێنە",
        imageActualSize: "قەبارەی ڕاستەقینە (100%)",
        placeholder: "دەست بە نووسین بکە...",
        link: "زیادکردنی بەستەر",
        unlink: "لابردنی بەستەر",
        linkPrompt: "URLی بەستەر بنووسە",
        linkInvalid: "URLی بەستەر دروست نییە.",
        dialogApply: "جێبەجێکردن",
        dialogCancel: "پاشگەزبوونەوە",
      },
    },
    categoryStatus: { ACTIVE: "چالاک", INACTIVE: "ناچالاک" },
    courseStatus: {
      DRAFT: sharedText.ku.status.DRAFT,
      PUBLISHED: sharedText.ku.status.PUBLISHED,
      ARCHIVED: sharedText.ku.status.ARCHIVED,
    },
    contentStatus: {
      DRAFT: sharedText.ku.status.DRAFT,
      PUBLISHED: sharedText.ku.status.PUBLISHED,
      ARCHIVED: sharedText.ku.status.ARCHIVED,
    },
  },
  ar: {
    navigation: "التعلّم الإلكتروني",
    contentAdministration: "إدارة المحتوى",
    coursesNavigation: "الدورات",
    categoriesNavigation: "التصنيفات",
    title: "التعلّم الإلكتروني",
    description: "إدارة دورات وتصنيفات منصة التعلّم الإلكتروني.",
    categoriesTitle: "تصنيفات الدورات",
    categoriesDescription: "تنظيم تصنيفات الدورات وإدارة حالتها وترتيبها.",
    coursesTitle: "الدورات",
    coursesDescription: "إدارة معلومات الدورات وحالتها وتصنيفها ومحتواها.",
    courseEditor: "محرر الدورة",
    courseEditorDescription: "إدارة أقسام الدورة وبنية الدروس.",
    searchCategories: "البحث في التصنيفات...",
    searchCourses: "البحث في الدورات...",
    allStatuses: "كل الحالات",
    allCategories: sharedText.ar.labels.allCategories,
    filter: uiChrome.ar.filter,
    clearFilters: sharedText.ar.labels.clearFilters,
    records: "سجل",
    previous: uiChrome.ar.previous,
    next: uiChrome.ar.next,
    coverImage: "صورة الغلاف",
    uploadCover: "رفع صورة",
    replaceCover: "استبدال الصورة",
    removeCover: "إزالة الصورة",
    uploadingCover: "جارٍ رفع الصورة...",
    coverUploadFailed: "تعذر رفع صورة الغلاف.",
    coverHelp:
      "ارفع صورة JPEG أو PNG أو WEBP أو GIF؛ يتم حفظ الملف عبر واجهة ملفات المنصة المحمية.",
    noCover: "لم يتم تعيين صورة غلاف",
    structure: "الأقسام / الدروس",
    editMetadata: "تعديل المعلومات",
    categories: "التصنيفات",
    courses: sharedText.ar.labels.courses,
    sections: sharedText.ar.labels.sections,
    lessons: sharedText.ar.labels.lessons,
    addCategory: "إضافة تصنيف",
    addCourse: "إضافة دورة",
    addSection: "إضافة قسم",
    addLesson: "إضافة درس",
    newCategory: "تصنيف جديد",
    editCategory: "تعديل التصنيف",
    newCourse: "دورة جديدة",
    editCourse: "تعديل الدورة",
    newSection: "قسم جديد",
    editSection: "تعديل القسم",
    newLesson: "درس جديد",
    editLesson: "تعديل الدرس",
    key: "المفتاح",
    slug: sharedText.ar.labels.slug,
    name: "الاسم",
    courseTitle: "عنوان الدورة",
    sectionTitle: "عنوان القسم",
    lessonTitle: "عنوان الدرس",
    descriptionField: "الوصف",
    summary: "الملخص",
    thumbnailUrl: "رابط صورة الغلاف",
    category: "التصنيف",
    status: "الحالة",
    sortOrder: "الترتيب",
    courseCount: "الدورات",
    sectionCount: "الأقسام",
    lessonCount: "الدروس",
    video: "الفيديو",
    videoPending: "يتم إرفاق وسائط الفيديو بشكل منفصل.",
    actions: uiChrome.ar.actions,
    view: uiChrome.ar.view,
    edit: uiChrome.ar.edit,
    back: "رجوع",
    save: "حفظ",
    saving: sharedText.ar.actions.saving,
    cancel: "إلغاء",
    noCategories: "لا توجد تصنيفات دورات.",
    noCourses: "لا توجد دورات.",
    noSections: "لا توجد أقسام.",
    noLessons: "لا توجد دروس.",
    editor: {
      professionalHint: "أدر الأقسام والدروس في صفحة واحدة مع السحب والإفلات.",
      dragSection: "سحب القسم",
      dragLesson: "سحب الدرس",
      addSection: "إضافة قسم",
      addLesson: "إضافة درس",
      editSection: "تعديل القسم",
      editLesson: "تعديل الدرس",
      sectionDialogHelp: "إدارة عنوان القسم ووصفه المنسق وحالته.",
      lessonDialogHelp: "إدارة عنوان الدرس ووصفه المنسق وحالته.",
      richDescription: "الوصف المنسق",
      moveHint:
        "استخدم مقبض السحب لإعادة ترتيب الأقسام والدروس أو نقل الدروس بين الأقسام.",
      structureSaving: "جارٍ حفظ الهيكل...",
      structureSaved: "تم حفظ الهيكل.",
      structureFailed: "تعذر حفظ الهيكل وتمت استعادة الترتيب السابق.",
      create: "إضافة",
      update: "تحديث",
      close: uiChrome.ar.close,
      emptySection: "لا توجد دروس في هذا القسم بعد.",
      lessonType: "درس",
      archive: "أرشفة",
      restore: "استعادة",
      delete: "حذف",
      sectionDeleteConfirm:
        "هل تريد حذف هذا القسم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",
      lessonDeleteConfirm:
        "هل تريد حذف هذا الدرس نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",
      actionFailed: "تعذر تنفيذ الإجراء.",
      toolbar: {
        paragraph: "فقرة",
        heading2: "عنوان 2",
        heading3: "عنوان 3",
        bold: "عريض",
        italic: "مائل",
        strike: "يتوسطه خط",
        bulletList: "قائمة نقطية",
        orderedList: "قائمة مرقمة",
        blockquote: "اقتباس",
        codeBlock: "كتلة كود",
        undo: "تراجع",
        redo: "إعادة",
        image: "رفع صورة",
        attachment: "إرفاق ملف",
        fullscreen: "ملء الشاشة",
        exitFullscreen: sharedText.ar.labels.exitFullscreen,
        uploadFailed: "تعذر رفع الملف.",
        alignLeft: "محاذاة لليسار",
        alignCenter: "توسيط",
        alignRight: "محاذاة لليمين",
        directionLtr: "اتجاه LTR",
        directionRtl: "اتجاه RTL",
        separator: "إدراج فاصل",
        separatorPrompt: "عنوان الفاصل (اختياري)",
        imageAlignLeft: "محاذاة الصورة لليسار",
        imageAlignCenter: "توسيط الصورة",
        imageAlignRight: "محاذاة الصورة لليمين",
        imageMove: "نقل الصورة",
        imageDelete: "حذف الصورة",
        imageResize: "تغيير حجم الصورة",
        imageActualSize: "الحجم الفعلي (100%)",
        placeholder: "ابدأ الكتابة...",
        link: "إضافة رابط",
        unlink: "إزالة الرابط",
        linkPrompt: "أدخل رابط URL",
        linkInvalid: "رابط URL غير صالح.",
        dialogApply: "تطبيق",
        dialogCancel: "إلغاء",
      },
    },
    categoryStatus: { ACTIVE: "نشط", INACTIVE: "غير نشط" },
    courseStatus: {
      DRAFT: sharedText.ar.status.DRAFT,
      PUBLISHED: sharedText.ar.status.PUBLISHED,
      ARCHIVED: sharedText.ar.status.ARCHIVED,
    },
    contentStatus: {
      DRAFT: sharedText.ar.status.DRAFT,
      PUBLISHED: sharedText.ar.status.PUBLISHED,
      ARCHIVED: sharedText.ar.status.ARCHIVED,
    },
  },
  en: {
    navigation: "E-Learning",
    contentAdministration: "Content administration",
    coursesNavigation: "Courses",
    categoriesNavigation: "Categories",
    title: "E-Learning",
    description: "Manage the OdooKRD e-learning course catalog.",
    categoriesTitle: "Course categories",
    categoriesDescription:
      "Organize course categories and manage their status and ordering.",
    coursesTitle: "Courses",
    coursesDescription:
      "Manage course information, lifecycle, category and learning structure.",
    courseEditor: "Course Editor",
    courseEditorDescription:
      "Manage the course sections and current lesson structure.",
    searchCategories: "Search categories...",
    searchCourses: "Search courses...",
    allStatuses: sharedText.en.labels.allStatuses,
    allCategories: sharedText.en.labels.allCategories,
    filter: uiChrome.en.filter,
    clearFilters: sharedText.en.labels.clearFilters,
    records: "records",
    previous: uiChrome.en.previous,
    next: uiChrome.en.next,
    coverImage: "Cover image",
    uploadCover: "Upload image",
    replaceCover: "Replace image",
    removeCover: "Remove image",
    uploadingCover: "Uploading image...",
    coverUploadFailed: "The cover image could not be uploaded.",
    coverHelp:
      "Upload JPEG, PNG, WEBP, GIF or SVG. The file is stored through the protected platform File API.",
    noCover: "No cover image assigned",
    structure: "Sections / lessons",
    editMetadata: "Edit information",
    categories: "Categories",
    courses: sharedText.en.labels.courses,
    sections: sharedText.en.labels.sections,
    lessons: sharedText.en.labels.lessons,
    addCategory: "Add category",
    addCourse: "Add course",
    addSection: "Add section",
    addLesson: "Add lesson",
    newCategory: "New course category",
    editCategory: "Edit course category",
    newCourse: "New course",
    editCourse: "Edit course",
    newSection: "New section",
    editSection: "Edit section",
    newLesson: "New lesson",
    editLesson: "Edit lesson",
    key: "Key",
    slug: sharedText.en.labels.slug,
    name: "Name",
    courseTitle: "Course title",
    sectionTitle: "Section title",
    lessonTitle: "Lesson title",
    descriptionField: "Description",
    summary: "Summary",
    thumbnailUrl: "Cover image URL",
    category: sharedText.en.labels.category,
    status: "Status",
    sortOrder: "Sort order",
    courseCount: "Courses",
    sectionCount: "Sections",
    lessonCount: "Lessons",
    video: "Video",
    videoPending: "Video media is attached separately.",
    actions: uiChrome.en.actions,
    view: uiChrome.en.view,
    edit: uiChrome.en.edit,
    back: "Back",
    save: "Save",
    saving: sharedText.en.actions.saving,
    cancel: "Cancel",
    noCategories: "No course categories are available.",
    noCourses: "No courses are available.",
    noSections: "No sections are available.",
    noLessons: "No lessons are available.",
    editor: {
      professionalHint:
        "Manage sections and lessons on one page with drag-and-drop ordering.",
      dragSection: "Drag section",
      dragLesson: "Drag lesson",
      addSection: "Add section",
      addLesson: "Add lesson",
      editSection: "Edit section",
      editLesson: "Edit lesson",
      sectionDialogHelp:
        "Manage the section title, rich description and lifecycle status.",
      lessonDialogHelp:
        "Manage the lesson title, rich description and lifecycle status.",
      richDescription: "Rich description",
      moveHint:
        "Use the drag handle to reorder sections and lessons or move lessons between sections.",
      structureSaving: "Saving structure...",
      structureSaved: "Structure saved.",
      structureFailed:
        "Structure could not be saved; the previous order was restored.",
      create: "Create",
      update: "Update",
      close: uiChrome.en.close,
      emptySection: "This section has no lessons yet.",
      lessonType: "Lesson",
      archive: "Archive",
      restore: sharedText.en.labels.restore,
      delete: "Delete",
      sectionDeleteConfirm:
        "Permanently delete this section? This action cannot be undone.",
      lessonDeleteConfirm:
        "Permanently delete this lesson? This action cannot be undone.",
      actionFailed: "The action could not be completed.",
      toolbar: {
        paragraph: "Paragraph",
        heading2: "Heading 2",
        heading3: "Heading 3",
        bold: "Bold",
        italic: "Italic",
        strike: "Strike",
        bulletList: "Bullet list",
        orderedList: "Numbered list",
        blockquote: "Blockquote",
        codeBlock: "Code block",
        undo: "Undo",
        redo: "Redo",
        image: "Upload image",
        attachment: "Attach file",
        fullscreen: "Full screen",
        exitFullscreen: sharedText.en.labels.exitFullscreen,
        uploadFailed: "The file could not be uploaded.",
        alignLeft: "Align left",
        alignCenter: "Align center",
        alignRight: "Align right",
        directionLtr: "Left-to-right",
        directionRtl: "Right-to-left",
        separator: "Insert separator",
        separatorPrompt: "Separator label (optional)",
        imageAlignLeft: "Align image left",
        imageAlignCenter: "Center image",
        imageAlignRight: "Align image right",
        imageMove: "Move image",
        imageDelete: "Delete image",
        imageResize: "Resize image",
        imageActualSize: "Actual size (100%)",
        placeholder: "Start writing...",
        link: "Insert link",
        unlink: "Remove link",
        linkPrompt: "Enter a URL",
        linkInvalid: "Enter a valid HTTP, HTTPS, or email URL.",
        dialogApply: "Apply",
        dialogCancel: "Cancel",
      },
    },
    categoryStatus: { ACTIVE: "Active", INACTIVE: "Inactive" },
    courseStatus: {
      DRAFT: sharedText.en.status.DRAFT,
      PUBLISHED: sharedText.en.status.PUBLISHED,
      ARCHIVED: sharedText.en.status.ARCHIVED,
    },
    contentStatus: {
      DRAFT: sharedText.en.status.DRAFT,
      PUBLISHED: sharedText.en.status.PUBLISHED,
      ARCHIVED: sharedText.en.status.ARCHIVED,
    },
  },
};
