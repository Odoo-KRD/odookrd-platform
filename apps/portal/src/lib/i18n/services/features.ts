import type {
  CompanyServiceFeatureSource,
  CompanyServiceLifecycleSource,
  Locale,
  ServiceFeatureValueType,
} from "@odookrd/types";
import type { NumberFeatureUnit } from "@/lib/service-feature-units";
import { uiChrome } from "../ui-chrome";
import { sharedText } from "../shared";

export interface ServiceFeaturesDictionary {
  overview: string;
  manageServices: string;
  companyServices: string;
  features: string;
  featureDefinitions: string;
  renewalRequests: string;
  renewalPipeline: string;
  featureDefinitionsDescription: string;
  newFeatureDefinition: string;
  editFeatureDefinition: string;
  applicableCategory: string;
  allCategories: string;
  parameterLabel: string;
  chooseFeature: string;
  noAvailableDefinitions: string;
  addPredefinedFeature: string;
  definitionInUse: string;
  serviceCount: string;
  featureCount: string;
  addFeature: string;
  editFeature: string;
  editAction: string;
  manageDefinitions: string;
  featureKey: string;
  featureName: string;
  featureDescription: string;
  valueType: string;
  defaultValue: string;
  effectiveValue: string;
  unit: string;
  noUnit: string;
  visibility: string;
  visibleToCustomer: string;
  platformOnly: string;
  inheritVisibility: string;
  sortOrder: string;
  yes: string;
  no: string;
  moveUp: string;
  moveDown: string;
  dragToReorder: string;
  orderSaved: string;
  orderSaveFailed: string;
  closeDialog: string;
  emptyFeaturesTitle: string;
  emptyFeaturesDescription: string;
  overrideFeature: string;
  resetFeature: string;
  syncFeatures: string;
  history: string;
  emptyHistory: string;
  changeStatus: string;
  transitionReason: string;
  reasonHint: string;
  source: string;
  actor: string;
  effectiveAt: string;
  initialStatus: string;
  searchCatalog: string;
  searchAssignments: string;
  search: string;
  allCompanies: string;
  allServices: string;
  startsFrom: string;
  startsTo: string;
  expiresFrom: string;
  expiresTo: string;
  customerNotes: string;
  valueTypes: Record<ServiceFeatureValueType, string>;
  numberUnitLabels: Record<NumberFeatureUnit, string>;
  featureSources: Record<CompanyServiceFeatureSource, string>;
  lifecycleSources: Record<CompanyServiceLifecycleSource, string>;
}

export const serviceFeatureDictionaries: Record<
  Locale,
  ServiceFeaturesDictionary
