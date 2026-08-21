import type { ApiTranslations } from './types';

export const apiKu = {
  errors: {
    AUTH_REQUIRED: 'بۆ دەستگەیشتن پێویستە بچیتە ژوورەوە.',
    INVALID_CREDENTIALS: 'ئیمەیڵ یان وشەی نهێنی نادروستە.',
    ACCESS_DENIED: 'ڕێگەپێدانی پێویستت بۆ ئەم کردارە نییە.',
    COMPANY_SCOPE_DENIED: 'دەستگەیشتن بە دەرەوەی کۆمپانیاکەت ڕێگەپێنەدراوە.',
    RESOURCE_NOT_FOUND: 'زانیاریی داواکراو نەدۆزرایەوە.',
    INVALID_REQUEST: 'زانیاریی داواکارییەکە دروست نییە.',
    RATE_LIMITED: 'داواکاری زۆرە. تکایە دواتر دووبارە هەوڵ بدەوە.',
    SERVICE_UNAVAILABLE: 'خزمەتگوزارییەکە کاتیانە بەردەست نییە.',
    COMPANY_USER_LIMIT: 'کۆمپانیاکە گەیشتووە بە سنووری بەکارهێنەران.',
  },
  notifications: {
    invitationSubject: 'بانگهێشت بۆ پلاتفۆرمی OdooKRD',
    invitationGreeting: 'بانگهێشت کراویت بۆ دروستکردنی هەژمار.',
    invitationAction: 'بانگهێشتەکە قبووڵ بکە',
    serviceAssignedSubject: 'خزمەتگوزارییەکی نوێ بۆ کۆمپانیاکەت تەرخان کرا',
    serviceAssignedBody: 'خزمەتگوزارییەکی نوێ لە داشبۆردەکەتدا بەردەستە.',
    securityNoticeSubject: 'ئاگادارکردنەوەی پاراستنی هەژمار',
  },
} satisfies ApiTranslations;
