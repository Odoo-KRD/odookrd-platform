import type { Locale } from "@odookrd/types";

export interface KnowledgeAdminDictionary {
  section: string;
  categories: string;
  articles: string;
  categoriesTitle: string;
  categoriesDescription: string;
  newCategory: string;
  editCategory: string;
  name: string;
  descriptionField: string;
  parent: string;
  noParent: string;
  slug: string;
  slugHint: string;
  status: string;
  active: string;
  inactive: string;
  sortOrder: string;
  save: string;
  cancel: string;
  saving: string;
  edit: string;
  delete: string;
  deleteConfirm: string;
  articleCount: string;
  subcategories: string;
  emptyTitle: string;
  emptyDescription: string;
  depthLimit: string;
  articlesTitle: string;
  articlesDescription: string;
  newArticle: string;
  editArticle: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  tagsHint: string;
  category: string;
  allCategories: string;
  allStatuses: string;
  filter: string;
  clearFilters: string;
  searchArticles: string;
  searchCategories: string;
  draft: string;
  published: string;
  archived: string;
  publish: string;
  unpublish: string;
  publishedAt: string;
  noArticlesTitle: string;
  noArticlesDescription: string;
  previous: string;
  next: string;
  subcategoriesColumn: string;
  actions: string;
  records: string;
  search: string;
  activate: string;
  deactivate: string;
  reorder: string;
  reorderHint: string;
  reorderSaved: string;
  topLevel: string;
  selectCategory: string;
  status_: string;
  more: string;
}

export const knowledgeAdminDictionaries: Record<
  Locale,
  KnowledgeAdminDictionary
