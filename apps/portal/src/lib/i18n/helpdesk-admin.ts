import type { Locale, TicketStatus } from "@odookrd/types";

export interface HelpdeskAdminDictionary {
  title: string;
  description: string;
  queue: string;
  allStatuses: string;
  allPriorities: string;
  allDepartments: string;
  allCompanies: string;
  anyAssignee: string;
  assignedToMe: string;
  unassigned: string;
  searchPlaceholder: string;
  search: string;
  clearFilters: string;
  columnTicket: string;
  columnCompany: string;
  columnStatus: string;
  columnPriority: string;
  columnAssignee: string;
  columnUpdated: string;
  columnActions: string;
  open: string;
  showing: string;
  previous: string;
  next: string;
  emptyTitle: string;
  emptyDescription: string;
  noResultsTitle: string;
  noResultsDescription: string;
  batchAssignMe: string;
  batchUnassign: string;
  batchInProgress: string;
  batchResolve: string;
  batchClose: string;
  batchDone: string;
  batchUnchanged: string;
  backToQueue: string;
  conversation: string;
  customer: string;
  you: string;
  supportTeam: string;
  internalNote: string;
  internalNoteBadge: string;
  reply: string;
  replyTab: string;
  noteTab: string;
  replyPlaceholder: string;
  notePlaceholder: string;
  replyWarning: string;
  noteWarning: string;
  send: string;
  sendNote: string;
  sending: string;
  statusAfterReply: string;
  keepStatus: string;
  noteNoAttachments: string;
  ticketDetails: string;
  reference: string;
  company: string;
  department: string;
  relatedService: string;
  openedBy: string;
  openedOn: string;
  lastActivity: string;
  firstResponse: string;
  notYet: string;
  status: string;
  priority: string;
  assignee: string;
  save: string;
  saving: string;
  saved: string;
  statuses: Record<TicketStatus, string>;
  departmentsTitle: string;
  departmentsDescription: string;
  addDepartment: string;
  newDepartment: string;
  editDepartment: string;
  departmentName: string;
  departmentDescription: string;
  slug: string;
  slugHint: string;
  sortOrder: string;
  sortOrderHint: string;
  active: string;
  archived: string;
  tickets: string;
  cancel: string;
  departmentsEmptyTitle: string;
  departmentsEmptyDescription: string;
  nameRequired: string;
  archiveHint: string;
  genericError: string;
}

export const helpdeskAdminDictionaries: Record<
  Locale,
  HelpdeskAdminDictionary
