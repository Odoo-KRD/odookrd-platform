/** The canonical public customer portal; never derive secret links from request headers. */
export const PORTAL_PUBLIC_ORIGIN = "https://my.odoo.krd";

export function invitationAcceptUrl(token: string): string {
  return `${PORTAL_PUBLIC_ORIGIN}/invitation/accept#${new URLSearchParams({
    token,
  }).toString()}`;
}
