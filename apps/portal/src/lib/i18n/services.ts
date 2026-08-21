import type {
  CompanyServiceStatus,
  Locale,
  ServiceCatalogStatus,
  ServiceCategory,
} from "@odookrd/types";

export interface ServicesDictionary {
  title: string;
  description: string;
  customerTitle: string;
  customerDescription: string;
  customerSummary: string;
  catalog: string;
  assignments: string;
  addService: string;
  assignService: string;
  editService: string;
  editAssignment: string;
  service: string;
  company: string;
  key: string;
  name: string;
  category: string;
  status: string;
  serviceDescription: string;
  displayName: string;
  serviceUrl: string;
  startsAt: string;
  expiresAt: string;
  notes: string;
  internalNotes: string;
  internalNotesHint: string;
  assignmentCount: string;
  created: string;
  actions: string;
  view: string;
  openService: string;
  back: string;
  save: string;
  saving: string;
  cancel: string;
  chooseCompany: string;
  chooseService: string;
  allStatuses: string;
  allCategories: string;
  records: string;
  previous: string;
  next: string;
  emptyCatalogTitle: string;
  emptyCatalogDescription: string;
  emptyAssignmentsTitle: string;
  emptyAssignmentsDescription: string;
  customerEmptyTitle: string;
  customerEmptyDescription: string;
  categoryLabels: Record<ServiceCategory, string>;
  catalogStatusLabels: Record<ServiceCatalogStatus, string>;
  assignmentStatusLabels: Record<CompanyServiceStatus, string>;
}

