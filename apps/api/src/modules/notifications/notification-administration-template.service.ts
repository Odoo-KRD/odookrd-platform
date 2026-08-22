import { Injectable } from '@nestjs/common';

import type { ApiLocale } from '../../i18n/types';

interface TestEmailCopy {
  subject: string;
  greeting: string;
  body: string;
  footer: string;
}

const copy: Record<ApiLocale, TestEmailCopy> = {
  ku: {
    subject: 'تاقیکردنەوەی ئیمەیڵی OdooKRD',
    greeting: 'سڵاو،',
    body: 'ئەمە پەیامی تاقیکردنەوەی سیستەمی ئاگادارکردنەوەی OdooKRD ـە.',
    footer:
      'ئەگەر ئەم پەیامەت وەرگرت، ناردنی ئیمەیڵ لە ڕێگەی Amazon SES بە دروستی کار دەکات.',
  },
  ar: {
    subject: 'اختبار بريد OdooKRD',
    greeting: 'مرحباً،',
    body: 'هذه رسالة اختبار من نظام إشعارات OdooKRD.',
    footer:
      'إذا استلمت هذه الرسالة فإن إرسال البريد عبر Amazon SES يعمل بشكل صحيح.',
  },
  en: {
    subject: 'OdooKRD email test',
    greeting: 'Hello,',
    body: 'This is a test message from the OdooKRD notification system.',
    footer:
      'If you received this message, Amazon SES email delivery is working correctly.',
  },
};

@Injectable()
export class NotificationAdministrationTemplateService {
  renderTestEmail(locale: ApiLocale): { subject: string; body: string } {
    const selected = copy[locale];
    return {
      subject: selected.subject,
      body: [selected.greeting, '', selected.body, '', selected.footer].join(
        '\n',
      ),
    };
  }
}