> = {
  ku: {
    section: "بنکەی زانیاری",
    categories: "پۆلەکان",
    articles: "بابەتەکان",
    categoriesTitle: "پۆلەکانی بنکەی زانیاری",
    categoriesDescription: "ڕێکخستنی پۆلەکان بۆ سێ ئاست.",
    newCategory: "پۆلی نوێ",
    editCategory: "دەستکاری پۆل",
    name: "ناو",
    descriptionField: "وەسف",
    parent: "پۆلی سەرەوە",
    noParent: "هیچ (ئاستی سەرەکی)",
    slug: "ناونیشانی بەستەر",
    slugHint: "بەتاڵی بهێڵەرەوە بۆ دروستکردنی خۆکار لە ناوەکەوە.",
    status: "دۆخ",
    active: "چالاک",
    inactive: "ناچالاک",
    sortOrder: "ڕیزبەندی",
    save: "پاشەکەوت",
    cancel: "پاشگەزبوونەوە",
    saving: "پاشەکەوتکردن...",
    edit: "دەستکاری",
    delete: "سڕینەوە",
    deleteConfirm: "دڵنیایت لە سڕینەوەی ئەم پۆلە؟",
    articleCount: "بابەت",
    subcategories: "ژێرپۆل",
    emptyTitle: "هیچ پۆلێک نییە",
    emptyDescription: "یەکەم پۆل دروست بکە بۆ دەستپێکردن.",
    depthLimit: "پۆلەکان تەنها بۆ سێ ئاست ڕێگەپێدراون.",
    articlesTitle: "بابەتەکانی بنکەی زانیاری",
    articlesDescription: "نووسین و بڵاوکردنەوەی بابەتەکان.",
    newArticle: "بابەتی نوێ",
    editArticle: "دەستکاری بابەت",
    title: "ناونیشان",
    excerpt: "کورتە",
    body: "ناوەڕۆک",
    tags: "تاگەکان",
    tagsHint: "بە کۆما جیایان بکەرەوە.",
    category: "پۆل",
    allCategories: "هەموو پۆلەکان",
    allStatuses: "هەموو دۆخەکان",
    filter: "پاڵاوتن",
    clearFilters: "سڕینەوەی پاڵاوتن",
    searchArticles: "گەڕان لە بابەتەکان",
    searchCategories: "گەڕان لە پۆلەکان",
    draft: "ڕەشنووس",
    published: "بڵاوکراوە",
    archived: "ئەرشیفکراو",
    publish: "بڵاوکردنەوە",
    unpublish: "لابردنی بڵاوکردنەوە",
    publishedAt: "بەرواری بڵاوکردنەوە",
    noArticlesTitle: "هیچ بابەتێک نییە",
    noArticlesDescription: "یەکەم بابەت بنووسە.",
    previous: "پێشوو",
    next: "دواتر",
    subcategoriesColumn: "ژێرپۆل",
    actions: "کردارەکان",
    records: "تۆمار",
    search: "گەڕان",
    activate: "چالاککردن",
    deactivate: "ناچالاککردن",
    reorder: "ڕێکخستنەوە",
    reorderHint: "بۆ گۆڕینی ڕیزبەندی، پۆلەکان ڕابکێشە.",
    reorderSaved: "ڕیزبەندی پاشەکەوت کرا.",
    topLevel: "ئاستی سەرەکی",
    selectCategory: "پۆلێک هەڵبژێرە",
    status_: "دۆخ",
    more: "زیاتر",
  },
  ar: {
    section: "قاعدة المعرفة",
    categories: "الفئات",
    articles: "المقالات",
    categoriesTitle: "فئات قاعدة المعرفة",
    categoriesDescription: "تنظيم الفئات حتى ثلاثة مستويات.",
    newCategory: "فئة جديدة",
    editCategory: "تعديل الفئة",
    name: "الاسم",
    descriptionField: "الوصف",
    parent: "الفئة الأم",
    noParent: "بدون (مستوى رئيسي)",
    slug: "المعرّف في الرابط",
    slugHint: "اتركه فارغاً ليُشتق تلقائياً من الاسم.",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    sortOrder: "الترتيب",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    edit: "تعديل",
    delete: "حذف",
    deleteConfirm: "هل تريد حذف هذه الفئة؟",
    articleCount: "مقالة",
    subcategories: "فئة فرعية",
    emptyTitle: "لا توجد فئات",
    emptyDescription: "أنشئ أول فئة للبدء.",
    depthLimit: "الفئات محدودة بثلاثة مستويات.",
    articlesTitle: "مقالات قاعدة المعرفة",
    articlesDescription: "كتابة المقالات ونشرها.",
    newArticle: "مقالة جديدة",
    editArticle: "تعديل المقالة",
    title: "العنوان",
    excerpt: "المقتطف",
    body: "المحتوى",
    tags: "الوسوم",
    tagsHint: "افصل بينها بفواصل.",
    category: "الفئة",
    allCategories: "كل الفئات",
    allStatuses: "كل الحالات",
    filter: "تصفية",
    clearFilters: "مسح التصفية",
    searchArticles: "ابحث في المقالات",
    searchCategories: "ابحث في الفئات",
    draft: "مسودة",
    published: "منشورة",
    archived: "مؤرشفة",
    publish: "نشر",
    unpublish: "إلغاء النشر",
    publishedAt: "تاريخ النشر",
    noArticlesTitle: "لا توجد مقالات",
    noArticlesDescription: "اكتب أول مقالة.",
    previous: "السابق",
    next: "التالي",
    subcategoriesColumn: "فئات فرعية",
    actions: "الإجراءات",
    records: "سجل",
    search: "بحث",
    activate: "تفعيل",
    deactivate: "تعطيل",
    reorder: "إعادة الترتيب",
    reorderHint: "اسحب الفئات لتغيير ترتيبها.",
    reorderSaved: "تم حفظ الترتيب.",
    topLevel: "المستوى الرئيسي",
    selectCategory: "اختر فئة",
    status_: "الحالة",
    more: "المزيد",
  },
  en: {
    section: "Knowledge base",
    categories: "Categories",
    articles: "Articles",
    categoriesTitle: "Knowledge base categories",
    categoriesDescription: "Organise categories up to three levels deep.",
    newCategory: "New category",
    editCategory: "Edit category",
    name: "Name",
    descriptionField: "Description",
    parent: "Parent category",
    noParent: "None (top level)",
    slug: "URL slug",
    slugHint: "Leave empty to derive it from the name.",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    sortOrder: "Sort order",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Delete this category?",
    articleCount: "articles",
    subcategories: "subcategories",
    emptyTitle: "No categories yet",
    emptyDescription: "Create the first category to get started.",
    depthLimit: "Categories are limited to three levels.",
    articlesTitle: "Knowledge base articles",
    articlesDescription: "Write and publish articles.",
    newArticle: "New article",
    editArticle: "Edit article",
    title: "Title",
    excerpt: "Excerpt",
    body: "Content",
    tags: "Tags",
    tagsHint: "Separate them with commas.",
    category: "Category",
    allCategories: "All categories",
    allStatuses: "All statuses",
    filter: "Filter",
    clearFilters: "Clear filters",
    searchArticles: "Search articles",
    searchCategories: "Search categories",
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    publish: "Publish",
    unpublish: "Unpublish",
    publishedAt: "Published",
    noArticlesTitle: "No articles yet",
    noArticlesDescription: "Write the first article.",
    previous: "Previous",
    next: "Next",
    subcategoriesColumn: "Subcategories",
    actions: "Actions",
    records: "records",
    search: "Search",
    activate: "Activate",
    deactivate: "Deactivate",
    reorder: "Reorder",
    reorderHint: "Drag categories to change their order within a parent.",
    reorderSaved: "Order saved.",
    topLevel: "Top level",
    selectCategory: "Select a category",
    status_: "Status",
    more: "More",
  },
};
