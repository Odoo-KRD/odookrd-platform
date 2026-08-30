"use client";

import type { TrainingCustomerVideoMedia } from "@odookrd/types";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export function BrandedVideoPlayer({
  media,
}: {
  media: TrainingCustomerVideoMedia;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = `/api${media.playbackPath}`;
  const error = failedSource === source;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (media.playbackKind === "MP4") {
      video.src = source;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      queueMicrotask(() => setFailedSource(source));
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      backBufferLength: 30,
      maxBufferLength: 45,
    });
    hls.loadSource(source);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) setFailedSource(source);
    });
    return () => hls.destroy();
  }, [media.playbackKind, source]);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-black">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          controls
          preload="metadata"
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(event) => event.preventDefault()}
          onError={() => setFailedSource(source)}
          onCanPlay={() =>
            setFailedSource((current) => (current === source ? null : current))
          }
          className="h-full w-full bg-black"
        />
        <div className="pointer-events-none absolute start-3 top-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          OdooKRD Training
        </div>
      </div>
      {error ? (
        <p className="border-t border-white/10 px-4 py-3 text-sm text-red-200">
          The protected video stream could not be played.
        </p>
      ) : null}
    </div>
  );
}
