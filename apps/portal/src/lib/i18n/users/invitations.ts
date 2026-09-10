import type { Locale, NotificationDeliveryStatus } from "@odookrd/types";
import { sharedText } from "../shared";

export interface UserInvitationAdminDictionary {
  inviteDescription: string;
  whatsappNumber: string;
  whatsappHint: string;
  sendInvitation: string;
  sendingInvitation: string;
  invitationSent: string;
  deliveryStatus: string;
  emailChannel: string;
  whatsappChannel: string;
  invitationManagement: string;
  invitationManagementDescription: string;
  activeInvitation: string;
  expiredInvitation: string;
  noInvitation: string;
  invitationExpires: string;
  resendInvitation: string;
  resendingInvitation: string;
  generateNewLink: string;
  generatingNewLink: string;
  invitationResent: string;
  linkGenerated: string;
  oneTimeLinkNotice: string;
  copyLink: string;
  copied: string;
  finalAdminTitle: string;
  finalAdminDescription: string;
  deliveryStatuses: Record<NotificationDeliveryStatus, string>;
}

export const userInvitationAdminDictionaries: Record<
  Locale,
  UserInvitationAdminDictionary
> = {
  ku: {
    inviteDescription:
      "هەژمار دروست بکە و بانگهێشتەکە بە ڕێگەی کەناڵە چالاکەکانی ئاگادارکردنەوە بنێرە.",
    whatsappNumber: "ژمارەی واتسئاپ",
    whatsappHint: "ئارەزوومەندانە، بە فۆرماتی E.164 وەک +9647XXXXXXXXX.",
    sendInvitation: "ناردنی بانگهێشت",
    sendingInvitation: "بانگهێشت دەنێردرێت...",
    invitationSent: "بانگهێشت دروست کرا و هەوڵی ناردنی درا.",
    deliveryStatus: "دۆخی گەیاندن",
    emailChannel: "ئیمەیڵ",
    whatsappChannel: "واتسئاپ",
    invitationManagement: "بەڕێوەبردنی بانگهێشت",
    invitationManagementDescription:
      "توکنی کۆن ناتوانرێت پیشان بدرێتەوە. دەتوانیت بانگهێشتێکی نوێ بنێریت یان بەستەرێکی نوێ دروست بکەیت.",
    activeInvitation: "بانگهێشتی چالاک",
    expiredInvitation: "بانگهێشت بەسەرچووە",
    noInvitation: "هیچ بانگهێشتێکی چالاک نییە.",
    invitationExpires: "کاتی بەسەرچوون",
    resendInvitation: "دووبارە ناردنەوە",
    resendingInvitation: "دووبارە دەنێردرێتەوە...",
    generateNewLink: "دروستکردنی بەستەری نوێ",
    generatingNewLink: "بەستەری نوێ دروست دەکرێت...",
    invitationResent: "بانگهێشتێکی نوێ دروست کرا و نێردرا.",
    linkGenerated: "بەستەرێکی نوێ دروست کرا.",
    oneTimeLinkNotice:
      "ئەم بەستەرە تەنها ئێستا پیشان دەدرێت. دروستکردنی بەستەری نوێ، بەستەری پێشوو هەڵدەوەشێنێتەوە.",
    copyLink: "کۆپیکردنی بەستەر",
    copied: "کۆپی کرا",
    finalAdminTitle: "پاراستنی دوایین بەڕێوەبەر",
    finalAdminDescription:
      "تا کاتێک بەڕێوەبەرێکی چالاکی تری کۆمپانیا نییە، ناتوانرێت ڕۆڵی بەڕێوەبەر لەم هەژمارە لاببرێت.",
    deliveryStatuses: {
      PENDING: sharedText.ku.status.PENDING,
      PROCESSING: sharedText.ku.status.PROCESSING,
      SENT: sharedText.ku.status.SENT,
      FAILED: sharedText.ku.status.FAILED,
      SKIPPED: sharedText.ku.status.SKIPPED,
    },
  },
  ar: {
    inviteDescription: "أنشئ الحساب وأرسل الدعوة عبر قنوات الإشعارات المفعّلة.",
    whatsappNumber: "رقم واتساب",
    whatsappHint: "اختياري، بصيغة E.164 مثل +9647XXXXXXXXX.",
    sendInvitation: "إرسال الدعوة",
    sendingInvitation: "جارٍ إرسال الدعوة...",
    invitationSent: "تم إنشاء الدعوة ومحاولة إرسالها.",
    deliveryStatus: "حالة التسليم",
    emailChannel: "البريد الإلكتروني",
    whatsappChannel: "واتساب",
    invitationManagement: "إدارة الدعوة",
    invitationManagementDescription:
      "لا يمكن استرجاع رمز الدعوة القديم. يمكنك إرسال دعوة جديدة أو إنشاء رابط جديد.",
    activeInvitation: "دعوة فعّالة",
    expiredInvitation: "انتهت صلاحية الدعوة",
    noInvitation: "لا توجد دعوة فعّالة.",
    invitationExpires: "تنتهي في",
    resendInvitation: "إعادة إرسال الدعوة",
    resendingInvitation: "جارٍ إعادة الإرسال...",
    generateNewLink: "إنشاء رابط جديد",
    generatingNewLink: "جارٍ إنشاء الرابط...",
    invitationResent: "تم إنشاء دعوة جديدة وإرسالها.",
    linkGenerated: "تم إنشاء رابط جديد.",
    oneTimeLinkNotice:
      "سيظهر هذا الرابط الآن فقط. إنشاء رابط جديد يبطل الرابط السابق.",
    copyLink: sharedText.ar.labels.copyLink,
    copied: sharedText.ar.labels.copied,
    finalAdminTitle: "حماية آخر مدير",
    finalAdminDescription:
      "لا يمكن إزالة دور مدير الشركة من هذا الحساب حتى يوجد مدير شركة فعّال آخر.",
    deliveryStatuses: {
      PENDING: sharedText.ar.status.PENDING,
      PROCESSING: sharedText.ar.status.PROCESSING,
      SENT: sharedText.ar.status.SENT,
      FAILED: sharedText.ar.status.FAILED,
      SKIPPED: sharedText.ar.status.SKIPPED,
    },
  },
  en: {
    inviteDescription:
      "Create the account and send its invitation through the active notification channels.",
    whatsappNumber: "WhatsApp number",
    whatsappHint: "Optional, in E.164 format such as +9647XXXXXXXXX.",
    sendInvitation: "Send invitation",
    sendingInvitation: "Sending invitation...",
    invitationSent: "The invitation was created and delivery was attempted.",
    deliveryStatus: "Delivery status",
    emailChannel: "Email",
    whatsappChannel: "WhatsApp",
    invitationManagement: "Invitation management",
    invitationManagementDescription:
      "The previous raw token cannot be recovered. Send a fresh invitation or generate a new one-time link.",
    activeInvitation: "Active invitation",
    expiredInvitation: "Invitation expired",
    noInvitation: "There is no active invitation.",
    invitationExpires: sharedText.en.labels.invitationExpires,
    resendInvitation: "Resend invitation",
    resendingInvitation: "Resending invitation...",
    generateNewLink: "Generate new link",
    generatingNewLink: "Generating link...",
    invitationResent: "A fresh invitation was generated and sent.",
    linkGenerated: "A fresh invitation link was generated.",
    oneTimeLinkNotice:
      "This link is shown only now. Generating another link invalidates the previous one.",
    copyLink: sharedText.en.labels.copyLink,
    copied: sharedText.en.labels.copied,
    finalAdminTitle: "Final administrator protection",
    finalAdminDescription:
      "This company-administrator role cannot be removed until another active company administrator exists.",
    deliveryStatuses: {
      PENDING: sharedText.en.status.PENDING,
      PROCESSING: sharedText.en.status.PROCESSING,
      SENT: sharedText.en.status.SENT,
      FAILED: sharedText.en.status.FAILED,
      SKIPPED: sharedText.en.status.SKIPPED,
    },
  },
};
