"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** Carrossel horizontal com snap, arrastar no trackpad/dedo e setas que andam um card por vez. */
export default function ArticleCarousel({ children, allHref = "/journal" }: { children: ReactNode; allHref?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * amount, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="flex flex-col">
      <div
        ref={track}
        onScroll={update}
        className="gj-no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pb-3 pt-10 md:-ml-0 md:-mr-10 md:pl-0 md:pr-10 md:scroll-pl-0 lg:-mr-30 lg:pr-30 xl:-mr-60 xl:pr-60"
      >
        {children}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Link
          href={allHref}
          className="group inline-flex items-center gap-1.5 font-mono text-sm tracking-[0.025em] text-truffle-trouble"
        >
          <span className="underline decoration-truffle-trouble/35 underline-offset-4 transition-colors group-hover:decoration-truffle-trouble">
            ver todos os artigos
          </span>
          <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
        <div className="hidden gap-2 sm:flex">
          {([-1, 1] as const).map((dir) => {
            const enabled = dir === -1 ? canPrev : canNext;
            return (
              <button
                key={dir}
                type="button"
                onClick={() => step(dir)}
                disabled={!enabled}
                aria-label={dir === -1 ? "Artigos anteriores" : "Próximos artigos"}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-fantastic ring-1 ring-oatmeal/60 transition-all duration-200 enabled:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.08)] enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:active:scale-95 disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={dir === -1 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
