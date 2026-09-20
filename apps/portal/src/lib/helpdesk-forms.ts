import type { FormState } from "@/lib/forms";

export interface HelpdeskFormState extends FormState {
  /** Changes on each successful submission so the form can remount empty. */
  submittedAt?: number;
}
