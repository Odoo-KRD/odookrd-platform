import type { ApiTranslations } from './types';

export const apiAr = {
  errors: {
    AUTH_REQUIRED: 'يجب تسجيل الدخول للوصول إلى هذا المورد.',
    INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    ACCESS_DENIED: 'لا تملك الصلاحية المطلوبة لهذا الإجراء.',
    COMPANY_SCOPE_DENIED: 'لا يسمح بالوصول إلى بيانات شركة أخرى.',
    RESOURCE_NOT_FOUND: 'تعذر العثور على المورد المطلوب.',
    INVALID_REQUEST: 'بيانات الطلب غير صالحة.',
    RATE_LIMITED: 'طلبات كثيرة. يرجى المحاولة لاحقاً.',
    SERVICE_UNAVAILABLE: 'الخدمة غير متاحة مؤقتاً.',
    COMPANY_USER_LIMIT: 'وصلت الشركة إلى الحد الأقصى لعدد المستخدمين.',
  },
  notifications: {
    invitationSubject: 'دعوة إلى منصة OdooKRD',
    invitationGreeting: 'تمت دعوتك لإنشاء حساب.',
    invitationAction: 'قبول الدعوة',
    serviceAssignedSubject: 'تم تخصيص خدمة جديدة لشركتك',
    serviceAssignedBody: 'تتوفر خدمة جديدة في لوحة المعلومات.',
    securityNoticeSubject: 'إشعار أمان الحساب',
  },
} satisfies ApiTranslations;