> = {
  ku: {
    title: "ڕیزی پشتگیری",
    description:
      "هەموو داواکارییەکانی پشتگیری کۆمپانیاکان. فلتەر بکە، بیانسپێرە و وەڵام بدەرەوە.",
    queue: "ڕیز",
    allStatuses: "هەموو دۆخەکان",
    allPriorities: "هەموو ئاستەکان",
    allDepartments: "هەموو بەشەکان",
    allCompanies: "هەموو کۆمپانیاکان",
    anyAssignee: "هەموو ئەندامەکان",
    assignedToMe: "سپێردراو بە من",
    unassigned: "نەسپێردراو",
    searchPlaceholder: "گەڕان بە ژمارە یان بابەت...",
    search: "گەڕان",
    clearFilters: "پاککردنەوە",
    columnTicket: "داواکاری",
    columnCompany: "کۆمپانیا",
    columnStatus: "دۆخ",
    columnPriority: "گرنگی",
    columnAssignee: "سپێردراوە بە",
    columnUpdated: "نوێکراوەتەوە",
    columnActions: "کردار",
    open: "کردنەوە",
    showing: "پیشاندانی {shown} لە {total} داواکاری",
    previous: "پێشوو",
    next: "دواتر",
    emptyTitle: "هیچ داواکارییەک نییە",
    emptyDescription: "هێشتا هیچ داواکارییەکی پشتگیری نەنێردراوە.",
    noResultsTitle: "هیچ داواکارییەک نەدۆزرایەوە",
    noResultsDescription: "فلتەرەکان بگۆڕە یان پاکیان بکەرەوە.",
    batchAssignMe: "سپاردن بە من",
    batchUnassign: "لابردنی سپاردن",
    batchInProgress: "گۆڕین بۆ: لە کارکردندایە",
    batchResolve: "نیشانکردن وەک چارەسەرکراو",
    batchClose: "داخستن",
    batchDone: "{count} داواکاری نوێکرایەوە.",
    batchUnchanged: "هیچ گۆڕانکارییەک نەکرا.",
    backToQueue: "ڕیزی پشتگیری",
    conversation: "گفتوگۆ",
    customer: "کڕیار",
    you: "تۆ",
    supportTeam: "تیمی پشتگیری",
    internalNote: "تێبینی ناوخۆیی",
    internalNoteBadge: "ناوخۆیی — کڕیار نایبینێت",
    reply: "وەڵام",
    replyTab: "وەڵام بۆ کڕیار",
    noteTab: "تێبینی ناوخۆیی",
    replyPlaceholder: "وەڵامەکەت بۆ کڕیار بنووسە...",
    notePlaceholder: "تێبینی ناوخۆیی بۆ تیمی پشتگیری...",
    replyWarning: "ئەم پەیامە کڕیار دەیبینێت.",
    noteWarning: "ئەمە تێبینییەکی ناوخۆییە و کڕیار هەرگیز نایبینێت.",
    send: "ناردنی وەڵام",
    sendNote: "زیادکردنی تێبینی",
    sending: "ناردن...",
    statusAfterReply: "دۆخ دوای وەڵام",
    keepStatus: "بەبێ گۆڕین",
    noteNoAttachments: "تێبینی ناوخۆیی هاوپێچی پێوە نابێت.",
    ticketDetails: "زانیاری داواکاری",
    reference: "ژمارە",
    company: "کۆمپانیا",
    department: "بەش",
    relatedService: "خزمەتگوزاری",
    openedBy: "کراوەتەوە لەلایەن",
    openedOn: "کراوەتەوە لە",
    lastActivity: "دوایین چالاکی",
    firstResponse: "یەکەم وەڵام",
    notYet: "هێشتا نا",
    status: "دۆخ",
    priority: "گرنگی",
    assignee: "سپێردراوە بە",
    save: "پاشەکەوتکردن",
    saving: "پاشەکەوت...",
    saved: "پاشەکەوت کرا.",
    statuses: {
      OPEN: "کراوە",
      IN_PROGRESS: "لە کارکردندایە",
      WAITING_ON_CUSTOMER: "چاوەڕێی کڕیار",
      RESOLVED: "چارەسەرکرا",
      CLOSED: "داخرا",
    },
    departmentsTitle: "بەشەکانی پشتگیری",
    departmentsDescription:
      "ئەو بەشانەی کڕیار لە کاتی ناردنی داواکاری هەڵیاندەبژێرێت. بەشێک کە داواکاری هەیە ئەرشیف بکە، مەیسڕەوە.",
    addDepartment: "زیادکردنی بەش",
    newDepartment: "بەشی نوێ",
    editDepartment: "دەستکاریکردنی بەش",
    departmentName: "ناو",
    departmentDescription: "وەسف",
    slug: "ناسێنەر (slug)",
    slugHint: "بەتاڵی بهێڵە تا لە ناوی ئینگلیزی دروست بکرێت.",
    sortOrder: "ڕیزبەندی",
    sortOrderHint: "ژمارەی بچووکتر زووتر پیشان دەدرێت.",
    active: "چالاک",
    archived: "ئەرشیفکراو",
    tickets: "داواکاری",
    cancel: "هەڵوەشاندنەوە",
    departmentsEmptyTitle: "هیچ بەشێک نییە",
    departmentsEmptyDescription:
      "یەکەم بەش زیاد بکە تا کڕیاران داواکاری بنێرن.",
    nameRequired: "ناوێک بنووسە.",
    archiveHint:
      "بەشی ئەرشیفکراو لە فۆڕمی داواکاری نوێ پیشان نادرێت، بەڵام داواکارییە کۆنەکانی دەمێننەوە.",
    genericError: "کردارەکە تەواو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.",
  },
  ar: {
    title: "قائمة الدعم",
    description:
      "جميع طلبات الدعم من الشركات. صفِّ الطلبات وأسندها وردّ عليها.",
    queue: "القائمة",
    allStatuses: "جميع الحالات",
    allPriorities: "جميع الأولويات",
    allDepartments: "جميع الأقسام",
    allCompanies: "جميع الشركات",
    anyAssignee: "جميع الأعضاء",
    assignedToMe: "المسندة إليّ",
    unassigned: "غير مسندة",
    searchPlaceholder: "ابحث بالرقم أو الموضوع...",
    search: "بحث",
    clearFilters: "مسح",
    columnTicket: "الطلب",
    columnCompany: "الشركة",
    columnStatus: "الحالة",
    columnPriority: "الأولوية",
    columnAssignee: "مُسند إلى",
    columnUpdated: "آخر تحديث",
    columnActions: "إجراءات",
    open: "فتح",
    showing: "عرض {shown} من {total} طلب",
    previous: "السابق",
    next: "التالي",
    emptyTitle: "لا توجد طلبات",
    emptyDescription: "لم يتم إرسال أي طلب دعم بعد.",
    noResultsTitle: "لم يتم العثور على طلبات",
    noResultsDescription: "غيّر عوامل التصفية أو امسحها.",
    batchAssignMe: "إسناد إليّ",
    batchUnassign: "إلغاء الإسناد",
    batchInProgress: "تغيير إلى: قيد المعالجة",
    batchResolve: "وضع علامة تم الحل",
    batchClose: "إغلاق",
    batchDone: "تم تحديث {count} طلب.",
    batchUnchanged: "لم يتغير شيء.",
    backToQueue: "قائمة الدعم",
    conversation: "المحادثة",
    customer: "العميل",
    you: "أنت",
    supportTeam: "فريق الدعم",
    internalNote: "ملاحظة داخلية",
    internalNoteBadge: "داخلية — لا يراها العميل",
    reply: "الرد",
    replyTab: "رد إلى العميل",
    noteTab: "ملاحظة داخلية",
    replyPlaceholder: "اكتب ردك إلى العميل...",
    notePlaceholder: "ملاحظة داخلية لفريق الدعم...",
    replyWarning: "سيرى العميل هذه الرسالة.",
    noteWarning: "هذه ملاحظة داخلية ولن يراها العميل أبداً.",
    send: "إرسال الرد",
    sendNote: "إضافة ملاحظة",
    sending: "جارٍ الإرسال...",
    statusAfterReply: "الحالة بعد الرد",
    keepStatus: "دون تغيير",
    noteNoAttachments: "الملاحظات الداخلية لا تحمل مرفقات.",
    ticketDetails: "تفاصيل الطلب",
    reference: "الرقم",
    company: "الشركة",
    department: "القسم",
    relatedService: "الخدمة",
    openedBy: "فتحها",
    openedOn: "تاريخ الفتح",
    lastActivity: "آخر نشاط",
    firstResponse: "أول رد",
    notYet: "لا يوجد بعد",
    status: "الحالة",
    priority: "الأولوية",
    assignee: "مُسند إلى",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ.",
    statuses: {
      OPEN: "مفتوحة",
      IN_PROGRESS: "قيد المعالجة",
      WAITING_ON_CUSTOMER: "بانتظار العميل",
      RESOLVED: "تم الحل",
      CLOSED: "مغلقة",
    },
    departmentsTitle: "أقسام الدعم",
    departmentsDescription:
      "الأقسام التي يختارها العميل عند إرسال الطلب. القسم الذي يحتوي على طلبات يُؤرشف ولا يُحذف.",
    addDepartment: "إضافة قسم",
    newDepartment: "قسم جديد",
    editDepartment: "تعديل القسم",
    departmentName: "الاسم",
    departmentDescription: "الوصف",
    slug: "المعرّف (slug)",
    slugHint: "اتركه فارغاً ليُنشأ من الاسم الإنجليزي.",
    sortOrder: "الترتيب",
    sortOrderHint: "الرقم الأصغر يظهر أولاً.",
    active: "نشط",
    archived: "مؤرشف",
    tickets: "الطلبات",
    cancel: "إلغاء",
    departmentsEmptyTitle: "لا توجد أقسام",
    departmentsEmptyDescription: "أضف أول قسم ليتمكن العملاء من إرسال الطلبات.",
    nameRequired: "أدخل اسماً.",
    archiveHint:
      "القسم المؤرشف لا يظهر في نموذج الطلب الجديد، لكن طلباته السابقة تبقى كما هي.",
    genericError: "تعذّر إكمال العملية. يرجى المحاولة مرة أخرى.",
  },
  en: {
    title: "Support queue",
    description:
      "Every support ticket from every company. Filter, assign and reply.",
    queue: "Queue",
    allStatuses: "All statuses",
    allPriorities: "All priorities",
    allDepartments: "All departments",
    allCompanies: "All companies",
    anyAssignee: "Anyone",
    assignedToMe: "Assigned to me",
    unassigned: "Unassigned",
    searchPlaceholder: "Search by reference or subject...",
    search: "Search",
    clearFilters: "Clear",
    columnTicket: "Ticket",
    columnCompany: "Company",
    columnStatus: "Status",
    columnPriority: "Priority",
    columnAssignee: "Assignee",
    columnUpdated: "Updated",
    columnActions: "Actions",
    open: "Open",
    showing: "Showing {shown} of {total} tickets",
    previous: "Previous",
    next: "Next",
    emptyTitle: "No tickets",
    emptyDescription: "No support ticket has been filed yet.",
    noResultsTitle: "No tickets found",
    noResultsDescription: "Change or clear the filters.",
    batchAssignMe: "Assign to me",
    batchUnassign: "Unassign",
    batchInProgress: "Set to: In progress",
    batchResolve: "Mark resolved",
    batchClose: "Close",
    batchDone: "{count} tickets updated.",
    batchUnchanged: "Nothing changed.",
    backToQueue: "Support queue",
    conversation: "Conversation",
    customer: "Customer",
    you: "You",
    supportTeam: "Support team",
    internalNote: "Internal note",
    internalNoteBadge: "Internal — the customer cannot see this",
    reply: "Reply",
    replyTab: "Reply to customer",
    noteTab: "Internal note",
    replyPlaceholder: "Write your reply to the customer...",
    notePlaceholder: "Internal note for the support team...",
    replyWarning: "The customer will see this message.",
    noteWarning: "This is an internal note; the customer never sees it.",
    send: "Send reply",
    sendNote: "Add note",
    sending: "Sending...",
    statusAfterReply: "Status after replying",
    keepStatus: "Leave unchanged",
    noteNoAttachments: "Internal notes cannot carry attachments.",
    ticketDetails: "Ticket details",
    reference: "Reference",
    company: "Company",
    department: "Department",
    relatedService: "Service",
    openedBy: "Opened by",
    openedOn: "Opened on",
    lastActivity: "Last activity",
    firstResponse: "First response",
    notYet: "Not yet",
    status: "Status",
    priority: "Priority",
    assignee: "Assignee",
    save: "Save",
    saving: "Saving...",
    saved: "Saved.",
    statuses: {
      OPEN: "Open",
      IN_PROGRESS: "In progress",
      WAITING_ON_CUSTOMER: "Waiting on customer",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
    },
    departmentsTitle: "Support departments",
    departmentsDescription:
      "The departments customers choose from when they open a ticket. A department with tickets is archived, not deleted.",
    addDepartment: "Add department",
    newDepartment: "New department",
    editDepartment: "Edit department",
    departmentName: "Name",
    departmentDescription: "Description",
    slug: "Slug",
    slugHint: "Leave empty to generate it from the English name.",
    sortOrder: "Sort order",
    sortOrderHint: "Lower numbers are shown first.",
    active: "Active",
    archived: "Archived",
    tickets: "Tickets",
    cancel: "Cancel",
    departmentsEmptyTitle: "No departments",
    departmentsEmptyDescription:
      "Add the first department so customers can open tickets.",
    nameRequired: "Enter a name.",
    archiveHint:
      "An archived department is hidden from the new-ticket form; its existing tickets stay as they are.",
    genericError: "The action could not be completed. Please try again.",
  },
};
