import { NotificationProviderError } from '../notification-provider.error';
import {
  normalizeNumber,
  listTwilioContentTemplates,
  resolveContentTemplate,
  sendTwilioWhatsApp,
} from './twilio-whatsapp.client';

const CREDENTIALS = { accountSid: 'AC123', authToken: 'secret' };
const SENDERS = { primary: '+9647701599232', fallback: '+12028901394' };
const CONTENT_SID = 'HX0123456789abcdef0123456789abcdef';

interface Call {
  url: string;
  form: URLSearchParams;
  authorization: string;
}

function mockFetch(
  responses: Array<{ status: number; body: unknown } | 'network'>,
) {
  const calls: Call[] = [];
  const queue = [...responses];

  global.fetch = jest.fn((url: string, init: RequestInit) => {
    calls.push({
      url,
      form: init.body as URLSearchParams,
      authorization: (init.headers as Record<string, string>).Authorization,
    });
    const next = queue.shift();
    if (next === 'network' || next === undefined) {
      return Promise.reject(new Error('socket hang up'));
    }
    return Promise.resolve({
      ok: next.status < 400,
      status: next.status,
      json: () => Promise.resolve(next.body),
    } as Response);
  });

  return calls;
}

describe('sendTwilioWhatsApp', () => {
  it('sends an approved template with numbered variables', async () => {
    const calls = mockFetch([{ status: 201, body: { sid: 'SM1' } }]);

    const sid = await sendTwilioWhatsApp(CREDENTIALS, SENDERS, {
      destination: '+964 750 123 4567',
      body: 'ignored',
      contentSid: CONTENT_SID,
      contentVariables: { '1': 'TKT-2026-00001' },
    });

    expect(sid).toBe('SM1');
    expect(calls[0].url).toContain('/Accounts/AC123/Messages.json');
    expect(calls[0].authorization).toBe(
      `Basic ${Buffer.from('AC123:secret').toString('base64')}`,
    );
    expect(calls[0].form.get('To')).toBe('whatsapp:+9647501234567');
    expect(calls[0].form.get('From')).toBe('whatsapp:+9647701599232');
    expect(calls[0].form.get('ContentSid')).toBe(CONTENT_SID);
    expect(calls[0].form.get('ContentVariables')).toBe(
      '{"1":"TKT-2026-00001"}',
    );
    expect(calls[0].form.has('Body')).toBe(false);
  });

  it('sends free text when no template applies', async () => {
    const calls = mockFetch([{ status: 201, body: { sid: 'SM2' } }]);

    await sendTwilioWhatsApp(CREDENTIALS, SENDERS, {
      destination: '9647501234567',
      body: 'Hello',
    });

    expect(calls[0].form.get('Body')).toBe('Hello');
    expect(calls[0].form.has('ContentSid')).toBe(false);
  });

  it('retries once from the fallback number when the primary fails', async () => {
    const calls = mockFetch([
      { status: 503, body: { code: 20500 } },
      { status: 201, body: { sid: 'SM3' } },
    ]);

    const sid = await sendTwilioWhatsApp(CREDENTIALS, SENDERS, {
      destination: '9647501234567',
      body: 'Hello',
    });

    expect(sid).toBe('SM3');
    expect(calls[1].form.get('From')).toBe('whatsapp:+12028901394');
  });

  it.each([
    [21211, 'an invalid recipient'],
    [63016, 'a closed 24-hour window'],
  ])('does not fall back on %s (%s)', async (code) => {
    const calls = mockFetch([{ status: 400, body: { code } }]);

    await expect(
      sendTwilioWhatsApp(CREDENTIALS, SENDERS, {
        destination: '9647501234567',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ code: `TWILIO_${code}`, retryable: false });
    expect(calls).toHaveLength(1);
  });

  it('never resends after an uncertain network failure', async () => {
    const calls = mockFetch(['network']);

    await expect(
      sendTwilioWhatsApp(CREDENTIALS, SENDERS, {
        destination: '9647501234567',
        body: 'Hello',
      }),
    ).rejects.toBeInstanceOf(NotificationProviderError);
    expect(calls).toHaveLength(1);
  });

  it('marks rate limits and outages as retryable', async () => {
    mockFetch([
      { status: 429, body: { code: 20429 } },
      { status: 429, body: { code: 20429 } },
    ]);

    await expect(
      sendTwilioWhatsApp(CREDENTIALS, SENDERS, {
        destination: '9647501234567',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ retryable: true });
  });
});

describe('resolveContentTemplate', () => {
  const map = JSON.stringify({
    'helpdesk.ticket.replied': {
      variables: ['reference', 'subject'],
      ku: CONTENT_SID,
      default: 'HXffffffffffffffffffffffffffffffff',
    },
  });

  it('picks the template for the recipient language', () => {
    expect(
      resolveContentTemplate(map, 'helpdesk.ticket.replied', 'ku', {
        reference: 'TKT-2026-00002',
        subject: 'Printer',
      }),
    ).toEqual({
      contentSid: CONTENT_SID,
      contentVariables: { '1': 'TKT-2026-00002', '2': 'Printer' },
    });
  });

  it('falls back to the default template and never sends empty values', () => {
    expect(
      resolveContentTemplate(map, 'helpdesk.ticket.replied', 'en', {
        reference: 'TKT-2026-00002',
      }),
    ).toEqual({
      contentSid: 'HXffffffffffffffffffffffffffffffff',
      contentVariables: { '1': 'TKT-2026-00002', '2': '-' },
    });
  });

  it('returns null for a notification type without a template', () => {
    expect(resolveContentTemplate(map, 'other', 'ku', {})).toBeNull();
    expect(resolveContentTemplate('', 'other', 'ku', {})).toBeNull();
  });

  it('uses the platform variable order over the stored map', () => {
    const stale = JSON.stringify({
      'subscription.reminder': {
        variables: ['serviceName', 'daysRemaining', 'expiresOn'],
        en: CONTENT_SID,
      },
    });

    expect(
      resolveContentTemplate(stale, 'subscription.reminder', 'en', {
        serviceName: 'Odoo Hosting',
        expiresOn: '2026-10-01',
      }),
    ).toEqual({
      contentSid: CONTENT_SID,
      contentVariables: { '1': 'Odoo Hosting', '2': '2026-10-01' },
    });
  });

  it('folds free text onto one line for WhatsApp', () => {
    const broadcast = JSON.stringify({
      'admin.broadcast': { en: CONTENT_SID },
    });

    expect(
      resolveContentTemplate(broadcast, 'admin.broadcast', 'en', {
        title: 'Maintenance',
        body: 'Tonight 22:00.\n\n\tPlease   save your work.',
      }),
    ).toEqual({
      contentSid: CONTENT_SID,
      contentVariables: {
        '1': 'Maintenance',
        '2': 'Tonight 22:00. Please save your work.',
      },
    });
  });

  it('rejects a malformed map instead of guessing', () => {
    expect(() => resolveContentTemplate('{oops', 'x', 'ku', {})).toThrow(
      NotificationProviderError,
    );
  });
});

describe('listTwilioContentTemplates', () => {
  it('keeps only odookrd templates and reads their approval status', async () => {
    const calls = mockFetch([
      {
        status: 200,
        body: {
          contents: [
            {
              sid: CONTENT_SID,
              friendly_name: 'odookrd_ticket_replied_v1_en',
              language: 'en',
              variables: { '1': 'TKT-1', '2': 'Subject' },
              types: {
                'twilio/call-to-action': {
                  body: 'Reply',
                  actions: [
                    {
                      type: 'URL',
                      title: 'View tickets',
                      url: 'https://my.odoo.krd/dashboard/helpdesk',
                    },
                  ],
                },
              },
              approval_requests: { type: 'whatsapp', status: 'approved' },
            },
            {
              sid: 'HXffffffffffffffffffffffffffffffff',
              friendly_name: 'marketing_offer',
              language: 'en',
              variables: {},
              types: {},
              approval_requests: { type: 'whatsapp', status: 'approved' },
            },
          ],
          meta: {
            next_page_url: 'https://evil.example/v1/ContentAndApprovals',
          },
        },
      },
    ]);

    await expect(listTwilioContentTemplates(CREDENTIALS)).resolves.toEqual([
      {
        sid: CONTENT_SID,
        friendlyName: 'odookrd_ticket_replied_v1_en',
        language: 'en',
        variableCount: 2,
        types: ['twilio/call-to-action'],
        buttonUrls: ['https://my.odoo.krd/dashboard/helpdesk'],
        approvalStatus: 'approved',
        rejectionReason: null,
      },
    ]);
    // A paging link outside Twilio's Content API is never followed.
    expect(calls).toHaveLength(1);
  });

  it('reports rejected credentials clearly', async () => {
    mockFetch([{ status: 401, body: { code: 20003 } }]);

    await expect(listTwilioContentTemplates(CREDENTIALS)).rejects.toMatchObject(
      { code: 'TWILIO_AUTH_FAILED' },
    );
  });
});

describe('normalizeNumber', () => {
  it('accepts E.164 in common formats and rejects junk', () => {
    expect(normalizeNumber('+964 770 159 9232')).toBe('9647701599232');
    expect(normalizeNumber('whatsapp:+12028901394')).toBe('12028901394');
    expect(normalizeNumber('12345')).toBeNull();
  });
});
