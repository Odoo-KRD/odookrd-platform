"use client";

import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useState } from "react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import type { FormState } from "@/lib/forms";

type CompanyEditAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

type ModalProps = Omit<
  Parameters<typeof ModalDialog>[0],
  "children" | "open" | "onOpenChange"
>;

export function CompanyEditModalDialog({
  children,
  ...props
}: ModalProps & { children: (onSaved: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeAfterSave = useCallback(() => setOpen(false), []);

  const { triggerLabel, triggerClassName, triggerContent, ...dialogProps } =
    props;

  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel}
        title={triggerLabel}
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerContent ?? triggerLabel}
      </button>
      <ModalDialog
        {...dialogProps}
        triggerLabel={triggerLabel}
        open={open}
        onOpenChange={setOpen}
      >
        {open ? children(closeAfterSave) : null}
      </ModalDialog>
    </>
  );
}

export function useCompanyEditAction(
  action: CompanyEditAction,
  onSaved?: () => void,
) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  } as FormState);
  useEffect(() => {
    if (state.success === true) onSaved?.();
  }, [state, onSaved]);

  return [state, formAction, pending] as const;
}
