"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type Photo = { src: string; width: number; height: number };

export default function PhotoGallery({ photos, alt }: { photos: Photo[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:thin]">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Ampliar foto ${i + 1} de ${photos.length}`}
            className="group relative shrink-0 snap-start overflow-hidden rounded-xl cursor-zoom-in ring-1 ring-oatmeal/60 dark:ring-blue-fantastic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burning-flame"
          >
            <Image
              src={photo.src}
              alt={`${alt} — foto ${i + 1}`}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 640px) 60vw, 320px"
              className="h-48 sm:h-56 w-auto object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={close}
          onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touchStartX.current = null;
          }}
          className="animate-lightbox-fade fixed inset-0 z-50 flex items-center justify-center bg-abyssal/95 backdrop-blur-sm p-4 sm:p-12"
        >
          <LightboxImage key={current.src} photo={current} alt={`${alt} — foto ${open + 1}`} />

          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-palladian/10 text-palladian text-xl hover:bg-palladian/20 transition-colors"
          >
            ✕
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Foto anterior"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-palladian/10 text-palladian text-2xl hover:bg-palladian/20 transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Próxima foto"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-palladian/10 text-palladian text-2xl hover:bg-palladian/20 transition-colors"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-palladian/10 px-3 py-1 text-xs text-palladian/80">
                {open + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function LightboxImage({ photo, alt }: { photo: Photo; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={photo.src}
      alt={alt}
      width={photo.width}
      height={photo.height}
      sizes="100vw"
      onLoad={() => setLoaded(true)}
      onClick={(e) => e.stopPropagation()}
      className={`max-h-full max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl ${
        loaded ? "animate-lightbox-zoom" : "opacity-0"
      }`}
    />
  );
}
