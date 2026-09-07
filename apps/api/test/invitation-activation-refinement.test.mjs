import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const ts = createRequire(path.join(root, 'apps/api/package.json'))(
  'typescript',
);
const source = (name) => readFileSync(path.join(root, name), 'utf8');
const api = 'apps/api/src/';
const portal = 'apps/portal/src/';

function load(relative, dependencies = {}, extra = {}) {
  const compiled = ts.transpileModule(source(relative), {
    fileName: relative,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      experimentalDecorators: true,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(errors.length, 0, 'TypeScript syntax');
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    require(name) {
      if (!(name in dependencies))
        throw new Error('Unexpected test dependency: ' + name);
      return dependencies[name];
    },
    process: { env: { ...process.env } },
    URL,
    URLSearchParams,
    Date,
    console,
    ...extra,
  };
  vm.runInNewContext(compiled.outputText, context, { filename: relative });
  return module.exports;
}

const common = {
  Injectable: () => (target) => target,
  InternalServerErrorException: class extends Error {},
  BadRequestException: class extends Error {},
};

test('individual names are normalized and invalid names rejected', () => {
  const { normalizeInvitationName } = load(
    api + 'modules/users/invitation-name.ts',
    { '@nestjs/common': common },
  );
  assert.equal(normalizeInvitationName('  Customer   User  '), 'Customer User');
  assert.equal(normalizeInvitationName('  ناوی   کڕیار  '), 'ناوی کڕیار');
  for (const value of ['', ' ', 'A', 'A'.repeat(161), 'Name\nOther']) {
    assert.throws(() => normalizeInvitationName(value));
  }
});

test('the activation contract requires a personal name at every boundary', () => {
  const dto = source(api + 'modules/users/dto/accept-invitation.dto.ts');
  const service = source(api + 'modules/users/user-invitation.service.ts');
  const route = source(portal + 'app/api/auth/invitations/accept/route.ts');
  const form = source(
    portal + 'components/invitations/accept-invitation-form.tsx',
  );
  const page = source(portal + 'app/(public)/invitation/accept/page.tsx');
  assert.match(dto, /displayName!: string/);
  assert.match(service, /normalizeInvitationName\(dto\.displayName\)/);
  assert.match(service, /displayName,/);
  assert.match(service, /consumeResult\.count !== 1/);
  assert.match(route, /isSameOrigin\(request\)/);
  assert.match(route, /body\.displayName/);
  assert.match(
    route,
    /JSON\.stringify\(\{\s*token:\s*body\.token,\s*displayName:/,
  );
  assert.match(form, /name="displayName"/);
  assert.match(form, /JSON\.stringify\(\{ token, displayName, password \}\)/);
  assert.match(form, /window\.history\.replaceState/);
  assert.match(form, /useSyncExternalStore/);
  assert.match(
    page,
    /<AcceptInvitationForm labels=\{labels\} locale=\{locale\}/,
  );
  assert.match(page, /getSession\(\)/);
  assert.match(page, /LanguageSwitcher/);
  assert.match(page, /viewBox="0 0 24 24"/);
  for (const locale of ['ku', 'ar', 'en']) {
    assert.match(
      source(portal + 'lib/i18n/activation-copy.ts'),
      new RegExp(locale + ': \\{'),
    );
  }
});

test('email renderer escapes content and preserves accessible fallback links', () => {
  const { renderCorporateEmail } = load(
    api + 'modules/notifications/email-template-layout.ts',
  );
  const html = renderCorporateEmail({
    locale: 'en',
    preview: 'Hello',
    eyebrow: 'Invitation',
    title: '<script>alert(1)</script>',
    paragraphs: ['Welcome <Customer>'],
    action: {
      label: 'Activate',
      url: 'https://my.odoo.krd/invitation/accept#token=synthetic&value',
    },
    notice: { label: 'Expires', value: '2026-09-07 UTC' },
    fallbackLabel: 'Use this link',
    footer: 'Ignore if unexpected',
  });
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /role="presentation"/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /synthetic&amp;value/);
  assert.match(html, /Ignore if unexpected/);
});

test('invitation rendering supplies HTML and preserves plain text and fragment URLs', () => {
  const layout = load(api + 'modules/notifications/email-template-layout.ts');
  const { InvitationTemplateService } = load(
    api + 'modules/user-administration/invitation-template.service.ts',
    {
      '@nestjs/common': common,
      '../notifications/email-template-layout': layout,
    },
  );
  const renderer = new InvitationTemplateService();
  for (const locale of ['ku', 'ar', 'en']) {
    const result = renderer.render(
      locale,
      'synthetic-test-token-0123456789',
      new Date('2026-09-07T12:00:00Z'),
    );
    assert.match(
      result.emailBody,
      /https:\/\/my\.odoo\.krd\/invitation\/accept#token=/,
    );
    assert.match(
      result.emailHtml,
      /https:\/\/my\.odoo\.krd\/invitation\/accept#token=/,
    );
    assert.match(result.emailHtml, /<html lang=/);
    assert.match(
      result.emailHtml,
      new RegExp(`dir="${locale === 'en' ? 'ltr' : 'rtl'}"`),
    );
    assert.equal(result.whatsappBody, result.emailBody);
    assert.doesNotMatch(result.emailHtml, /\/invitation\/accept\?token=/);
    assert.match(result.emailHtml, /2026-09-07T12:00:00\.000Z/);
  }
});

test('SES and SMTP keep plain text and accept optional HTML without a live send', async () => {
  const sent = [];
  const smtp = [];
  let transport = 'api';
  class SESv2Client {
    async send(command) {
      sent.push(command.input);
      return { MessageId: 'synthetic-id' };
    }
    destroy() {}
  }
  class SendEmailCommand {
    constructor(input) {
      this.input = input;
    }
  }
  const { EmailProviderService } = load(
    api + 'modules/notifications/providers/email-provider.service.ts',
    {
      '@nestjs/common': common,
      '@aws-sdk/client-sesv2': { SESv2Client, SendEmailCommand },
      nodemailer: {
        createTransport: () => ({
          async sendMail(message) {
            smtp.push(message);
          },
          close() {},
        }),
      },
      '../../settings/settings.service': {},
      '../notification-provider.error': {
        NotificationProviderError: class extends Error {},
      },
    },
  );
  const settings = {
    async resolveValue(key) {
      if (key === 'notifications.email.provider') return 'amazon_ses';
      if (key.endsWith('.transport')) return transport;
      if (key.endsWith('.region')) return 'eu-central-1';
      if (key.endsWith('.smtp_port')) return 587;
      if (key.endsWith('.smtp_security')) return 'starttls';
      if (key.endsWith('.sender_email')) return 'test@example.test';
      return null;
    },
    async resolveSecret() {
      return 'synthetic-credential';
    },
  };
  const provider = new EmailProviderService(settings);
  await provider.send(
    null,
    'recipient@example.test',
    'Subject',
    'Plain text',
    '<p>HTML</p>',
  );
  assert.equal(sent[0].Content.Simple.Body.Text.Data, 'Plain text');
  assert.equal(sent[0].Content.Simple.Body.Html.Data, '<p>HTML</p>');
  await provider.send(null, 'recipient@example.test', 'Subject', 'Plain only');
  assert.equal(sent[1].Content.Simple.Body.Text.Data, 'Plain only');
  assert.equal(sent[1].Content.Simple.Body.Html, undefined);
  transport = 'smtp';
  await provider.send(
    null,
    'recipient@example.test',
    'Subject',
    'Plain text',
    '<p>HTML</p>',
  );
  assert.equal(smtp[0].text, 'Plain text');
  assert.equal(smtp[0].html, '<p>HTML</p>');
});