export const servicesDictionaries: Record<Locale, ServicesDictionary> = {
  ku: {
    title: "خزمەتگوزارییەکان",
    description:
      "خزمەتگوزارییەکانی پلاتفۆرم و دابەشکردنیان بۆ کۆمپانیاکان بەڕێوەببە.",
    customerTitle: "خزمەتگوزارییەکانی کۆمپانیا",
    customerDescription:
      "تەنها ئەو خزمەتگوزارییانە ببینە کە بۆ کۆمپانیاکەت تەرخان کراون.",
    customerSummary: "خزمەتگوزارییە چالاک و تەرخانکراوەکانی کۆمپانیاکەت ببینە.",
    catalog: "لیستی خزمەتگوزاری",
    assignments: "خزمەتگوزارییە تەرخانکراوەکان",
    addService: "زیادکردنی خزمەتگوزاری",
    assignService: "تەرخانکردنی خزمەتگوزاری",
    editService: "دەستکاریکردنی خزمەتگوزاری",
    editAssignment: "دەستکاریکردنی تەرخانکردن",
    service: "خزمەتگوزاری",
    company: "کۆمپانیا",
    key: "کلیلی خزمەتگوزاری",
    name: "ناو",
    category: "پۆل",
    status: "دۆخ",
    serviceDescription: "وەسف",
    displayName: "ناوی پیشاندراو",
    serviceUrl: "بەستەری خزمەتگوزاری",
    startsAt: "بەرواری دەستپێکردن",
    expiresAt: "بەرواری بەسەرچوون",
    notes: "تێبینییەکانی کڕیار",
    internalNotes: "تێبینییە ناوخۆییەکان",
    internalNotesHint: "تەنها بەڕێوەبەرانی پلاتفۆرم ئەم تێبینییانە دەبینن.",
    assignmentCount: "ژمارەی تەرخانکردن",
    created: "دروستکراوە",
    actions: "کردارەکان",
    view: "بینین",
    openService: "کردنەوەی خزمەتگوزاری",
    back: "گەڕانەوە",
    save: "پاشەکەوتکردن",
    saving: "پاشەکەوت دەکرێت...",
    cancel: "پاشگەزبوونەوە",
    chooseCompany: "کۆمپانیا هەڵبژێرە",
    chooseService: "خزمەتگوزاری هەڵبژێرە",
    allStatuses: "هەموو دۆخەکان",
    allCategories: "هەموو پۆلەکان",
    records: "تۆمار",
    previous: "پێشوو",
    next: "دواتر",
    emptyCatalogTitle: "هیچ خزمەتگوزارییەک نییە",
    emptyCatalogDescription: "یەکەم خزمەتگوزاریی پلاتفۆرم دروست بکە.",
    emptyAssignmentsTitle: "هیچ تەرخانکردنێک نییە",
    emptyAssignmentsDescription:
      "خزمەتگوزارییەک بۆ کۆمپانیایەکی چالاک تەرخان بکە.",
    customerEmptyTitle: "هێشتا خزمەتگوزارییەک تەرخان نەکراوە",
    customerEmptyDescription:
      "کاتێک خزمەتگوزاری بۆ کۆمپانیاکەت تەرخان بکرێت لێرە دەردەکەوێت.",
    categoryLabels: {
      ODOO: "Odoo",
      HOSTING: "خانەخوێی",
      DOMAIN: "دۆمەین",
      SUPPORT: "پاڵپشتی",
      TRAINING: "ڕاهێنان",
      OTHER: "هی تر",
    },
    catalogStatusLabels: { ACTIVE: "چالاک", INACTIVE: "ناچالاک" },
    assignmentStatusLabels: {
      PROVISIONING: "لە ئامادەکردندایە",
      ACTIVE: "چالاک",
      SUSPENDED: "ڕاگیراو",
      EXPIRED: "بەسەرچوو",
      CANCELLED: "هەڵوەشاوەتەوە",
    },
  },
  ar: {
    title: "الخدمات",
    description: "إدارة دليل خدمات المنصة وتخصيص الخدمات للشركات.",
    customerTitle: "خدمات الشركة",
    customerDescription: "عرض الخدمات المخصصة لشركتك فقط.",
    customerSummary: "عرض الخدمات النشطة والمخصصة لشركتك.",
    catalog: "دليل الخدمات",
    assignments: "الخدمات المخصصة",
    addService: "إضافة خدمة",
    assignService: "تخصيص خدمة",
    editService: "تعديل الخدمة",
    editAssignment: "تعديل التخصيص",
    service: "الخدمة",
    company: "الشركة",
    key: "مفتاح الخدمة",
    name: "الاسم",
    category: "الفئة",
    status: "الحالة",
    serviceDescription: "الوصف",
    displayName: "الاسم المعروض",
    serviceUrl: "رابط الخدمة",
    startsAt: "تاريخ البداية",
    expiresAt: "تاريخ الانتهاء",
    notes: "ملاحظات العميل",
    internalNotes: "الملاحظات الداخلية",
    internalNotesHint: "هذه الملاحظات ظاهرة لمسؤولي المنصة فقط.",
    assignmentCount: "عدد التخصيصات",
    created: "تاريخ الإنشاء",
    actions: "الإجراءات",
    view: "عرض",
    openService: "فتح الخدمة",
    back: "رجوع",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    cancel: "إلغاء",
    chooseCompany: "اختر الشركة",
    chooseService: "اختر الخدمة",
    allStatuses: "كل الحالات",
    allCategories: "كل الفئات",
    records: "سجل",
    previous: "السابق",
    next: "التالي",
    emptyCatalogTitle: "لا توجد خدمات",
    emptyCatalogDescription: "أنشئ أول خدمة ضمن دليل المنصة.",
    emptyAssignmentsTitle: "لا توجد خدمات مخصصة",
    emptyAssignmentsDescription: "خصص خدمة لشركة نشطة.",
    customerEmptyTitle: "لم يتم تخصيص خدمات بعد",
    customerEmptyDescription: "ستظهر الخدمات هنا عند تخصيصها لشركتك.",
    categoryLabels: {
      ODOO: "Odoo",
      HOSTING: "الاستضافة",
      DOMAIN: "النطاقات",
      SUPPORT: "الدعم",
      TRAINING: "التدريب",
      OTHER: "أخرى",
    },
    catalogStatusLabels: { ACTIVE: "نشط", INACTIVE: "غير نشط" },
    assignmentStatusLabels: {
      PROVISIONING: "قيد التجهيز",
      ACTIVE: "نشط",
      SUSPENDED: "موقوف",
      EXPIRED: "منتهي",
      CANCELLED: "ملغى",
    },
  },
  en: {
    title: "Services",
    description: "Manage the platform service catalog and company assignments.",
    customerTitle: "Company services",
    customerDescription: "View only the services assigned to your company.",
    customerSummary: "View your company’s active and assigned services.",
    catalog: "Service catalog",
    assignments: "Assigned services",
    addService: "Add service",
    assignService: "Assign service",
    editService: "Edit service",
    editAssignment: "Edit assignment",
    service: "Service",
    company: "Company",
    key: "Service key",
    name: "Name",
    category: "Category",
    status: "Status",
    serviceDescription: "Description",
    displayName: "Display name",
    serviceUrl: "Service URL",
    startsAt: "Start date",
    expiresAt: "Expiration date",
    notes: "Customer notes",
    internalNotes: "Internal notes",
    internalNotesHint: "Only platform administrators can see these notes.",
    assignmentCount: "Assignments",
    created: "Created",
    actions: "Actions",
    view: "View",
    openService: "Open service",
    back: "Back",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    chooseCompany: "Choose a company",
    chooseService: "Choose a service",
    allStatuses: "All statuses",
    allCategories: "All categories",
    records: "records",
    previous: "Previous",
    next: "Next",
    emptyCatalogTitle: "No services yet",
    emptyCatalogDescription:
      "Create the first service in your platform catalog.",
    emptyAssignmentsTitle: "No services assigned",
    emptyAssignmentsDescription: "Assign a service to an active company.",
    customerEmptyTitle: "No services assigned yet",
    customerEmptyDescription:
      "Services will appear here when they are assigned to your company.",
    categoryLabels: {
      ODOO: "Odoo",
      HOSTING: "Hosting",
      DOMAIN: "Domain",
      SUPPORT: "Support",
      TRAINING: "Training",
      OTHER: "Other",
    },
    catalogStatusLabels: { ACTIVE: "Active", INACTIVE: "Inactive" },
    assignmentStatusLabels: {
      PROVISIONING: "Provisioning",
      ACTIVE: "Active",
      SUSPENDED: "Suspended",
      EXPIRED: "Expired",
      CANCELLED: "Cancelled",
    },
  },
};