> = {
  ku: {
    overview: sharedText.ku.labels.overview,
    manageServices: sharedText.ku.labels.manageServices,
    companyServices: "خزمەتگوزارییەکانی کۆمپانیا",
    features: sharedText.ku.labels.features,
    featureDefinitions: sharedText.ku.labels.featureDefinitions,
    renewalRequests: sharedText.ku.labels.renewalRequests,
    renewalPipeline: sharedText.ku.labels.renewalPipeline,
    featureDefinitionsDescription:
      "تایبەتمەندییە ئامادەکراوەکان بەپێی پۆلی خزمەتگوزاری بەڕێوە ببە.",
    newFeatureDefinition: "زیادکردنی تایبەتمەندیی ئامادەکراو",
    editFeatureDefinition: "دەستکاریکردنی تایبەتمەندیی ئامادەکراو",
    applicableCategory: "پۆلی خزمەتگوزاری",
    allCategories: sharedText.ku.labels.allCategories,
    parameterLabel: "ناوی پێوەر",
    chooseFeature: "تایبەتمەندییەک هەڵبژێرە",
    noAvailableDefinitions:
      "هیچ تایبەتمەندییەکی چالاک بۆ ئەم پۆلە ئامادە نییە.",
    addPredefinedFeature: "زیادکردنی تایبەتمەندیی ئامادەکراو",
    definitionInUse:
      "پۆل، جۆری بەها و یەکە ناگۆڕدرێن کاتێک تایبەتمەندی بەکارهاتووە.",
    serviceCount: "خزمەتگوزارییەکان",
    featureCount: "ژمارەی تایبەتمەندییەکان",
    addFeature: "زیادکردنی تایبەتمەندی",
    editFeature: "دەستکاریکردنی تایبەتمەندی",
    editAction: "دەستکاری",
    manageDefinitions: "بەڕێوەبردنی پێناسەکان",
    featureKey: "کلیلی تایبەتمەندی",
    featureName: "ناوی تایبەتمەندی",
    featureDescription: "وەسفی تایبەتمەندی",
    valueType: "جۆری بەها",
    defaultValue: "بەهای بنەڕەتی",
    effectiveValue: "بەهای جێبەجێکراو",
    unit: "یەکە",
    noUnit: "بێ یەکە",
    visibility: "پیشاندان",
    visibleToCustomer: "پیشاندان بۆ کڕیار",
    platformOnly: "تەنها پلاتفۆرم",
    inheritVisibility: "بەپێی تایبەتمەندیی خزمەتگوزاری",
    sortOrder: "ڕیزبەندی",
    yes: sharedText.ku.labels.yes,
    no: sharedText.ku.labels.no,
    moveUp: "بگوازەوە بۆ سەرەوە",
    moveDown: "بگوازەوە بۆ خوارەوە",
    dragToReorder: "ڕایبکێشە بۆ ڕیزبەندی",
    orderSaved: "ڕیزبەندی پاشەکەوت کرا",
    orderSaveFailed: "پاشەکەوتکردنی ڕیزبەندی سەرکەوتوو نەبوو",
    closeDialog: "داخستن",
    emptyFeaturesTitle: "هیچ تایبەتمەندییەک نییە",
    emptyFeaturesDescription: "تایبەتمەندییەکانی ئەم خزمەتگوزارییە زیاد بکە.",
    overrideFeature: "پاشەکەوتکردنی بەهای تایبەت",
    resetFeature: "گەڕاندنەوە بۆ بەهای بنەڕەتی",
    syncFeatures: "زیادکردنی تایبەتمەندییە نوێیەکان",
    history: "مێژووی گۆڕانکاری",
    emptyHistory: "هێشتا هیچ گۆڕانکارییەک تۆمار نەکراوە.",
    changeStatus: uiChrome.ku.changeStatus,
    transitionReason: "هۆکاری گۆڕانکاری",
    reasonHint: "بۆ ڕاگرتن یان هەڵوەشاندنەوە هۆکار پێویستە.",
    source: "سەرچاوە",
    actor: "ئەنجامدەر",
    effectiveAt: "بەرواری جێبەجێکردن",
    initialStatus: "دۆخی سەرەتایی",
    searchCatalog: "گەڕان لە هەموو خزمەتگوزارییەکان",
    searchAssignments: "گەڕان لە هەموو خزمەتگوزارییە تەرخانکراوەکان",
    search: "گەڕان",
    allCompanies: sharedText.ku.labels.allCompanies,
    allServices: "هەموو خزمەتگوزارییەکان",
    startsFrom: "دەستپێکردن لە",
    startsTo: "دەستپێکردن تا",
    expiresFrom: "بەسەرچوون لە",
    expiresTo: "بەسەرچوون تا",
    customerNotes: "تێبینییەکانی کڕیار",
    valueTypes: {
      BOOLEAN: "بەڵێ / نەخێر",
      NUMBER: "ژمارە",
      STORAGE: "بیرگە",
      TEXT: "دەق",
    },
    numberUnitLabels: {
      users: "بەکارهێنەر",
      instances: "دانە",
      domains: "دۆمەین",
      hours: "کاتژمێر",
      days: "ڕۆژ",
      months: "مانگ",
      cores: "کۆر",
      seats: "شوێن",
    },
    featureSources: {
      CATALOG_DEFAULT: "بەهای بنەڕەتی",
      ADMIN_OVERRIDE: "بەهای تایبەت",
    },
    lifecycleSources: {
      ADMIN: "بەڕێوەبەر",
      SYSTEM: "سیستەم",
      INTEGRATION: "پەیوەستکردن",
    },
  },
  ar: {
    overview: sharedText.ar.labels.overview,
    manageServices: sharedText.ar.labels.manageServices,
    companyServices: "خدمات الشركات",
    features: "المميزات",
    featureDefinitions: sharedText.ar.labels.featureDefinitions,
    renewalRequests: sharedText.ar.labels.renewalRequests,
    renewalPipeline: sharedText.ar.labels.renewalPipeline,
    featureDefinitionsDescription:
      "إدارة المميزات المعرفة مسبقاً حسب فئة الخدمة.",
    newFeatureDefinition: "إضافة ميزة معرفة مسبقاً",
    editFeatureDefinition: "تعديل الميزة المعرفة مسبقاً",
    applicableCategory: "فئة الخدمة",
    allCategories: "جميع الفئات",
    parameterLabel: "اسم المعامل",
    chooseFeature: "اختر ميزة",
    noAvailableDefinitions: "لا توجد مميزات نشطة متاحة لهذه الفئة.",
    addPredefinedFeature: "إضافة ميزة معرفة مسبقاً",
    definitionInUse:
      "لا يمكن تغيير الفئة أو نوع القيمة أو الوحدة أثناء استخدام الميزة.",
    serviceCount: "الخدمات",
    featureCount: "عدد المميزات",
    addFeature: "إضافة ميزة",
    editFeature: "تعديل الميزة",
    editAction: "تعديل",
    manageDefinitions: "إدارة التعريفات",
    featureKey: "مفتاح الميزة",
    featureName: "اسم الميزة",
    featureDescription: "وصف الميزة",
    valueType: "نوع القيمة",
    defaultValue: "القيمة الافتراضية",
    effectiveValue: "القيمة المعتمدة",
    unit: "الوحدة",
    noUnit: "بدون وحدة",
    visibility: "إمكانية الظهور",
    visibleToCustomer: "ظاهرة للعميل",
    platformOnly: "المنصة فقط",
    inheritVisibility: "حسب إعدادات ميزة الخدمة",
    sortOrder: "الترتيب",
    yes: sharedText.ar.labels.yes,
    no: sharedText.ar.labels.no,
    moveUp: "نقل إلى الأعلى",
    moveDown: "نقل إلى الأسفل",
    dragToReorder: "اسحب لتغيير الترتيب",
    orderSaved: "تم حفظ الترتيب",
    orderSaveFailed: "تعذر حفظ الترتيب",
    closeDialog: "إغلاق",
    emptyFeaturesTitle: "لا توجد مميزات",
    emptyFeaturesDescription: "أضف المميزات التي تتضمنها هذه الخدمة.",
    overrideFeature: "حفظ القيمة المخصصة",
    resetFeature: "استعادة القيمة الافتراضية",
    syncFeatures: "إضافة المميزات الجديدة",
    history: "سجل التغييرات",
    emptyHistory: "لم يتم تسجيل أي تغييرات بعد.",
    changeStatus: uiChrome.ar.changeStatus,
    transitionReason: "سبب تغيير الحالة",
    reasonHint: "السبب مطلوب عند الإيقاف أو الإلغاء.",
    source: "المصدر",
    actor: "المنفذ",
    effectiveAt: "تاريخ السريان",
    initialStatus: "الحالة الأولية",
    searchCatalog: "البحث في جميع الخدمات",
    searchAssignments: "البحث في جميع خدمات الشركات",
    search: "بحث",
    allCompanies: sharedText.ar.labels.allCompanies,
    allServices: "كل الخدمات",
    startsFrom: "تبدأ من",
    startsTo: "تبدأ حتى",
    expiresFrom: "تنتهي من",
    expiresTo: "تنتهي حتى",
    customerNotes: "ملاحظات العميل",
    valueTypes: {
      BOOLEAN: "نعم / لا",
      NUMBER: "رقم",
      STORAGE: "مساحة تخزين",
      TEXT: "نص",
    },
    numberUnitLabels: {
      users: "مستخدمون",
      instances: "نسخ",
      domains: "نطاقات",
      hours: "ساعات",
      days: "أيام",
      months: "أشهر",
      cores: "أنوية",
      seats: "مقاعد",
    },
    featureSources: {
      CATALOG_DEFAULT: "القيمة الافتراضية",
      ADMIN_OVERRIDE: "قيمة مخصصة",
    },
    lifecycleSources: {
      ADMIN: "مسؤول",
      SYSTEM: "النظام",
      INTEGRATION: "تكامل",
    },
  },
  en: {
    overview: sharedText.en.labels.overview,
    manageServices: sharedText.en.labels.manageServices,
    companyServices: "Company services",
    features: sharedText.en.labels.features,
    featureDefinitions: sharedText.en.labels.featureDefinitions,
    renewalRequests: sharedText.en.labels.renewalRequests,
    renewalPipeline: sharedText.en.labels.renewalPipeline,
    featureDefinitionsDescription:
      "Manage reusable predefined features by service category.",
    newFeatureDefinition: "Add predefined feature",
    editFeatureDefinition: "Edit predefined feature",
    applicableCategory: "Applied to category",
    allCategories: sharedText.en.labels.allCategories,
    parameterLabel: "Feature parameter",
    chooseFeature: "Select a predefined feature",
    noAvailableDefinitions:
      "No active predefined features are available for this category.",
    addPredefinedFeature: "Add predefined feature",
    definitionInUse:
      "Category, value type, and unit cannot change while the feature is in use.",
    serviceCount: "Services",
    featureCount: "Features",
    addFeature: "Add feature",
    editFeature: "Edit feature",
    editAction: "Edit",
    manageDefinitions: "Manage definitions",
    featureKey: "Feature key",
    featureName: "Feature name",
    featureDescription: "Feature description",
    valueType: "Value type",
    defaultValue: "Default value",
    effectiveValue: "Effective value",
    unit: "Unit",
    noUnit: "No unit",
    visibility: "Visibility",
    visibleToCustomer: "Visible to customer",
    platformOnly: "Platform only",
    inheritVisibility: "Inherit service feature visibility",
    sortOrder: "Display order",
    yes: sharedText.en.labels.yes,
    no: sharedText.en.labels.no,
    moveUp: sharedText.en.actions.moveUp,
    moveDown: sharedText.en.actions.moveDown,
    dragToReorder: "Drag to reorder",
    orderSaved: "Order saved",
    orderSaveFailed: "Could not save the feature order",
    closeDialog: "Close",
    emptyFeaturesTitle: "No service features yet",
    emptyFeaturesDescription: "Add the capabilities included in this service.",
    overrideFeature: "Save custom value",
    resetFeature: "Reset to catalog default",
    syncFeatures: "Add missing catalog features",
    history: "Lifecycle history",
    emptyHistory: "No lifecycle events have been recorded yet.",
    changeStatus: uiChrome.en.changeStatus,
    transitionReason: "Reason for status change",
    reasonHint: "A reason is required when suspending or cancelling.",
    source: "Source",
    actor: "Changed by",
    effectiveAt: "Effective date",
    initialStatus: "Initial status",
    searchCatalog: "Search all catalog services",
    searchAssignments: "Search all company services",
    search: "Search",
    allCompanies: sharedText.en.labels.allCompanies,
    allServices: "All services",
    startsFrom: "Starts from",
    startsTo: "Starts to",
    expiresFrom: "Expires from",
    expiresTo: "Expires to",
    customerNotes: "Customer notes",
    valueTypes: {
      BOOLEAN: "Yes / No",
      NUMBER: "Number",
      STORAGE: "Storage",
      TEXT: "Text",
    },
    numberUnitLabels: {
      users: sharedText.en.labels.users,
      instances: "Instances",
      domains: "Domains",
      hours: "Hours",
      days: "Days",
      months: "Months",
      cores: "Cores",
      seats: "Seats",
    },
    featureSources: {
      CATALOG_DEFAULT: "Catalog default",
      ADMIN_OVERRIDE: "Custom override",
    },
    lifecycleSources: {
      ADMIN: "Administrator",
      SYSTEM: "System",
      INTEGRATION: "Integration",
    },
  },
};
