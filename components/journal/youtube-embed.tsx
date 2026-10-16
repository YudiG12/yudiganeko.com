"use client";

import { useState } from "react";

/** Card de vídeo do YouTube: só carrega o player (youtube-nocookie) quando a pessoa clica. */
export default function YouTubeEmbed({ videoId, title, start }: { videoId: string; title?: string; start?: number }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  return (
    <figure className="flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_10px_24px_-12px_rgba(44,59,77,0.25)]">
      <div className="relative aspect-video w-full bg-abyssal">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0${start ? `&start=${start}` : ""}`}
            title={title || "Vídeo do YouTube"}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Assistir ${title || "vídeo"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <span className="absolute inset-0 bg-[rgba(15,22,30,0.18)] transition-colors group-hover:bg-[rgba(15,22,30,0.1)]" />
            <span className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110 group-active:scale-95">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#2C3B4D">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex items-center gap-3 px-4 py-3.5">
        <svg width="20" height="14" viewBox="0 0 28 20" className="shrink-0">
          <rect width="28" height="20" rx="6" fill="#FF0033" />
          <path d="M11 5.5v9l8-4.5z" fill="#FFFFFF" />
        </svg>
        <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-blue-fantastic">
          {title || "Vídeo no YouTube"}
        </span>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}${start ? `&t=${start}s` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-[10px] px-3 py-1.5 font-mono text-xs text-blue-fantastic ring-1 ring-oatmeal/80 transition hover:bg-palladian"
        >
          YouTube ↗
        </a>
      </figcaption>
    </figure>
  );
}
