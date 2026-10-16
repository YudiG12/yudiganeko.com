"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import type { Category } from "@/lib/journal/types";

/** Filtro por categoria: o fundo escuro desliza até a pílula ativa (sem mudar o layout). */
export default function CategoryFilter({ categories, activeSlug }: { categories: Category[]; activeSlug: string | null }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ left: number; top: number; width: number } | null>(null);
  const items = [{ slug: null as string | null, name: "todos" }, ...categories.map((c) => ({ slug: c.slug, name: c.name.toLowerCase() }))];

  useLayoutEffect(() => {
    const root = wrap.current;
    const measure = () => {
      const el = root?.querySelector<HTMLElement>(`[data-slug="${activeSlug ?? "__all"}"]`);
      if (el) setInd({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth });
    };
    measure();
    root?.querySelector<HTMLElement>(`[data-slug="${activeSlug ?? "__all"}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
    // Fontes e quebras de linha mudam a largura das pílulas depois da primeira medição.
    const ro = new ResizeObserver(measure);
    if (root) ro.observe(root);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [activeSlug]);

  return (
    <div ref={wrap} className="gj-no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
      {ind && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-[30px] rounded-full bg-blue-fantastic transition-[transform,width] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ transform: `translate(${ind.left}px, ${ind.top}px)`, width: ind.width }}
        />
      )}
      {items.map((it) => {
        const active = (it.slug ?? null) === activeSlug;
        return (
          <Link
            key={it.slug ?? "__all"}
            data-slug={it.slug ?? "__all"}
            href={it.slug ? `/journal/categoria/${it.slug}` : "/journal"}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 h-[30px] shrink-0 whitespace-nowrap rounded-full px-3.5 font-mono text-[13px] leading-[30px] tracking-[0.025em] transition-colors duration-200 active:scale-95 ${
              active ? "text-white" : "text-blue-fantastic shadow-[inset_0_0_0_1px_rgba(201,193,177,0.6)] hover:shadow-[inset_0_0_0_1px_#c9c1b1]"
            }`}
          >
            {it.name}
          </Link>
        );
      })}
    </div>
  );
}
