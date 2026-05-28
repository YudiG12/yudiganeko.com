"use client";

import { useEffect, useState } from "react";

// YouTube hover preview — cycles through the 3 alternate thumbnails YouTube
// generates for every video (`1.jpg`, `2.jpg`, `3.jpg` — different timestamps,
// ~3-4 KB each). Light as a feather, no iframe, no streaming.
export function YouTubeHoverPreview({
  videoId,
  thumbnail,
  alt,
}: {
  videoId: string;
  thumbnail: string;
  alt: string;
}) {
  const [hover, setHover] = useState(false);
  const [frame, setFrame] = useState(0);

  // Cycle 0 → 1 → 2 every 700ms while hovered. Resets on mouse-leave.
  useEffect(() => {
    if (!hover) {
      setFrame(0);
      return;
    }
    const id = setInterval(() => setFrame((f) => (f + 1) % 3), 700);
    return () => clearInterval(id);
  }, [hover]);

  const frames = [
    `https://i.ytimg.com/vi/${videoId}/1.jpg`,
    `https://i.ytimg.com/vi/${videoId}/2.jpg`,
    `https://i.ytimg.com/vi/${videoId}/3.jpg`,
  ];

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Static cover thumbnail — base layer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {hover &&
        frames.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
            style={{ opacity: frame === i ? 1 : 0 }}
          />
        ))}
    </div>
  );
}

// Instagram hover preview — for VIDEO/REELS, swaps the static thumb for a
// muted, looping, autoplaying inline video element. For images falls back to
// the static thumb.
export function InstagramHoverPreview({
  mediaType,
  thumbnail,
  videoSrc,
  alt,
}: {
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  thumbnail: string;
  videoSrc?: string;
  alt: string;
}) {
  const [hover, setHover] = useState(false);
  const isVideo = mediaType === "VIDEO" || mediaType === "REELS";
  const canPreview = hover && isVideo && Boolean(videoSrc);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {canPreview && (
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
