import type { ApiLocale } from '../../i18n/types';

export interface CorporateEmailContent {
  locale: ApiLocale;
  preview: string;
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  action?: { label: string; url: string };
  notice?: { label: string; value: string };
  fallbackLabel?: string;
  footer: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return replacements[character];
  });
}

/** Shared, email-client-compatible skeleton. Dynamic content is always escaped. */
export function renderCorporateEmail(content: CorporateEmailContent): string {
  const dir = content.locale === 'en' ? 'ltr' : 'rtl';
  const align = dir === 'rtl' ? 'right' : 'left';
  const safe = escapeHtml;
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;font-size:15px;line-height:1.85;color:#475569;">${safe(paragraph)}</p>`,
    )
    .join('');
  const action = content.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td bgcolor="#714b67" style="border-radius:6px;background:#714b67;"><a href="${safe(content.action.url)}" style="display:inline-block;padding:14px 26px;border:1px solid #714b67;border-radius:6px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">${safe(content.action.label)}</a></td></tr></table>`
    : '';
  const notice = content.notice
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;"><tr><td style="padding:16px 18px;"><p style="margin:0 0 6px;font-size:11px;font-weight:bold;color:#64748b;">${safe(content.notice.label)}</p><p dir="ltr" style="margin:0;font-size:13px;line-height:1.7;color:#334155;text-align:${align};">${safe(content.notice.value)}</p></td></tr></table>`
    : '';
  const fallback =
    content.action && content.fallbackLabel
      ? `<p style="margin:22px 0 8px;font-size:12px;line-height:1.7;color:#64748b;">${safe(content.fallbackLabel)}</p><p dir="ltr" style="margin:0 0 22px;font-size:12px;line-height:1.8;overflow-wrap:anywhere;word-break:break-word;text-align:left;"><a href="${safe(content.action.url)}" style="color:#714b67;text-decoration:underline;">${safe(content.action.url)}</a></p>`
      : '';
  return `<!doctype html>
<html lang="${content.locale === 'ku' ? 'ckb' : content.locale}" dir="${dir}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${safe(content.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f5f8;color:#334155;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;color:#f3f5f8;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safe(content.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f5f8;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
<tr><td style="padding:25px 32px;background:#ffffff;border-bottom:1px solid #e2e8f0;text-align:${align};"><span dir="ltr" style="font-size:23px;font-weight:bold;letter-spacing:-0.5px;color:#714b67;">OdooKRD</span><br><span style="font-size:11px;letter-spacing:0.5px;color:#64748b;">Customer Platform</span></td></tr>
<tr><td dir="${dir}" style="padding:32px;text-align:${align};">
<p style="margin:0 0 12px;font-size:11px;font-weight:bold;letter-spacing:0.7px;color:#714b67;">${safe(content.eyebrow)}</p>
<h1 style="margin:0 0 24px;font-size:25px;line-height:1.4;font-weight:bold;color:#1e293b;">${safe(content.title)}</h1>
${paragraphs}${action}${notice}${fallback}
<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.8;color:#64748b;">${safe(content.footer)}</p>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;text-align:center;"><p style="margin:0;font-size:12px;font-weight:bold;color:#475569;">OdooKRD</p><p style="margin:6px 0 0;font-size:11px;color:#94a3b8;">my.odoo.krd</p></td></tr>
</table>
</td></tr></table>
</body></html>`;
}
