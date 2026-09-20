import type { Locale, TicketPriority, TicketStatus } from "@odookrd/types";

interface StatCard {
  label: string;
  caption: string;
}

export interface HelpdeskDictionary {
  navigation: string;
  eyebrow: string;
  title: string;
  description: string;
  newTicket: string;
  scopeCompany: string;
  scopeOwn: string;
  stats: {
    open: StatCard;
    inProgress: StatCard;
    waiting: StatCard;
    resolved: StatCard;
  };
  allTickets: string;
  statuses: Record<TicketStatus, string>;
  /** Shorter status names for the filter tabs. */
  statusTabs: Record<TicketStatus, string>;
  priorities: Record<TicketPriority, string>;
  searchPlaceholder: string;
  search: string;
  clearFilters: string;
  columnTicket: string;
  columnStatus: string;
  columnPriority: string;
  columnOpenedBy: string;
  columnUpdated: string;
  columnActions: string;
  view: string;
  showing: string;
  previous: string;
  next: string;
  emptyTitle: string;
  emptyDescription: string;
  noResultsTitle: string;
  noResultsDescription: string;
  backToTickets: string;
  newTicketTitle: string;
  newTicketDescription: string;
  stepDepartment: string;
  stepDetails: string;
  department: string;
  subject: string;
  subjectPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  attachments: string;
  attachmentsHint: string;
  dropFiles: string;
  browseFiles: string;
  uploading: string;
  removeFile: string;
  uploadFailed: string;
  tooManyFiles: string;
  visibilityNote: string;
  submitTicket: string;
  submitting: string;
  tipsTitle: string;
  tips: string[];
  knowledgePrompt: string;
  knowledgeLink: string;
  conversation: string;
  you: string;
  supportTeam: string;
  supportBadge: string;
  ticketDetails: string;
  reference: string;
  priority: string;
  status: string;
  openedBy: string;
  openedOn: string;
  lastActivity: string;
  reply: string;
  replyPlaceholder: string;
  sendReply: string;
  sending: string;
  resolvedHint: string;
  waitingHint: string;
  closeTicket: string;
  closeTicketHint: string;
  closeSelected: string;
  batchClosed: string;
  batchAlreadyClosed: string;
  closeConfirm: string;
  closing: string;
  closedNotice: string;
  departmentRequired: string;
  subjectRequired: string;
  messageRequired: string;
  genericError: string;
}

