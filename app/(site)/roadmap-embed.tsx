"use client";

import { useRef, useState } from "react";

const DURATION = 550;

// O roadmap é outro projeto (repo ganeko-roadmap); embedado pra ter uma fonte só.
// `embed=1` esconde a navbar dele dentro do frame.
export default function RoadmapEmbed({ baseUrl }: { baseUrl: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [expanding, setExpanding] = useState(false);
  const fullUrl = `${baseUrl}/`;

  // Expande o próprio frame até ocupar a tela (o iframe não recarrega, só muda o CSS)
  // e então navega pro site completo.
  function openFull() {
    const el = frameRef.current;
    if (!el || expanding) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign(fullUrl);
      return;
    }

    const r = el.getBoundingClientRect();
    setExpanding(true);
    Object.assign(el.style, {
      position: "fixed",
      zIndex: "60",
      top: `${r.top}px`,
      left: `${r.left}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      transition: "none",
    });
    el.getBoundingClientRect(); // força o layout antes de animar
    Object.assign(el.style, {
      transition: `top ${DURATION}ms, left ${DURATION}ms, width ${DURATION}ms, height ${DURATION}ms, border-radius ${DURATION}ms`,
      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      top: "0px",
      left: "0px",
      width: "100vw",
      height: "100vh",
      borderRadius: "0px",
    });
    setTimeout(() => window.location.assign(fullUrl), DURATION);
  }

  return (
    // Placeholder com a mesma altura, pra página não pular quando o frame vira `fixed`.
    <div className="h-[70vh]">
      <div
        ref={frameRef}
        className="group relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-oatmeal/60 shadow-lg bg-white"
      >
        <iframe
          src={`${baseUrl}/?embed=1`}
          title="Ganeko Roadmap"
          loading="lazy"
          className="h-full w-full"
        />
        <button
          type="button"
          onClick={openFull}
          aria-label="Abrir roadmap em tela cheia"
          title="Abrir em tela cheia"
          className={`absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-blue-fantastic shadow-md ring-1 ring-oatmeal/60 backdrop-blur-sm transition hover:scale-110 hover:bg-white ${
            expanding ? "opacity-0" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
