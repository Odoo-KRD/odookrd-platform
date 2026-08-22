import type { InvitationDispatchSummary } from "@odookrd/types";

export interface FormState {
  message: string | null;
}

export interface InvitationPreview {
  token: string;
  expiresAt: string;
  email: string;
  dispatch?: InvitationDispatchSummary | null;
}

export interface InvitationFormState extends FormState {
  invitation: InvitationPreview | null;
}
