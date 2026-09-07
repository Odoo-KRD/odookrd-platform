"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCompanyEditAction } from "@/components/companies/company-edit-modal";

import { ImageUploader } from "@/components/files/image-uploader";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type { FormState } from "@/lib/forms";
import type { CompanyProfileV2Dictionary } from "@/lib/i18n/company-profile-v2";

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM13.5 7.5l3 3" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-9 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 20V7l8-3v16M12 9h8v11M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2" />
    </svg>
  );
}

interface LogoUploadProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  labels: CompanyProfileV2Dictionary;
  currentImageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LogoUploadForm({
  action,
  labels,
  currentImageUrl,
  onSaved,
}: Pick<LogoUploadProps, "action" | "labels" | "currentImageUrl"> & {
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useCompanyEditAction(action, onSaved);

  return (
    <form action={formAction} className="grid min-w-0 w-full gap-5">
      <ImageUploader
        key={currentImageUrl ?? "no-logo"}
        name="logo"
        label={labels.logo}
        currentImageUrl={currentImageUrl}
        selectLabel={labels.updateLogo}
        replaceLabel={labels.updateLogo}
        removeLabel={labels.removeLogo}
        invalidMessage="JPEG, PNG, or WebP up to 10 MB is required."
        disabled={pending}
      />
      {state.message && !state.success ? (
        <p
          role="status"
          className="rounded-md bg-surface-subtle px-3 py-2.5 text-sm text-content"
        >
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
      </div>
    </form>
  );
}

function CompanyLogoUploadModal({
  action,
  labels,
  currentImageUrl,
  open,
  onOpenChange,
}: LogoUploadProps) {
  return (
    <ModalDialog
      title={labels.updateLogo}
      description={labels.platformManagedDescription}
      closeLabel={labels.close}
      triggerLabel={labels.updateLogo}
      widthClassName="max-w-lg"
      open={open}
      onOpenChange={onOpenChange}
    >
      <LogoUploadForm
        action={action}
        labels={labels}
        currentImageUrl={currentImageUrl}
        onSaved={() => onOpenChange(false)}
      />
    </ModalDialog>
  );
}

interface MenuPosition {
  left: number;
  top: number;
  width: number;
}

export function CompanyLogoActions({
  currentImageUrl,
  hasLogo,
  labels,
  uploadAction,
  deleteAction,
}: {
  currentImageUrl: string | null;
  hasLogo: boolean;
  labels: CompanyProfileV2Dictionary;
  uploadAction: (
    previousState: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  deleteAction: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({
    left: 0,
    top: 0,
    width: 208,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const calculatePosition = useCallback((): MenuPosition => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const width = Math.min(208, Math.max(0, window.innerWidth - 16));
    if (!rect) return { left: 8, top: 8, width };

    const height = hasLogo ? 104 : 56;
    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8),
    );
    const below = rect.bottom + 8;
    const above = rect.top - height - 8;
    const top =
      below + height <= window.innerHeight - 8
        ? below
        : above >= 8
          ? above
          : Math.max(8, window.innerHeight - height - 8);

    return { left, top, width };
  }, [hasLogo]);

  useEffect(() => {
    if (!menuOpen) return;

    const updatePosition = () => setPosition(calculatePosition());
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen, calculatePosition]);

  function toggleMenu(): void {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    setPosition(calculatePosition());
    setMenuOpen(true);
  }

  return (
    <div className="group/logo relative size-28 shrink-0">
      <div className="flex size-28 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
        {currentImageUrl ? (
          // Authenticated same-origin image delivery.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImageUrl}
            alt=""
            className="max-h-full max-w-full object-contain p-2"
          />
        ) : (
          <BuildingIcon />
        )}
      </div>

      <button
        ref={triggerRef}
        type="button"
        aria-label={labels.edit}
        title={labels.edit}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        onClick={toggleMenu}
        className="absolute bottom-2 right-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white/95 px-2.5 text-xs font-semibold text-content opacity-0 shadow-sm transition hover:bg-white group-hover/logo:opacity-100 group-focus-within/logo:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <PencilIcon />
        {labels.edit}
      </button>

      {menuOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={labels.edit}
              dir={document.documentElement.dir || "ltr"}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                maxHeight: "calc(100dvh - 16px)",
              }}
              className="fixed z-[80] overflow-x-hidden overflow-y-auto rounded-lg border border-line bg-white p-1.5 shadow-xl"
              onKeyDown={(event) => {
                const items = Array.from(
                  menuRef.current?.querySelectorAll<HTMLButtonElement>(
                    '[role="menuitem"]',
                  ) ?? [],
                );
                const index = items.indexOf(
                  document.activeElement as HTMLButtonElement,
                );
                let next = index;
                if (event.key === "ArrowDown")
                  next = (index + 1) % items.length;
                if (event.key === "ArrowUp")
                  next = (index - 1 + items.length) % items.length;
                if (event.key === "Home") next = 0;
                if (event.key === "End") next = items.length - 1;
                if (next !== index && items.length > 0) {
                  event.preventDefault();
                  items[next]?.focus();
                }
              }}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (
                  next instanceof Node &&
                  !menuRef.current?.contains(next) &&
                  !triggerRef.current?.contains(next)
                ) {
                  setMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setUploadOpen(true);
                }}
                className="flex w-full min-w-0 items-center overflow-hidden whitespace-nowrap rounded-md px-3 py-2.5 text-start text-sm font-medium text-content transition hover:bg-surface-subtle"
              >
                {labels.updateLogo}
              </button>
              {hasLogo ? (
                <form action={deleteAction} role="none">
                  <button
                    type="submit"
                    role="menuitem"
                    onClick={(event) => {
                      if (!window.confirm(labels.confirmRemoveLogo)) {
                        event.preventDefault();
                      }
                    }}
                    className="flex w-full min-w-0 items-center overflow-hidden whitespace-nowrap rounded-md px-3 py-2.5 text-start text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    {labels.removeLogo}
                  </button>
                </form>
              ) : null}
            </div>,
            document.body,
          )
        : null}

      <CompanyLogoUploadModal
        action={uploadAction}
        labels={labels}
        currentImageUrl={currentImageUrl}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </div>
  );
}