export const helpdeskDictionaries: Record<Locale, HelpdeskDictionary> = {
  ku: {
    navigation: "ناوەندی پشتگیری",
    eyebrow: "ناوەندی پشتگیری",
    title: "داواکارییەکانی پشتگیری",
    description:
      "هەموو گفتوگۆکانت لەگەڵ تیمی پشتگیری لە یەک شوێندا. داواکاری نوێ بنێرە و وەڵامەکان بەدوادا بچە.",
    newTicket: "داواکاری نوێ",
    scopeCompany: "هەموو داواکارییەکانی کۆمپانیاکەت پیشان دەدرێن.",
    scopeOwn: "تەنها ئەو داواکارییانە پیشان دەدرێن کە خۆت کردوتەوە.",
    stats: {
      open: { label: "کراوە", caption: "چاوەڕێی تیمی پشتگیری" },
      inProgress: {
        label: "لە کارکردندایە",
        caption: "تیمی پشتگیری کاری لەسەر دەکات",
      },
      waiting: { label: "چاوەڕێی تۆیە", caption: "پێویستی بە وەڵامی تۆیە" },
      resolved: { label: "چارەسەرکراو", caption: "کێشەکان چارەسەر کران" },
    },
    allTickets: "هەموو",
    statuses: {
      OPEN: "کراوە",
      IN_PROGRESS: "لە کارکردندایە",
      WAITING_ON_CUSTOMER: "چاوەڕێی وەڵامی تۆیە",
      RESOLVED: "چارەسەرکرا",
      CLOSED: "داخرا",
    },
    statusTabs: {
      OPEN: "کراوە",
      IN_PROGRESS: "لە کارکردندا",
      WAITING_ON_CUSTOMER: "چاوەڕێ",
      RESOLVED: "چارەسەرکراو",
      CLOSED: "داخراو",
    },
    priorities: {
      LOW: "نزم",
      NORMAL: "ئاسایی",
      HIGH: "بەرز",
      URGENT: "بەپەلە",
    },
    searchPlaceholder: "گەڕان بە ژمارە یان بابەت...",
    search: "گەڕان",
    clearFilters: "پاککردنەوە",
    columnTicket: "داواکاری",
    columnStatus: "دۆخ",
    columnPriority: "گرنگی",
    columnOpenedBy: "کراوەتەوە لەلایەن",
    columnUpdated: "نوێکراوەتەوە",
    columnActions: "کردار",
    view: "بینین",
    showing: "پیشاندانی {shown} لە {total} داواکاری",
    previous: "پێشوو",
    next: "دواتر",
    emptyTitle: "هێشتا هیچ داواکارییەک نییە",
    emptyDescription: "ئەگەر پێویستت بە یارمەتی هەیە، داواکارییەکی نوێ بنێرە.",
    noResultsTitle: "هیچ داواکارییەک نەدۆزرایەوە",
    noResultsDescription: "گەڕانەکە یان فلتەرەکە بگۆڕە.",
    backToTickets: "داواکارییەکان",
    newTicketTitle: "داواکاری پشتگیری نوێ",
    newTicketDescription:
      "کێشەکەت بە وردی باس بکە تا تیمی پشتگیری بە خێرایی یارمەتیت بدات.",
    stepDepartment: "بەشێک هەڵبژێرە",
    stepDetails: "کێشەکە باس بکە",
    department: "بەش",
    subject: "بابەت",
    subjectPlaceholder: "کورتەیەک لە کێشەکە",
    message: "پەیام",
    messagePlaceholder:
      "چی ڕوویدا؟ چی چاوەڕێ دەکرد؟ هەنگاوەکانی دووبارەکردنەوەی کێشەکە بنووسە.",
    attachments: "هاوپێچەکان",
    attachmentsHint: "تا ٥ فایل: PDF، وێنە، بەڵگەنامەی Office یان ZIP.",
    dropFiles: "فایلەکان ڕابکێشە ئێرە یان",
    browseFiles: "هەڵبژاردنی فایل",
    uploading: "بارکردن...",
    removeFile: "لابردن",
    uploadFailed: "بارکردنی فایلەکە سەرکەوتوو نەبوو.",
    tooManyFiles: "زۆرترین ژمارەی فایل ٥ دانەیە.",
    visibilityNote:
      "تیمی پشتگیری و بەڕێوەبەرانی کۆمپانیاکەت دەتوانن ئەم داواکارییە ببینن.",
    submitTicket: "ناردنی داواکاری",
    submitting: "ناردن...",
    tipsTitle: "پێش ناردن",
    tips: [
      "یەک کێشە بۆ هەر داواکارییەک؛ کێشەی جیاواز لە داواکاری جیاوازدا بنێرە.",
      "پەیامی هەڵە، ناونیشانی پەڕە یان ناوی ڕاپۆرتەکە بنووسە.",
      "وێنەی شاشە یان فایلی پەیوەندیدار هاوپێچ بکە.",
    ],
    knowledgePrompt: "زۆربەی وەڵامەکان لە بنکەی زانیاریدا هەن.",
    knowledgeLink: "گەڕان لە بنکەی زانیاری",
    conversation: "گفتوگۆ",
    you: "تۆ",
    supportTeam: "تیمی پشتگیری",
    supportBadge: "پشتگیری",
    ticketDetails: "زانیاری داواکاری",
    reference: "ژمارە",
    priority: "گرنگی",
    status: "دۆخ",
    openedBy: "کراوەتەوە لەلایەن",
    openedOn: "کراوەتەوە لە",
    lastActivity: "دوایین چالاکی",
    reply: "وەڵام",
    replyPlaceholder: "وەڵامەکەت بنووسە...",
    sendReply: "ناردنی وەڵام",
    sending: "ناردن...",
    resolvedHint:
      "ئەم داواکارییە چارەسەرکراوە. ئەگەر کێشەکە هێشتا ماوە، وەڵام بدەرەوە تا دووبارە بکرێتەوە.",
    waitingHint: "تیمی پشتگیری چاوەڕێی وەڵامی تۆیە.",
    closeTicket: "داخستنی داواکاری",
    closeSelected: "داخستنی داواکارییە هەڵبژێردراوەکان",
    batchClosed: "{count} داواکاری داخران.",
    batchAlreadyClosed: "داواکارییە هەڵبژێردراوەکان پێشتر داخرابوون.",
    closeTicketHint:
      "ئەگەر کێشەکەت چارەسەر بوو، دەتوانیت داواکارییەکە دابخەیت.",
    closeConfirm:
      "دڵنیایت لە داخستنی ئەم داواکارییە؟ دوای داخستن ناتوانیت وەڵام بدەیتەوە.",
    closing: "داخستن...",
    closedNotice:
      "ئەم داواکارییە داخراوە. ئەگەر یارمەتی زیاترت پێویستە، داواکارییەکی نوێ بنێرە.",
    departmentRequired: "بەشێک هەڵبژێرە.",
    subjectRequired: "بابەت بنووسە.",
    messageRequired: "پەیام بنووسە.",
    genericError: "داواکارییەکە تەواو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.",
  },
  ar: {
    navigation: "مركز الدعم",
    eyebrow: "مركز الدعم",
    title: "طلبات الدعم",
    description:
      "جميع محادثاتك مع فريق الدعم في مكان واحد. أرسل طلباً جديداً وتابع الردود.",
    newTicket: "طلب جديد",
    scopeCompany: "تُعرض جميع طلبات شركتك.",
    scopeOwn: "تُعرض الطلبات التي فتحتها أنت فقط.",
    stats: {
      open: { label: "مفتوحة", caption: "بانتظار فريق الدعم" },
      inProgress: { label: "قيد المعالجة", caption: "يعمل عليها فريق الدعم" },
      waiting: { label: "بانتظارك", caption: "تحتاج إلى ردك" },
      resolved: { label: "تم حلها", caption: "مشكلات تم حلها" },
    },
    allTickets: "الكل",
    statuses: {
      OPEN: "مفتوحة",
      IN_PROGRESS: "قيد المعالجة",
      WAITING_ON_CUSTOMER: "بانتظار ردك",
      RESOLVED: "تم الحل",
      CLOSED: "مغلقة",
    },
    statusTabs: {
      OPEN: "مفتوحة",
      IN_PROGRESS: "قيد المعالجة",
      WAITING_ON_CUSTOMER: "بانتظارك",
      RESOLVED: "تم حلها",
      CLOSED: "مغلقة",
    },
    priorities: {
      LOW: "منخفضة",
      NORMAL: "عادية",
      HIGH: "عالية",
      URGENT: "عاجلة",
    },
    searchPlaceholder: "ابحث بالرقم أو الموضوع...",
    search: "بحث",
    clearFilters: "مسح",
    columnTicket: "الطلب",
    columnStatus: "الحالة",
    columnPriority: "الأولوية",
    columnOpenedBy: "فتحها",
    columnUpdated: "آخر تحديث",
    columnActions: "إجراءات",
    view: "عرض",
    showing: "عرض {shown} من {total} طلب",
    previous: "السابق",
    next: "التالي",
    emptyTitle: "لا توجد طلبات بعد",
    emptyDescription: "إذا كنت بحاجة إلى مساعدة، أرسل طلباً جديداً.",
    noResultsTitle: "لم يتم العثور على طلبات",
    noResultsDescription: "غيّر البحث أو عامل التصفية.",
    backToTickets: "الطلبات",
    newTicketTitle: "طلب دعم جديد",
    newTicketDescription:
      "صف مشكلتك بالتفصيل ليتمكن فريق الدعم من مساعدتك بسرعة.",
    stepDepartment: "اختر القسم",
    stepDetails: "صف المشكلة",
    department: "القسم",
    subject: "الموضوع",
    subjectPlaceholder: "ملخص قصير للمشكلة",
    message: "الرسالة",
    messagePlaceholder:
      "ماذا حدث؟ وما الذي كنت تتوقعه؟ اذكر خطوات إعادة المشكلة.",
    attachments: "المرفقات",
    attachmentsHint: "حتى ٥ ملفات: PDF أو صور أو مستندات Office أو ZIP.",
    dropFiles: "اسحب الملفات إلى هنا أو",
    browseFiles: "اختر ملفات",
    uploading: "جارٍ الرفع...",
    removeFile: "إزالة",
    uploadFailed: "تعذّر رفع الملف.",
    tooManyFiles: "الحد الأقصى ٥ ملفات.",
    visibilityNote: "يمكن لفريق الدعم ومسؤولي شركتك الاطلاع على هذا الطلب.",
    submitTicket: "إرسال الطلب",
    submitting: "جارٍ الإرسال...",
    tipsTitle: "قبل الإرسال",
    tips: [
      "مشكلة واحدة لكل طلب؛ أرسل المشكلات المختلفة في طلبات منفصلة.",
      "اذكر رسالة الخطأ أو عنوان الصفحة أو اسم التقرير.",
      "أرفق لقطة شاشة أو الملف المتعلق بالمشكلة.",
    ],
    knowledgePrompt: "كثير من الإجابات موجودة في قاعدة المعرفة.",
    knowledgeLink: "ابحث في قاعدة المعرفة",
    conversation: "المحادثة",
    you: "أنت",
    supportTeam: "فريق الدعم",
    supportBadge: "الدعم",
    ticketDetails: "تفاصيل الطلب",
    reference: "الرقم",
    priority: "الأولوية",
    status: "الحالة",
    openedBy: "فتحها",
    openedOn: "تاريخ الفتح",
    lastActivity: "آخر نشاط",
    reply: "الرد",
    replyPlaceholder: "اكتب ردك...",
    sendReply: "إرسال الرد",
    sending: "جارٍ الإرسال...",
    resolvedHint:
      "تم حل هذا الطلب. إذا استمرت المشكلة، أرسل رداً وسيُعاد فتحه.",
    waitingHint: "فريق الدعم بانتظار ردك.",
    closeTicket: "إغلاق الطلب",
    closeSelected: "إغلاق الطلبات المحددة",
    batchClosed: "تم إغلاق {count} طلب.",
    batchAlreadyClosed: "الطلبات المحددة مغلقة مسبقاً.",
    closeTicketHint: "إذا تم حل مشكلتك، يمكنك إغلاق الطلب.",
    closeConfirm: "هل تريد إغلاق هذا الطلب؟ لن تتمكن من الرد عليه بعد إغلاقه.",
    closing: "جارٍ الإغلاق...",
    closedNotice:
      "هذا الطلب مغلق. إذا كنت بحاجة إلى مزيد من المساعدة، أرسل طلباً جديداً.",
    departmentRequired: "اختر قسماً.",
    subjectRequired: "اكتب الموضوع.",
    messageRequired: "اكتب الرسالة.",
    genericError: "تعذّر إكمال الطلب. يرجى المحاولة مرة أخرى.",
  },
  en: {
    navigation: "Helpdesk",
    eyebrow: "Support desk",
    title: "Support tickets",
    description:
      "Every conversation with the support team in one place. Open a new ticket and follow the replies.",
    newTicket: "New ticket",
    scopeCompany: "Showing every ticket from your company.",
    scopeOwn: "Showing the tickets you opened.",
    stats: {
      open: { label: "Open", caption: "Waiting for the support team" },
      inProgress: { label: "In progress", caption: "Support is working on it" },
      waiting: { label: "Awaiting you", caption: "Needs your reply" },
      resolved: { label: "Resolved", caption: "Problems solved" },
    },
    allTickets: "All",
    statuses: {
      OPEN: "Open",
      IN_PROGRESS: "In progress",
      WAITING_ON_CUSTOMER: "Awaiting your reply",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
    },
    statusTabs: {
      OPEN: "Open",
      IN_PROGRESS: "In progress",
      WAITING_ON_CUSTOMER: "Awaiting you",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
    },
    priorities: {
      LOW: "Low",
      NORMAL: "Normal",
      HIGH: "High",
      URGENT: "Urgent",
    },
    searchPlaceholder: "Search by reference or subject...",
    search: "Search",
    clearFilters: "Clear",
    columnTicket: "Ticket",
    columnStatus: "Status",
    columnPriority: "Priority",
    columnOpenedBy: "Opened by",
    columnUpdated: "Updated",
    columnActions: "Actions",
    view: "View",
    showing: "Showing {shown} of {total} tickets",
    previous: "Previous",
    next: "Next",
    emptyTitle: "No tickets yet",
    emptyDescription: "If you need help, open a new ticket.",
    noResultsTitle: "No tickets found",
    noResultsDescription: "Change the search or the filter.",
    backToTickets: "Tickets",
    newTicketTitle: "New support ticket",
    newTicketDescription:
      "Describe the problem in detail so the support team can help quickly.",
    stepDepartment: "Choose a department",
    stepDetails: "Describe the problem",
    department: "Department",
    subject: "Subject",
    subjectPlaceholder: "A short summary of the problem",
    message: "Message",
    messagePlaceholder:
      "What happened? What did you expect? List the steps to reproduce it.",
    attachments: "Attachments",
    attachmentsHint: "Up to 5 files: PDF, images, Office documents or ZIP.",
    dropFiles: "Drag files here or",
    browseFiles: "browse",
    uploading: "Uploading...",
    removeFile: "Remove",
    uploadFailed: "The file could not be uploaded.",
    tooManyFiles: "You can attach at most 5 files.",
    visibilityNote:
      "The support team and your company's administrators can see this ticket.",
    submitTicket: "Submit ticket",
    submitting: "Submitting...",
    tipsTitle: "Before you submit",
    tips: [
      "One problem per ticket; send different problems as separate tickets.",
      "Include the error message, the page address or the report name.",
      "Attach a screenshot or the file involved.",
    ],
    knowledgePrompt: "Many answers are already in the knowledge base.",
    knowledgeLink: "Search the knowledge base",
    conversation: "Conversation",
    you: "You",
    supportTeam: "Support team",
    supportBadge: "Support",
    ticketDetails: "Ticket details",
    reference: "Reference",
    priority: "Priority",
    status: "Status",
    openedBy: "Opened by",
    openedOn: "Opened on",
    lastActivity: "Last activity",
    reply: "Reply",
    replyPlaceholder: "Write your reply...",
    sendReply: "Send reply",
    sending: "Sending...",
    resolvedHint:
      "This ticket is resolved. If the problem continues, reply and it will reopen.",
    waitingHint: "The support team is waiting for your reply.",
    closeTicket: "Close ticket",
    closeSelected: "Close selected tickets",
    batchClosed: "{count} tickets closed.",
    batchAlreadyClosed: "The selected tickets were already closed.",
    closeTicketHint: "If your problem is solved, you can close the ticket.",
    closeConfirm:
      "Close this ticket? You will not be able to reply to it afterwards.",
    closing: "Closing...",
    closedNotice:
      "This ticket is closed. If you need more help, open a new ticket.",
    departmentRequired: "Choose a department.",
    subjectRequired: "Enter a subject.",
    messageRequired: "Enter a message.",
    genericError: "The request could not be completed. Please try again.",
  },
};
