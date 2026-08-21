export interface FormState {
  message: string | null;
}

export interface InvitationPreview {
  token: string;
  expiresAt: string;
  email: string;
}

export interface InvitationFormState extends FormState {
  invitation: InvitationPreview | null;
}
