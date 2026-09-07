import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { ApiLocale } from '../../i18n/types';
import { renderCorporateEmail } from '../notifications/email-template-layout';
interface InvitationCopy {
  subject: string;
  greeting: string;
  introduction: string;
  action: string;
  expiration: string;
  ignore: string;
}
const invitationCopy: Record<ApiLocale, InvitationCopy> = {
  ku: {
    subject: 'بانگهێشتی پۆرتاڵی OdooKRD',
    greeting: 'سڵاو،',
    introduction: 'تۆ بانگهێشت کراویت بۆ بەکارهێنانی پۆرتاڵی کڕیارانی OdooKRD.',
    action: 'بۆ چالاککردنی هەژمارەکەت ئەم بەستەرە بکەرەوە:',
    expiration: 'ئەم بانگهێشتە لەم کاتەدا بەسەردەچێت:',
    ignore:
      'ئەگەر چاوەڕێی ئەم بانگهێشتە نەبوویت، دەتوانیت ئەم پەیامە پشتگوێ بخەیت.',
  },
  ar: {
    subject: 'دعوة إلى بوابة OdooKRD',
    greeting: 'مرحباً،',
    introduction: 'تمت دعوتك لاستخدام بوابة عملاء OdooKRD.',
    action: 'لتفعيل حسابك افتح الرابط التالي:',
    expiration: 'تنتهي صلاحية هذه الدعوة في:',
    ignore: 'إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة.',
  },
  en: {
    subject: 'Your OdooKRD portal invitation',
    greeting: 'Hello,',
    introduction: 'You have been invited to use the OdooKRD customer portal.',
    action: 'Activate your account using this secure link:',
    expiration: 'This invitation expires at:',
    ignore:
      'If you were not expecting this invitation, you can ignore this message.',
  },
};
@Injectable()
export class InvitationTemplateService {
  render(locale: ApiLocale, token: string, expiresAt: Date) {
    const copy = invitationCopy[locale];
    const link = this.invitationLink(token);
    const body = [
      copy.greeting,
      '',
      copy.introduction,
      '',
      copy.action,
      link,
      '',
      `${copy.expiration} ${expiresAt.toISOString()}`,
      '',
      copy.ignore,
    ].join('\n');
    const emailCopy = {
      ku: {
        eyebrow: 'بانگهێشتی پۆرتاڵ',
        activate: 'چالاککردنی هەژمار',
        fallback: 'ئەگەر دوگمەکە کار نەکرد، ئەم بەستەرە بەکاربهێنە:',
      },
      ar: {
        eyebrow: 'دعوة إلى البوابة',
        activate: 'تفعيل الحساب',
        fallback: 'إذا لم يعمل الزر، استخدم الرابط التالي:',
      },
      en: {
        eyebrow: 'Portal invitation',
        activate: 'Activate account',
        fallback: 'If the button does not work, use this link:',
      },
    }[locale];
    const emailHtml = renderCorporateEmail({
      locale,
      preview: copy.introduction,
      eyebrow: emailCopy.eyebrow,
      title: copy.subject,
      paragraphs: [copy.greeting, copy.introduction],
      action: { label: emailCopy.activate, url: link },
      notice: { label: copy.expiration, value: expiresAt.toISOString() },
      fallbackLabel: emailCopy.fallback,
      footer: copy.ignore,
    });
    return {
      subject: copy.subject,
      emailBody: body,
      emailHtml,
      whatsappBody: body,
    };
  }
  private invitationLink(token: string): string {
    const configured =
      process.env.ODOOKRD_PORTAL_PUBLIC_URL?.trim() || 'https://my.odoo.krd';
    let origin: URL;
    try {
      origin = new URL(configured);
    } catch {
      throw new InternalServerErrorException(
        'The public portal URL is configured incorrectly.',
      );
    }
    if (origin.protocol !== 'https:' || origin.username || origin.password)
      throw new InternalServerErrorException(
        'The public portal URL must use HTTPS.',
      );
    return `${origin.origin}/invitation/accept#token=${encodeURIComponent(token)}`;
  }
}
