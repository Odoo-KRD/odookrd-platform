import { whatsappTypeEnabled } from './whatsapp-template-catalog';

describe('whatsappTypeEnabled', () => {
  it('sends a gated type only when it is switched on', () => {
    const enabled = 'user.invitation, helpdesk.ticket.replied';

    expect(whatsappTypeEnabled('user.invitation', enabled)).toBe(true);
    expect(whatsappTypeEnabled('helpdesk.ticket.replied', enabled)).toBe(true);
    expect(whatsappTypeEnabled('helpdesk.ticket.resolved', enabled)).toBe(
      false,
    );
    expect(whatsappTypeEnabled('user.invitation', '')).toBe(false);
    expect(whatsappTypeEnabled('user.invitation', null)).toBe(false);
  });

  it('leaves broadcasts and unknown types to their own channel choice', () => {
    expect(whatsappTypeEnabled('admin.broadcast', '')).toBe(true);
    expect(whatsappTypeEnabled('service.assigned', '')).toBe(true);
  });
});
