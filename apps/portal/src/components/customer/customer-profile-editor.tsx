"use client";

import type { CustomerAccountProfile, Locale } from "@odookrd/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploader } from "@/components/files/image-uploader";
import { LanguageSelect } from "@/components/preferences/language-select";
import type { CustomerDashboardV2Dictionary } from "@/lib/i18n/portal/dashboard";

interface CustomerProfileEditorProps {
  initialProfile: CustomerAccountProfile;
  locale: Locale;
  languageLabel: string;
  labels: CustomerDashboardV2Dictionary["profile"];
}

export function CustomerProfileEditor({
  initialProfile,
  locale,
  languageLabel,
  labels,
}: CustomerProfileEditorProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [displayName, setDisplayName] = useState(
    initialProfile.displayName ?? "",
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialProfile.whatsappNumber ?? "",
  );
  const [certificateName, setCertificateName] = useState(
    initialProfile.certificateName ?? "",
  );
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const persistedAvatarUrl =
    profile.hasAvatar && profile.avatarFileAssetId
      ? `/api/workspace/profile/avatar?v=${encodeURIComponent(
          profile.avatarFileAssetId,
        )}`
      : null;

  async function verifyAvatar(updated: CustomerAccountProfile): Promise<void> {
    if (!updated.hasAvatar || !updated.avatarFileAssetId) return;

    const response = await fetch(
      `/api/workspace/profile/avatar?v=${encodeURIComponent(
        updated.avatarFileAssetId,
      )}`,
      {
        method: "GET",
        headers: { Accept: "image/*" },
        cache: "no-store",
        credentials: "same-origin",
      },
    );

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok || !contentType.startsWith("image/")) {
      throw new Error("avatar_delivery_failed");
    }

    await response.body?.cancel();
  }

  async function saveProfile(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage(null);

    try {
      const profileResponse = await fetch("/api/workspace/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          whatsappNumber: whatsappNumber.trim() || null,
          certificateName: certificateName.trim() || null,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error("profile_save_failed");
      }

      let updated = (await profileResponse.json()) as CustomerAccountProfile;

      if (selectedAvatar) {
        const data = new FormData();
        data.set("file", selectedAvatar);

        const avatarResponse = await fetch("/api/workspace/profile/avatar", {
          method: "PUT",
          body: data,
        });

        if (!avatarResponse.ok) {
          throw new Error("avatar_upload_failed");
        }

        updated = (await avatarResponse.json()) as CustomerAccountProfile;

        await verifyAvatar(updated);
      } else if (removeAvatarRequested && profile.hasAvatar) {
        const avatarResponse = await fetch("/api/workspace/profile/avatar", {
          method: "DELETE",
        });

        if (!avatarResponse.ok) {
          throw new Error("avatar_delete_failed");
        }

        updated = (await avatarResponse.json()) as CustomerAccountProfile;
      }

      setSelectedAvatar(null);
      setRemoveAvatarRequested(false);
      setProfile(updated);
      setDisplayName(updated.displayName ?? "");
      setWhatsappNumber(updated.whatsappNumber ?? "");
      setCertificateName(updated.certificateName ?? "");
      setMessage({ tone: "success", text: labels.saved });

      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error && error.message.startsWith("avatar_")
            ? labels.uploadFailed
            : labels.saveFailed,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void saveProfile(event)} className="grid gap-6">
      <ImageUploader
        key={profile.avatarFileAssetId ?? "no-avatar"}
        label={labels.avatar}
        description={labels.avatarDescription}
        hint={labels.avatarHint}
        currentImageUrl={persistedAvatarUrl}
        selectLabel={labels.uploadAvatar}
        replaceLabel={labels.changeAvatar}
        removeLabel={labels.removeAvatar}
        invalidMessage={labels.invalidAvatar}
        disabled={saving}
        shape="circle"
        allowCurrentRemove
        onFileChange={setSelectedAvatar}
        onRemoveChange={setRemoveAvatarRequested}
      />

      <section className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-content">
              {labels.displayName}
            </span>
            <input
              value={displayName}
              maxLength={160}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={labels.displayNamePlaceholder}
              className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-content">
              {labels.email}
            </span>
            <input
              value={profile.email}
              readOnly
              dir="ltr"
              className="h-11 cursor-not-allowed rounded-md border border-line bg-surface-subtle px-3 text-sm text-muted outline-none"
            />
            <span className="text-xs text-muted">{labels.emailReadonly}</span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-content">
              {labels.whatsapp}
            </span>
            <input
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder={labels.whatsappPlaceholder}
              dir="ltr"
              inputMode="tel"
              maxLength={16}
              pattern="\+[1-9][0-9]{7,14}"
              className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-content">
              {labels.certificateName}
            </span>
            <input
              value={certificateName}
              maxLength={250}
              onChange={(event) => setCertificateName(event.target.value)}
              placeholder={labels.certificateNamePlaceholder}
              className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <div className="grid gap-2 lg:col-span-2">
            <span className="text-sm font-semibold text-content">
              {labels.preferredLanguage}
            </span>
            <LanguageSelect
              locale={locale}
              label={languageLabel}
              className="max-w-xs"
            />
          </div>
        </div>

        {message ? (
          <p
            className={`mt-5 rounded-md px-3 py-2.5 text-sm ${
              message.tone === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end border-t border-line pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {saving ? labels.saving : labels.saveChanges}
          </button>
        </div>
      </section>
    </form>
  );
}
