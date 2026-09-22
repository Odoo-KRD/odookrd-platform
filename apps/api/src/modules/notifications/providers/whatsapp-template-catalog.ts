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
 *
 * `gated` types are only sent by WhatsApp when switched on in
 * notifications.whatsapp.enabled_types. Broadcasts are not gated: the admin
 * picks their channels each time.
 */
export const WHATSAPP_TEMPLATE_EVENTS = [
  {
    key: 'user.invitation',
    slug: 'invitation',
    audience: 'customer',
    gated: true,
    variables: ['companyName', 'expiresAt', 'token'],
  },
  {
    key: 'helpdesk.ticket.replied',
    slug: 'ticket_replied',
    audience: 'customer',
    gated: true,
    variables: ['reference', 'subject'],
  },
  {
    key: 'helpdesk.ticket.resolved',
    slug: 'ticket_resolved',
    audience: 'customer',
    gated: true,
    variables: ['reference', 'subject'],
  },
  {
    key: 'subscription.reminder',
    slug: 'subscription_reminder',
    audience: 'customer',
    gated: true,
    variables: ['serviceName', 'expiresOn'],
  },
  {
    key: 'admin.broadcast',
    slug: 'broadcast',
    audience: 'customer',
    gated: false,
    variables: ['title', 'body'],
  },
  {
    key: 'admin.helpdesk.ticket.created',
    slug: 'admin_ticket_created',
    audience: 'staff',
    gated: true,
    variables: ['reference', 'subject', 'companyName'],
  },
  {
    key: 'admin.helpdesk.customer.replied',
    slug: 'admin_customer_replied',
    audience: 'staff',
    gated: true,
    variables: ['reference', 'subject', 'companyName'],
  },
  {
    key: 'admin.renewal.requested',
    slug: 'admin_renewal_requested',
    audience: 'staff',
    gated: true,
    variables: ['companyName', 'serviceName'],
  },
  {
    key: 'admin.invitation.accepted',
    slug: 'admin_invitation_accepted',
    audience: 'staff',
    gated: true,
    variables: ['userName', 'companyName'],
  },
  {
    key: 'admin.course.completed',
    slug: 'admin_course_completed',
    audience: 'staff',
    gated: true,
    variables: ['learnerName', 'courseTitle', 'companyName'],
  },
  {
    key: 'admin.certificate.issued',
    slug: 'admin_certificate_issued',
    audience: 'staff',
    gated: true,
    variables: ['learnerName', 'courseTitle', 'companyName'],
  },
  {
    key: 'admin.knowledge.feedback',
    slug: 'admin_knowledge_feedback',
    audience: 'staff',
    gated: true,
    variables: ['articleTitle', 'companyName', 'comment'],
  },
] as const satisfies readonly {
  key: string;
  slug: string;
  audience: 'customer' | 'staff';
  gated: boolean;
  variables: readonly string[];
}[];

/** Twilio templates offered for mapping must start with this prefix. */
export const WHATSAPP_TEMPLATE_NAME_PREFIX = 'odookrd';

/** Comma-separated notification types switched on for WhatsApp. */
export const WHATSAPP_ENABLED_TYPES_KEY =
  'notifications.whatsapp.enabled_types';

/** The platform's variable order for a notification type, if it has one. */
export function catalogVariables(
  templateKey: string,
): readonly string[] | null {
  const event = WHATSAPP_TEMPLATE_EVENTS.find(
    (candidate) => candidate.key === templateKey,
  );
  return event ? event.variables : null;
}

/**
 * Whether WhatsApp may be used for this notification type, given the stored
 * enabled_types value. Types outside the gated catalog are left alone.
 */
export function whatsappTypeEnabled(
  templateKey: string,
  enabledTypesValue: unknown,
): boolean {
  const event = WHATSAPP_TEMPLATE_EVENTS.find(
    (candidate) => candidate.key === templateKey,
  );
  if (!event || !event.gated) return true;
  if (typeof enabledTypesValue !== 'string') return false;

  return enabledTypesValue
    .split(',')
    .map((entry) => entry.trim())
    .includes(templateKey);
}
