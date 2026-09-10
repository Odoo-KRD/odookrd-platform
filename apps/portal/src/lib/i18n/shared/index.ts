import type { Locale } from "@odookrd/types";

import { sharedActions, type SharedActions } from "./actions";
import { sharedStatus, type SharedStatus } from "./status";
import { sharedLanguages, type SharedLanguages } from "./languages";
import { sharedLabels, type SharedLabels } from "./labels";

/**
 * Text shared across domains.
 *
 * Referencing one of these adopts the house wording. A domain that genuinely
 * needs different wording writes the literal back in its own dictionary —
 * sharing is a default, not a lock.
 */
export interface SharedText {
  actions: SharedActions;
  status: SharedStatus;
  languages: SharedLanguages;
  labels: SharedLabels;
}

export const sharedText: Record<Locale, SharedText> = {
  ku: {
    actions: sharedActions.ku,
    status: sharedStatus.ku,
    languages: sharedLanguages.ku,
    labels: sharedLabels.ku,
  },
  ar: {
    actions: sharedActions.ar,
    status: sharedStatus.ar,
    languages: sharedLanguages.ar,
    labels: sharedLabels.ar,
  },
  en: {
    actions: sharedActions.en,
    status: sharedStatus.en,
    languages: sharedLanguages.en,
    labels: sharedLabels.en,
  },
};

export { sharedActions, type SharedActions } from "./actions";
export { sharedStatus, type SharedStatus } from "./status";
export { sharedLanguages, type SharedLanguages } from "./languages";
export { sharedLabels, type SharedLabels } from "./labels";
