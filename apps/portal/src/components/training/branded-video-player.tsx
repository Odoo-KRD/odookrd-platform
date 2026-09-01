"use client";

import type {
  Locale,
  TrainingCustomerVideoEnrichment,
  TrainingCustomerVideoMedia,
  TrainingPlayerSettings,
} from "@odookrd/types";
import {
  Captions,
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Track,
  useMediaState,
  type MediaProviderAdapter,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import Hls from "hls.js";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

function chapterTitle(
  chapter: TrainingCustomerVideoEnrichment["chapters"][number],
  locale: Locale,
): string {
  return (
    chapter.titleTranslations[locale] ??
    chapter.titleTranslations.ku ??
    chapter.titleTranslations.en ??
    chapter.titleTranslations.ar ??
    chapter.title
  );
}

function vttTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(remaining).padStart(2, "0")}.000`;
}

type CaptionStyle = CSSProperties & {
  [name: `--${string}`]: string | number | null | undefined;
};

function ManagedCaptions({
  settings,
}: {
  settings: TrainingPlayerSettings["captions"];
}) {
  const textTrack = useMediaState("textTrack");
  const language = textTrack?.language?.toLowerCase() ?? "";
  const rtl = /^(ar|ku|ckb|fa|he)(?:-|$)/.test(language);

  const alpha = Math.max(0, Math.min(1, settings.backgroundOpacity / 100));
  const background =
    settings.background === "none"
      ? "transparent"
      : settings.background === "light"
        ? `rgba(0, 0, 0, ${alpha * 0.35})`
        : settings.background === "medium"
          ? `rgba(0, 0, 0, ${alpha * 0.6})`
          : settings.background === "solid"
            ? "rgba(0, 0, 0, 1)"
            : `rgba(0, 0, 0, ${alpha})`;

  const fontSize = {
    small: "clamp(18px, calc(var(--overlay-height) / 100 * 2.0), 22px)",
    medium: "clamp(21px, calc(var(--overlay-height) / 100 * 2.3), 25px)",
    large: "clamp(24px, calc(var(--overlay-height) / 100 * 2.7), 29px)",
    xlarge: "clamp(30px, calc(var(--overlay-height) / 100 * 3.3), 35px)",
  }[settings.fontSize];

  const textShadow =
    settings.edgeStyle === "none"
      ? "none"
      : settings.edgeStyle === "strong"
        ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 3px #000"
        : "0 1px 2px rgba(0,0,0,.95), 0 0 3px rgba(0,0,0,.75)";

  const style: CaptionStyle = {
    "--overlay-padding": "1.5%",
    "--cue-color": settings.textColor === "yellow" ? "#fde047" : "#ffffff",
    "--cue-bg-color": background,
    "--cue-font-size": fontSize,
    "--cue-line-height": "calc(var(--cue-font-size) * 1.28)",
    "--cue-padding-x": "calc(var(--cue-font-size) * 0.42)",
    "--cue-padding-y": "calc(var(--cue-font-size) * 0.22)",
    "--cue-text-shadow": textShadow,
    "--odookrd-caption-max-width": `${settings.maxWidthPercent}%`,
  };

  return (
    <Captions
      className="vds-captions odookrd-managed-captions"
      textDir={rtl ? "rtl" : "ltr"}
      data-position={settings.position}
      style={style}
    />
  );
}

export function BrandedVideoPlayer({
  media,
  title = "OdooKRD Training",
  enrichment,
  locale = "en",
  autoPlay = true,
  playerSettings,
  chapterTrackLabel = "Chapters",
}: {
  media: TrainingCustomerVideoMedia;
  title?: string;
  enrichment?: TrainingCustomerVideoEnrichment;
  locale?: Locale;
  autoPlay?: boolean;
  playerSettings?: TrainingPlayerSettings;
  chapterTrackLabel?: string;
}) {
  const protectedPath = `/api${media.playbackPath}`;
  const [source, setSource] = useState<string | null>(null);
  const settings: TrainingPlayerSettings = playerSettings ?? {
    autoplay: true,
    defaultPlaybackRate: "1",
    seekSeconds: 10,
    controlsAutoHideSeconds: 2,
    showFullscreen: true,
    showVolume: true,
    showChapters: true,
    showSpeedControl: true,
    showQualitySelector: true,
    branding: {
      enabled: true,
      text: "OdooKRD Training",
    },
    captions: {
      defaultBehavior: "prefer_learner_language",
      fontSize: "medium",
      textColor: "white",
      background: "dark",
      backgroundOpacity: 75,
      edgeStyle: "soft",
      position: "bottom",
      maxWidthPercent: 90,
    },
  };
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setSource(new URL(protectedPath, window.location.origin).href);
    });

    return () => {
      cancelled = true;
    };
  }, [protectedPath]);

  const preferredCaptionId = useMemo(() => {
    const captions = enrichment?.captions ?? [];
    if (settings.captions.defaultBehavior === "off") return null;
    if (settings.captions.defaultBehavior === "prefer_learner_language") {
      const preferred = captions.find(
        (track) =>
          track.languageCode.toLowerCase() === locale.toLowerCase() ||
          track.languageCode.toLowerCase().split("-")[0] ===
            locale.toLowerCase(),
      );
      if (preferred) return preferred.id;
    }
    return captions.find((track) => track.isDefault)?.id ?? null;
  }, [enrichment?.captions, locale, settings.captions.defaultBehavior]);

  const chapterTrack = useMemo(() => {
    const chapters = enrichment?.chapters ?? [];
    if (chapters.length === 0) return null;

    const ordered = [...chapters].sort(
      (left, right) => left.startSeconds - right.startSeconds,
    );
    const duration =
      media.durationSeconds && media.durationSeconds > 0
        ? media.durationSeconds
        : ordered[ordered.length - 1].startSeconds + 1;
    const lines = ["WEBVTT", ""];

    ordered.forEach((chapter, index) => {
      const end =
        ordered[index + 1]?.startSeconds ??
        Math.max(duration, chapter.startSeconds + 1);
      lines.push(
        `${vttTimestamp(chapter.startSeconds)} --> ${vttTimestamp(end)}`,
        chapterTitle(chapter, locale),
        "",
      );
    });

    return `data:text/vtt;charset=utf-8,${encodeURIComponent(lines.join("\n"))}`;
  }, [enrichment?.chapters, locale, media.durationSeconds]);

  function configureProvider(provider: MediaProviderAdapter | null): void {
    if (!isHLSProvider(provider)) return;

    provider.library = Hls;
    provider.config = {
      enableWorker: true,
      backBufferLength: 30,
      maxBufferLength: 45,
    };
  }

  if (!source) {
    return (
      <div className="flex h-full min-h-64 w-full items-center justify-center bg-slate-950">
        <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  return (
    <MediaPlayer
      dir="ltr"
      title={title}
      autoPlay={autoPlay && settings.autoplay}
      playbackRate={Number(settings.defaultPlaybackRate)}
      controlsDelay={settings.controlsAutoHideSeconds * 1000}
      src={{
        src: source,
        type:
          media.playbackKind === "HLS"
            ? "application/vnd.apple.mpegurl"
            : "video/mp4",
      }}
      playsInline
      load="eager"
      onContextMenu={(event) => event.preventDefault()}
      onProviderChange={configureProvider}
      className="odookrd-video-player"
      data-show-speed={String(settings.showSpeedControl)}
      data-show-quality={String(settings.showQualitySelector)}
      data-show-playback-menu={String(
        settings.showSpeedControl || settings.showQualitySelector,
      )}
    >
      <MediaProvider>
        {(enrichment?.captions ?? []).map((track) => (
          <Track
            key={track.id}
            src={new URL(`/api${track.contentPath}`, source).href}
            kind="subtitles"
            label={track.label}
            lang={track.languageCode}
            type="vtt"
            default={track.id === preferredCaptionId}
          />
        ))}
        {chapterTrack && settings.showChapters ? (
          <Track
            src={chapterTrack}
            kind="chapters"
            label={chapterTrackLabel}
            lang={locale}
            type="vtt"
            default
          />
        ) : null}
      </MediaProvider>

      <DefaultVideoLayout
        icons={defaultLayoutIcons}
        colorScheme="dark"
        hideQualityBitrate
        smallLayoutWhen={false}
        seekStep={settings.seekSeconds}
        slots={{
          captions: <ManagedCaptions settings={settings.captions} />,
          fullscreenButton: settings.showFullscreen ? undefined : null,
          muteButton: settings.showVolume ? undefined : null,
          volumeSlider: settings.showVolume ? undefined : null,
          chaptersMenu: settings.showChapters ? undefined : null,
          chapterTitle: settings.showChapters ? undefined : null,
        }}
      />

      {settings.branding.enabled && settings.branding.text.trim() ? (
        <div className="pointer-events-none absolute start-4 top-4 z-20 max-w-[70%] truncate rounded-md bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {settings.branding.text}
        </div>
      ) : null}
    </MediaPlayer>
  );
}
