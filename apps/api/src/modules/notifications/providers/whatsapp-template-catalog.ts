/**
 * The notification types that can be sent as an approved WhatsApp template,
 * and the variables each one supplies, in {{1}}, {{2}}, … order.
 *
 * This order is a contract with the templates submitted to Twilio: changing
 * it means submitting new template versions. The portal's template mapping
 * tab keeps a copy (whatsapp-template-mapping.tsx) that must match.
 *
 * `slug` is the event part of the naming convention
 * odookrd_<slug>_v<N>_<language>, used to auto-match templates by name.
 */
export const WHATSAPP_TEMPLATE_EVENTS = [
  {
    key: 'user.invitation',
    slug: 'invitation',
    variables: ['companyName', 'expiresAt', 'token'],
  },
  {
    key: 'helpdesk.ticket.replied',
    slug: 'ticket_replied',
    variables: ['reference', 'subject'],
  },
  {
    key: 'helpdesk.ticket.resolved',
    slug: 'ticket_resolved',
    variables: ['reference', 'subject'],
  },
  {
    key: 'subscription.reminder',
    slug: 'subscription_reminder',
    variables: ['serviceName', 'expiresOn'],
  },
] as const satisfies readonly {
  key: string;
  slug: string;
  variables: readonly string[];
}[];

/** Twilio templates offered for mapping must start with this prefix. */
export const WHATSAPP_TEMPLATE_NAME_PREFIX = 'odookrd';

/** The platform's variable order for a notification type, if it has one. */
export function catalogVariables(
  templateKey: string,
): readonly string[] | null {
  const event = WHATSAPP_TEMPLATE_EVENTS.find(
    (candidate) => candidate.key === templateKey,
  );
  return event ? event.variables : null;
}
